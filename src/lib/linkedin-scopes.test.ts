import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LinkedInAuthRow } from "@/lib/admin-db";

const settings = new Map<string, string>();
const stored: { auth: LinkedInAuthRow | null } = { auth: null };

// These modules are server-only; the guard package throws outside Next.
vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin-db", () => ({
  getLinkedInAuth: async () => stored.auth,
  saveLinkedInAuth: async (auth: LinkedInAuthRow) => {
    stored.auth = auth;
  },
}));

vi.mock("@/lib/app-settings", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/app-settings")>(
      "@/lib/app-settings",
    );
  return {
    ...actual,
    getAppSetting: async (key: string) => settings.get(key) ?? null,
    getSiteOriginFromSettings: async () => "https://example.com",
  };
});

const { APP_SETTING_KEYS } = await import("@/lib/app-settings");
const { buildLinkedInAuthUrl, getLinkedInConnectionStatus } = await import(
  "@/lib/linkedin"
);

function authRow(scope: string | null): LinkedInAuthRow {
  return {
    access_token: "token",
    refresh_token: null,
    expires_at: Date.now() + 3_600_000,
    member_urn: "urn:li:person:abc",
    updated_at: Date.now(),
    scope,
  };
}

async function requestedScopes(): Promise<string[]> {
  const url = new URL(await buildLinkedInAuthUrl("state-123"));
  return (url.searchParams.get("scope") ?? "").split(" ").filter(Boolean);
}

beforeEach(() => {
  settings.clear();
  settings.set(APP_SETTING_KEYS.linkedinClientId, "client-id");
  stored.auth = null;
});

describe("requested OAuth scopes", () => {
  it("only requests scopes a standard LinkedIn app is authorized for", async () => {
    expect(await requestedScopes()).toEqual([
      "openid",
      "profile",
      "email",
      "w_member_social",
    ]);
  });

  it("omits Community Management scopes unless the advanced flag is on", async () => {
    // LinkedIn fails the whole authorization request with
    // unauthorized_scope_error if the app is not approved for a scope.
    const scopes = await requestedScopes();
    expect(scopes).not.toContain("w_member_social_feed");
    expect(scopes).not.toContain("r_member_social");
  });

  it("adds Community Management scopes when the advanced flag is on", async () => {
    settings.set(APP_SETTING_KEYS.linkedinAdvancedScopes, "true");
    const scopes = await requestedScopes();
    expect(scopes).toContain("r_member_social");
    expect(scopes).toContain("w_member_social_feed");
  });
});

describe("granted scope reporting", () => {
  it("reports comment reading as unavailable for a write-only grant", async () => {
    stored.auth = authRow("openid profile email w_member_social");
    const status = await getLinkedInConnectionStatus();
    expect(status.connected).toBe(true);
    expect(status.canReadComments).toBe(false);
    expect(status.grantedScopes).toContain("w_member_social");
  });

  it("reports comment reading as available once r_member_social is granted", async () => {
    stored.auth = authRow("openid profile email w_member_social r_member_social");
    const status = await getLinkedInConnectionStatus();
    expect(status.canReadComments).toBe(true);
  });

  it("treats a connection with no recorded scope as unknown, not permitted", async () => {
    stored.auth = authRow(null);
    const status = await getLinkedInConnectionStatus();
    expect(status.connected).toBe(true);
    expect(status.grantedScopes).toEqual([]);
    expect(status.canReadComments).toBe(false);
  });

  it("reports nothing granted when disconnected", async () => {
    const status = await getLinkedInConnectionStatus();
    expect(status.connected).toBe(false);
    expect(status.grantedScopes).toEqual([]);
    expect(status.canReadComments).toBe(false);
  });
});
