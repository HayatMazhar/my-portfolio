import "server-only";

import bcrypt from "bcryptjs";
import { randomBytes, timingSafeEqual } from "crypto";
import { getAppSettingRow, setAppSettingRow } from "@/lib/admin-db";

/** Keys persisted in app_settings (SQLite on server). Env vars are optional fallbacks. */
export const APP_SETTING_KEYS = {
  adminPasswordHash: "admin_password_hash",
  adminSessionSecret: "admin_session_secret",
  siteUrl: "site_url",
  groqApiKey: "groq_api_key",
  geminiApiKey: "gemini_api_key",
  pineconeApiKey: "pinecone_api_key",
  cohereApiKey: "cohere_api_key",
  linkedinClientId: "linkedin_client_id",
  linkedinClientSecret: "linkedin_client_secret",
  linkedinRedirectUri: "linkedin_redirect_uri",
  adminCronSecret: "admin_cron_secret",
} as const;

export type AppSettingKey =
  (typeof APP_SETTING_KEYS)[keyof typeof APP_SETTING_KEYS];

const SECRET_KEYS = new Set<string>([
  APP_SETTING_KEYS.adminPasswordHash,
  APP_SETTING_KEYS.adminSessionSecret,
  APP_SETTING_KEYS.groqApiKey,
  APP_SETTING_KEYS.geminiApiKey,
  APP_SETTING_KEYS.pineconeApiKey,
  APP_SETTING_KEYS.cohereApiKey,
  APP_SETTING_KEYS.linkedinClientSecret,
  APP_SETTING_KEYS.adminCronSecret,
]);

const ENV_FALLBACK: Partial<Record<AppSettingKey, string>> = {
  [APP_SETTING_KEYS.adminSessionSecret]: "ADMIN_SESSION_SECRET",
  [APP_SETTING_KEYS.siteUrl]: "NEXT_PUBLIC_SITE_URL",
  [APP_SETTING_KEYS.groqApiKey]: "GROQ_API_KEY",
  [APP_SETTING_KEYS.geminiApiKey]: "GEMINI_API_KEY",
  [APP_SETTING_KEYS.pineconeApiKey]: "PINECONE_API_KEY",
  [APP_SETTING_KEYS.cohereApiKey]: "COHERE_API_KEY",
  [APP_SETTING_KEYS.linkedinClientId]: "LINKEDIN_CLIENT_ID",
  [APP_SETTING_KEYS.linkedinClientSecret]: "LINKEDIN_CLIENT_SECRET",
  [APP_SETTING_KEYS.linkedinRedirectUri]: "LINKEDIN_REDIRECT_URI",
  [APP_SETTING_KEYS.adminCronSecret]: "ADMIN_CRON_SECRET",
};

export function hashAdminPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function getStoredPasswordHashKind(
  stored: string | null | undefined,
): "bcrypt" | "env" | "legacy" | "missing" {
  if (!stored?.trim()) return "missing";
  if (stored.startsWith("env:")) return "env";
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) return "bcrypt";
  return "legacy";
}

export function verifyAdminPasswordHash(
  password: string,
  stored: string,
): boolean {
  try {
    if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
      return bcrypt.compareSync(password, stored);
    }

    // Legacy pbkdf2/scrypt hashes can crash Node on some shared hosts.
    // Re-run deploy packaging or change password in Admin -> Settings.
    if (
      stored.startsWith("pbkdf2:") ||
      (stored.includes(":") && !stored.startsWith("env:"))
    ) {
      return false;
    }

    return false;
  } catch {
    return false;
  }
}

