import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-cookie";
import {
  APP_SETTING_KEYS,
  getAppSetting,
  getStoredPasswordHashKind,
  isAppAdminConfigured,
  verifyAdminPasswordHash,
} from "@/lib/app-settings";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signSessionPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

async function createSessionToken(): Promise<string | null> {
  const secret = await getAppSetting(APP_SETTING_KEYS.adminSessionSecret);
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, v: 1 }),
  ).toString("base64url");
  return `${payload}.${signSessionPayload(payload, secret)}`;
}

async function buildSessionCookieHeader(token: string): Promise<string> {
  const siteUrl = await getAppSetting(APP_SETTING_KEYS.siteUrl);
  const secure = siteUrl?.startsWith("https://") ?? process.env.NODE_ENV === "production";
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

async function verifyPassword(password: string): Promise<boolean> {
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

export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, "admin-login", { limit: 10, windowMs: 300_000 });
    if (limited) return limited;

    if (!(await isAppAdminConfigured())) {
      return NextResponse.json(
        { error: "Complete setup first at /admin/setup" },
        { status: 503 },
      );
    }

    let password = "";
    try {
      const body = (await req.json()) as { password?: string };
      password = body.password?.trim() ?? "";
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const stored = await getAppSetting(APP_SETTING_KEYS.adminPasswordHash);
    const hashKind = getStoredPasswordHashKind(stored);
    if (hashKind === "legacy") {
      return NextResponse.json(
        {
          error:
            "Admin password hash is outdated for this server. Re-upload .data/admin-store.json from the latest deploy zip, or reset via /admin/setup.",
        },
        { status: 503 },
      );
    }

    if (!(await verifyPassword(password))) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const token = await createSessionToken();
    if (!token) {
      return NextResponse.json({ error: "Session creation failed." }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    response.headers.append("Set-Cookie", await buildSessionCookieHeader(token));
    return response;
  } catch (err) {
    console.error("admin login failed:", err);
    return NextResponse.json(
      { error: "Login failed on the server. Try again or redo /admin/setup." },
      { status: 500 },
    );
  }
}
