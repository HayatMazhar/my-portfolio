import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { ADMIN_COOKIE } from "@/lib/admin-cookie";
import { APP_SETTING_KEYS, getAppSetting } from "@/lib/app-settings";

export { ADMIN_COOKIE };

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function getSessionSecret(): Promise<string | null> {
  return getAppSetting(APP_SETTING_KEYS.adminSessionSecret);
}

export async function createSessionToken(): Promise<string | null> {
  const secret = await getSessionSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, v: 1 }),
  ).toString("base64url");
  const sig = signPayload(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  const secret = await getSessionSecret();
  if (!secret || !token) return false;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expected = signPayload(payload, secret);
  try {
    if (expected.length !== sig.length) return false;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  } catch {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

async function cookieSecureFlag(): Promise<boolean> {
  const siteUrl = await getAppSetting(APP_SETTING_KEYS.siteUrl);
  if (siteUrl?.startsWith("https://")) return true;
  if (siteUrl?.startsWith("http://")) return false;
  return process.env.NODE_ENV === "production";
}

export async function buildSessionCookieHeader(token: string): Promise<string> {
  const secure = await cookieSecureFlag();
  const parts = [
    `${ADMIN_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_MS / 1000}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export async function buildClearSessionCookieHeader(): Promise<string> {
  const secure = await cookieSecureFlag();
  const parts = [
    `${ADMIN_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
