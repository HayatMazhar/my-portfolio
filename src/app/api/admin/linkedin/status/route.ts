import { NextResponse } from "next/server";
import { clearLinkedInAuth } from "@/lib/admin-db";
import { getLinkedInConnectionStatus, isLinkedInConfigured } from "@/lib/linkedin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getLinkedInConnectionStatus();
  return NextResponse.json({
    configured: await isLinkedInConfigured(),
    ...status,
  });
}

export async function DELETE() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearLinkedInAuth();
  return NextResponse.json({ ok: true });
}
