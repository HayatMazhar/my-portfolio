import "server-only";

import {
  APP_SETTING_KEYS,
  getAppSetting,
  type AppSettingKey,
} from "@/lib/app-settings";
import { getLinkedInAuth } from "@/lib/admin-db";

/**
 * Live health checks for the third-party keys the studio depends on.
 *
 * No provider exposes an expiry date for an API key, so "will it expire soon"
 * is not answerable — but "does it still work right now" is, with one cheap
 * authenticated call each. The LinkedIn token is the exception: OAuth gives a
 * real expiry, so that one gets a genuine countdown.
 */

const PROBE_TIMEOUT_MS = 8_000;

/** Warn this far ahead of the LinkedIn token expiring. */
const LINKEDIN_WARN_DAYS = 10;

export type KeyState = "ok" | "invalid" | "missing" | "expiring" | "unknown";

export interface KeyHealth {
  id: string;
  label: string;
  state: KeyState;
  detail: string;
  /** Only set where a real expiry exists (OAuth tokens). */
  expiresInDays?: number;
  /** True when this needs attention now. */
  actionNeeded: boolean;
}

async function probe(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return {
      ok: res.ok,
      status: res.status,
      detail: res.ok ? "Key accepted." : `Provider returned ${res.status}.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      detail:
        err instanceof Error && err.name === "AbortError"
          ? "Provider did not respond in time."
          : "Could not reach the provider.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** A 401/403 means the key is bad; anything else is a provider-side problem. */
function stateFromProbe(result: {
  ok: boolean;
  status: number;
}): "ok" | "invalid" | "unknown" {
  if (result.ok) return "ok";
  return result.status === 401 || result.status === 403 ? "invalid" : "unknown";
}

async function checkKey(
  id: string,
  label: string,
  settingKey: AppSettingKey,
  build: (key: string) => { url: string; init: RequestInit },
): Promise<KeyHealth> {
  const key = await getAppSetting(settingKey);
  if (!key) {
    return {
      id,
      label,
      state: "missing",
      detail: "Not configured.",
      actionNeeded: false,
    };
  }

  const { url, init } = build(key);
  const result = await probe(url, init);
  const state = stateFromProbe(result);
  return {
    id,
    label,
    state,
    detail: result.detail,
    actionNeeded: state === "invalid",
  };
}

async function checkLinkedIn(): Promise<KeyHealth> {
  const base = { id: "linkedin", label: "LinkedIn token" };
  let auth: Awaited<ReturnType<typeof getLinkedInAuth>> = null;
  try {
    auth = await getLinkedInAuth();
  } catch {
    return {
      ...base,
      state: "unknown",
      detail: "Could not read the stored token.",
      actionNeeded: false,
    };
  }

  if (!auth) {
    return {
      ...base,
      state: "missing",
      detail: "Not connected.",
      actionNeeded: false,
    };
  }

  const msLeft = auth.expires_at - Date.now();
  const days = Math.floor(msLeft / 86_400_000);

  if (msLeft <= 0) {
    return {
      ...base,
      state: "invalid",
      detail: "Expired — reconnect in Settings.",
      expiresInDays: 0,
      actionNeeded: true,
    };
  }

  const expiring = days <= LINKEDIN_WARN_DAYS;
  return {
    ...base,
    state: expiring ? "expiring" : "ok",
    detail: expiring
      ? `Expires in ${days} day${days === 1 ? "" : "s"} — reconnect soon.`
      : `Valid for ${days} more days.`,
    expiresInDays: days,
    actionNeeded: expiring,
  };
}

export async function getKeyHealth(): Promise<{
  keys: KeyHealth[];
  actionNeeded: number;
  checkedAt: number;
}> {
  const keys = await Promise.all([
    checkKey("groq", "Groq", APP_SETTING_KEYS.groqApiKey, (key) => ({
      url: "https://api.groq.com/openai/v1/models",
      init: { headers: { Authorization: `Bearer ${key}` } },
    })),
    checkKey("gemini", "Gemini", APP_SETTING_KEYS.geminiApiKey, (key) => ({
      url: "https://generativelanguage.googleapis.com/v1beta/models",
      init: { headers: { "x-goog-api-key": key } },
    })),
    checkKey("cohere", "Cohere", APP_SETTING_KEYS.cohereApiKey, (key) => ({
      url: "https://api.cohere.com/v1/models?page_size=1",
      init: { headers: { Authorization: `Bearer ${key}` } },
    })),
    checkKey("pinecone", "Pinecone", APP_SETTING_KEYS.pineconeApiKey, (key) => ({
      url: "https://api.pinecone.io/indexes",
      init: { headers: { "Api-Key": key, "X-Pinecone-API-Version": "2024-07" } },
    })),
    checkLinkedIn(),
  ]);

  return {
    keys,
    actionNeeded: keys.filter((key) => key.actionNeeded).length,
    checkedAt: Date.now(),
  };
}