export function generateSecret(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export async function getAppSetting(key: AppSettingKey): Promise<string | null> {
  const row = await getAppSettingRow(key);
  if (row?.trim()) return row.trim();

  const envName = ENV_FALLBACK[key];
  if (envName) {
    const envVal = process.env[envName]?.trim();
    if (envVal) return envVal;
  }

  if (key === APP_SETTING_KEYS.adminPasswordHash) {
    const plain = process.env.ADMIN_PASSWORD?.trim();
    if (plain) return `env:${plain}`;
  }

  return null;
}

export async function setAppSetting(
  key: AppSettingKey,
  value: string,
): Promise<void> {
  await setAppSettingRow(key, value.trim());
}

export async function setAppSettings(
  entries: Partial<Record<AppSettingKey, string>>,
): Promise<void> {
  for (const [key, value] of Object.entries(entries) as [AppSettingKey, string][]) {
    if (value !== undefined) {
      await setAppSetting(key, value);
    }
  }
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export interface AppSettingsView {
  configured: boolean;
  siteUrl: string;
  groqApiKey: string;
  geminiApiKey: string;
  pineconeApiKey: string;
  cohereApiKey: string;
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinRedirectUri: string;
  adminCronSecret: string;
  hasPassword: boolean;
  hasGroq: boolean;
  hasLinkedIn: boolean;
  /** True when values exist in DB (not only env). */
  storedInApp: Record<string, boolean>;
}

export async function getAppSettingsView(): Promise<AppSettingsView> {
  const keys = Object.values(APP_SETTING_KEYS);
  const values = await Promise.all(keys.map((k) => getAppSetting(k)));

  const map = Object.fromEntries(
    keys.map((k, i) => [k, values[i]]),
  ) as Record<AppSettingKey, string | null>;

  const dbRows = await Promise.all(keys.map((k) => getAppSettingRow(k)));
  const storedInApp = Object.fromEntries(
    keys.map((k, i) => [k, Boolean(dbRows[i]?.trim())]),
  );

  const passwordHash = map[APP_SETTING_KEYS.adminPasswordHash];
  const sessionSecret = map[APP_SETTING_KEYS.adminSessionSecret];

  const siteUrl =
    map[APP_SETTING_KEYS.siteUrl] ||
    process.env.URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const redirectDefault = `${siteUrl.replace(/\/$/, "")}/api/admin/linkedin/callback`;

  return {
    configured: Boolean(passwordHash && sessionSecret),
    siteUrl,
    groqApiKey: map[APP_SETTING_KEYS.groqApiKey]
      ? maskSecret(map[APP_SETTING_KEYS.groqApiKey]!)
      : "",
    geminiApiKey: map[APP_SETTING_KEYS.geminiApiKey]
      ? maskSecret(map[APP_SETTING_KEYS.geminiApiKey]!)
      : "",
    pineconeApiKey: map[APP_SETTING_KEYS.pineconeApiKey]
      ? maskSecret(map[APP_SETTING_KEYS.pineconeApiKey]!)
      : "",
    cohereApiKey: map[APP_SETTING_KEYS.cohereApiKey]
      ? maskSecret(map[APP_SETTING_KEYS.cohereApiKey]!)
      : "",
    linkedinClientId: map[APP_SETTING_KEYS.linkedinClientId] || "",
    linkedinClientSecret: map[APP_SETTING_KEYS.linkedinClientSecret]
      ? maskSecret(map[APP_SETTING_KEYS.linkedinClientSecret]!)
      : "",
    linkedinRedirectUri:
      map[APP_SETTING_KEYS.linkedinRedirectUri] || redirectDefault,
    adminCronSecret: map[APP_SETTING_KEYS.adminCronSecret]
      ? maskSecret(map[APP_SETTING_KEYS.adminCronSecret]!)
      : "",
    hasPassword: Boolean(passwordHash),
    hasGroq: Boolean(map[APP_SETTING_KEYS.groqApiKey]),
    hasLinkedIn: Boolean(
      map[APP_SETTING_KEYS.linkedinClientId] &&
        map[APP_SETTING_KEYS.linkedinClientSecret],
    ),
    storedInApp,
  };
}

export async function isAppAdminConfigured(): Promise<boolean> {
  const [passwordHash, sessionSecret] = await Promise.all([
    getAppSetting(APP_SETTING_KEYS.adminPasswordHash),
    getAppSetting(APP_SETTING_KEYS.adminSessionSecret),
  ]);
  return Boolean(passwordHash && sessionSecret);
}

export async function getSiteOriginFromSettings(): Promise<string> {
  const site =
    (await getAppSetting(APP_SETTING_KEYS.siteUrl)) ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.URL?.trim() ||
    "http://localhost:3000";
  return site.replace(/\/$/, "");
}

export async function resolveGroqApiKey(): Promise<string | null> {
  return getAppSetting(APP_SETTING_KEYS.groqApiKey);
}

export async function verifyCronSecret(provided: string | null): Promise<boolean> {
  const expected = await getAppSetting(APP_SETTING_KEYS.adminCronSecret);
  if (!expected || !provided) return false;
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export { SECRET_KEYS };
