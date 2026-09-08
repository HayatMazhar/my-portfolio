import { createHmac, timingSafeEqual } from "crypto";
import { getAdminSessionToken } from "@/lib/admin-cookie-server";
import { ADMIN_COOKIE } from "@/lib/admin-cookie";
import {
  createSessionToken,
  verifySessionToken,
  buildClearSessionCookieHeader,
  buildSessionCookieHeader,
} from "@/lib/admin-session";
import {
  APP_SETTING_KEYS,
  getAppSetting,
  isAppAdminConfigured,
  verifyAdminPasswordHash,
} from "@/lib/app-settings";

export { ADMIN_COOKIE };
export {
  createSessionToken,
  verifySessionToken,
  buildSessionCookieHeader,
  buildClearSessionCookieHeader,
} from "@/lib/admin-session";

export async function isAdminConfigured(): Promise<boolean> {
  return isAppAdminConfigured();
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const stored = await getAppSetting(APP_SETTING_KEYS.adminPasswordHash);
    if (!stored) return false;

    if (stored.startsWith("env:")) {
      const plain = stored.slice(4);
      if (plain.length !== password.length) return false;
      try {
        return timingSafeEqual(Buffer.from(plain), Buffer.from(password));
      } catch {
        return false;
      }
    }

    return verifyAdminPasswordHash(password, stored);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!(await isAdminConfigured())) return false;
  return verifySessionToken(await getAdminSessionToken());
}

/** @deprecated Prefer buildSessionCookieHeader in route handlers on shared hosting. */
export async function sessionCookieOptions(token: string) {
  const siteUrl = await getAppSetting(APP_SETTING_KEYS.siteUrl);
  const secure =
    siteUrl?.startsWith("https://") ??
    (process.env.NODE_ENV === "production" && !siteUrl?.startsWith("http://"));

  return {
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: Boolean(secure),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}

/** @deprecated Prefer buildClearSessionCookieHeader in route handlers on shared hosting. */
export async function clearSessionCookieOptions() {
  const siteUrl = await getAppSetting(APP_SETTING_KEYS.siteUrl);
  const secure =
    siteUrl?.startsWith("https://") ??
    (process.env.NODE_ENV === "production" && !siteUrl?.startsWith("http://"));

  return {
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    secure: Boolean(secure),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
