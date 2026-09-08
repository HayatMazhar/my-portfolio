import { NextResponse } from "next/server";
import {
  APP_SETTING_KEYS,
  generateSecret,
  getAppSettingsView,
  hashAdminPassword,
  isAppAdminConfigured,
  setAppSettings,
} from "@/lib/app-settings";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = await isAppAdminConfigured();
  const view = await getAppSettingsView();
  return NextResponse.json({ configured, siteUrl: view.siteUrl });
}

export async function POST(req: Request) {
  if (await isAppAdminConfigured()) {
    return NextResponse.json({ error: "Already configured." }, { status: 409 });
  }

  const limited = rateLimit(req, "admin-setup", { limit: 5, windowMs: 600_000 });
  if (limited) return limited;

  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const password = body.password?.trim() ?? "";
  const confirm = body.confirmPassword?.trim() ?? "";
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (password !== confirm) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const groqKey = body.groqApiKey?.trim() ?? "";
  if (groqKey && !/^gsk_[A-Za-z0-9_-]{10,}$/.test(groqKey)) {
    return NextResponse.json(
      {
        error:
          "Groq API key must start with gsk_ and come from console.groq.com.",
      },
      { status: 400 },
    );
  }

  const siteUrl =
    body.siteUrl?.trim().replace(/\/$/, "") || "http://localhost:3000";

  await setAppSettings({
    [APP_SETTING_KEYS.adminPasswordHash]: hashAdminPassword(password),
    [APP_SETTING_KEYS.adminSessionSecret]: generateSecret(32),
    [APP_SETTING_KEYS.siteUrl]: siteUrl,
    ...(body.groqApiKey?.trim()
      ? { [APP_SETTING_KEYS.groqApiKey]: body.groqApiKey.trim() }
      : {}),
    ...(body.linkedinClientId?.trim()
      ? { [APP_SETTING_KEYS.linkedinClientId]: body.linkedinClientId.trim() }
      : {}),
    ...(body.linkedinClientSecret?.trim()
      ? {
          [APP_SETTING_KEYS.linkedinClientSecret]:
            body.linkedinClientSecret.trim(),
        }
      : {}),
  });

  const redirectUri = `${siteUrl}/api/admin/linkedin/callback`;
  await setAppSettings({
    [APP_SETTING_KEYS.linkedinRedirectUri]: redirectUri,
  });

  return NextResponse.json({ ok: true, redirectUri });
}
