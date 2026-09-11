import { existsSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimal health check — no Turso/admin imports unless ?probe=1. */
export async function GET(req: NextRequest) {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim() ?? "";
  const dataPath = join(process.cwd(), ".data", "admin-store.json");
  const base = {
    ok: true,
    node: process.version,
    cwd: process.cwd(),
    tursoConfigured: Boolean(tursoUrl && process.env.TURSO_AUTH_TOKEN?.trim()),
    tursoUrlHost: tursoUrl.replace(/^libsql:\/\//, "").slice(0, 60),
    dataStoreExists: existsSync(dataPath),
    tursoClient: "fetch",
  };

  if (new URL(req.url).searchParams.get("probe") !== "1") {
    return NextResponse.json(base);
  }

  const probe: Record<string, string> = {};

  async function step(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      probe[name] = "ok";
    } catch (err) {
      probe[name] = err instanceof Error ? err.message : String(err);
    }
  }

  await step("bcryptjs", async () => {
    const mod = await import("bcryptjs");
    const bcrypt = mod.default ?? mod;
    bcrypt.hashSync("x", 4);
  });

  await step("libsqlWeb", async () => {
    const { pingTurso } = await import("@/lib/turso");
    if (!(await pingTurso())) throw new Error("pingTurso returned false");
  });

  await step("tursoQuery", async () => {
    const { getTursoClient } = await import("@/lib/turso");
    await getTursoClient().execute("SELECT 1");
  });

  await step("resolveBackend", async () => {
    const { resolveAdminStoreBackend } = await import("@/lib/admin-db");
    await resolveAdminStoreBackend();
  });

  await step("isConfigured", async () => {
    const { isAppAdminConfigured } = await import("@/lib/app-settings");
    await isAppAdminConfigured();
  });

  await step("linkedinAuthRow", async () => {
    const { getLinkedInAuth } = await import("@/lib/admin-db");
    await getLinkedInAuth();
  });

  await step("linkedinStatus", async () => {
    const { getLinkedInConnectionStatus } = await import("@/lib/linkedin");
    await getLinkedInConnectionStatus();
  });

  return NextResponse.json({ ...base, probe });
}
