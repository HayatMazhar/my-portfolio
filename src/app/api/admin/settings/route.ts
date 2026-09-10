import { NextResponse } from "next/server";
import {
  APP_SETTING_KEYS,
  generateSecret,
  getAppSettingsView,
  hashAdminPassword,
  setAppSettings,
  verifyAdminPasswordHash,
  getAppSetting,
} from "@/lib/app-settings";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MASK = /••••/;

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAppSettingsView();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(req, "admin-settings", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const updates: Partial<Record<string, string>> = {};

  const fieldMap: Record<string, string> = {
    siteUrl: APP_SETTING_KEYS.siteUrl,
    groqApiKey: APP_SETTING_KEYS.groqApiKey,
    geminiApiKey: APP_SETTING_KEYS.geminiApiKey,
    pineconeApiKey: APP_SETTING_KEYS.pineconeApiKey,
    cohereApiKey: APP_SETTING_KEYS.cohereApiKey,
    linkedinClientId: APP_SETTING_KEYS.linkedinClientId,
    linkedinClientSecret: APP_SETTING_KEYS.linkedinClientSecret,
    linkedinRedirectUri: APP_SETTING_KEYS.linkedinRedirectUri,
    linkedinOrganizationUrn: APP_SETTING_KEYS.linkedinOrganizationUrn,
    linkedinAdvancedScopes: APP_SETTING_KEYS.linkedinAdvancedScopes,
    replyPlaybook: APP_SETTING_KEYS.replyPlaybook,
    adminCronSecret: APP_SETTING_KEYS.adminCronSecret,
  };

  for (const [field, key] of Object.entries(fieldMap)) {
    const value = body[field]?.trim();
    if (
      field === "linkedinOrganizationUrn" &&
      value &&
      !/^urn:li:organization:\d+$/.test(value)
    ) {
      return NextResponse.json(
        { error: "Organization URN must look like urn:li:organization:123456." },
        { status: 400 },
      );
    }
    if (
      (field === "replyPlaybook" || field === "linkedinOrganizationUrn") &&
      typeof body[field] === "string"
    ) {
      updates[key] = value ?? "";
      continue;
    }
    if (!value || MASK.test(value)) continue;
    if (field === "groqApiKey" && !/^gsk_[A-Za-z0-9_-]{10,}$/.test(value)) {
      return NextResponse.json(
        {
          error:
            "Groq API key must start with gsk_ and come from console.groq.com.",
        },
        { status: 400 },
      );
    }
    updates[key] = value;
  }

  if (body.newPassword?.trim()) {
    const current = body.currentPassword?.trim() ?? "";
    const stored = await getAppSetting(APP_SETTING_KEYS.adminPasswordHash);
    if (!stored) {
      return NextResponse.json({ error: "No password set." }, { status: 400 });
    }
    const ok =
      stored.startsWith("env:") ?
        current === stored.slice(4)
      : verifyAdminPasswordHash(current, stored);
    if (!ok) {
      return NextResponse.json({ error: "Current password is wrong." }, { status: 401 });
    }
    if (body.newPassword.trim().length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 },
      );
    }
    updates[APP_SETTING_KEYS.adminPasswordHash] = hashAdminPassword(
      body.newPassword.trim(),
    );
  }

  if (body.regenerateCronSecret === "true") {
    updates[APP_SETTING_KEYS.adminCronSecret] = generateSecret(24);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes to save." }, { status: 400 });
  }

  await setAppSettings(updates as Parameters<typeof setAppSettings>[0]);

  if (updates[APP_SETTING_KEYS.siteUrl] && !body.linkedinRedirectUri?.trim()) {
    const site = updates[APP_SETTING_KEYS.siteUrl]!.replace(/\/$/, "");
    await setAppSettings({
      [APP_SETTING_KEYS.linkedinRedirectUri]: `${site}/api/admin/linkedin/callback`,
    });
  }

  const settings = await getAppSettingsView();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  return PATCH(req);
}
