import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  APP_SETTING_KEYS,
  getAppSetting,
  getStoredPasswordHashKind,
  isAppAdminConfigured,
} from "@/lib/app-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let bcryptOk = false;
  try {
    const sample = bcrypt.hashSync("diag-test", 4);
    bcryptOk = bcrypt.compareSync("diag-test", sample);
  } catch {
    bcryptOk = false;
  }

  const stored = await getAppSetting(APP_SETTING_KEYS.adminPasswordHash);
  const hashKind = getStoredPasswordHashKind(stored);

  return NextResponse.json({
    ok: true,
    build: process.env.NEXT_BUILD_ID ?? null,
    bcryptOk,
    configured: await isAppAdminConfigured(),
    passwordHashKind: hashKind,
    needsPasswordRehash: hashKind === "legacy",
  });
}
