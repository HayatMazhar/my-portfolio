import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bcryptMod = await import("bcryptjs");
    const bcrypt = bcryptMod.default ?? bcryptMod;

    let bcryptOk = false;
    try {
      const sample = bcrypt.hashSync("diag-test", 4);
      bcryptOk = bcrypt.compareSync("diag-test", sample);
    } catch {
      bcryptOk = false;
    }

    const { isTursoConfigured } = await import("@/lib/turso");
    const { resolveAdminStoreBackend, getAdminStoreBackend } = await import(
      "@/lib/admin-db"
    );
    const {
      APP_SETTING_KEYS,
      getAppSetting,
      getStoredPasswordHashKind,
      isAppAdminConfigured,
    } = await import("@/lib/app-settings");

    const storeBackend = await resolveAdminStoreBackend();
    const tursoConfigured = isTursoConfigured();
    const stored = await getAppSetting(APP_SETTING_KEYS.adminPasswordHash);
    const hashKind = getStoredPasswordHashKind(stored);

    return NextResponse.json({
      ok: true,
      build: process.env.NEXT_BUILD_ID ?? null,
      bcryptOk,
      configured: await isAppAdminConfigured(),
      passwordHashKind: hashKind,
      needsPasswordRehash: hashKind === "legacy",
      storeBackend: getAdminStoreBackend(),
      tursoConfigured,
      tursoOk: storeBackend === "turso",
      tursoFallback: tursoConfigured && storeBackend === "json",
    });
  } catch (err) {
    console.error("admin diag failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Admin diagnostics failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}
