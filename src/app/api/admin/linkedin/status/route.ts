import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { isAdminAuthenticated } = await import("@/lib/admin-auth");
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resolveAdminStoreBackend } = await import("@/lib/admin-db");
    await resolveAdminStoreBackend();

    const { getLinkedInConnectionStatus, isLinkedInConfigured } = await import(
      "@/lib/linkedin"
    );

    const [configured, status] = await Promise.all([
      isLinkedInConfigured().catch(() => false),
      getLinkedInConnectionStatus(),
    ]);

    return NextResponse.json({ configured, ...status });
  } catch (err) {
    console.error("linkedin status failed:", err);
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        memberUrn: null,
        expiresAt: null,
        organizationUrn: null,
        advancedScopes: false,
        grantedScopes: [],
        canReadComments: false,
        error:
          err instanceof Error ? err.message : "LinkedIn status unavailable.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { isAdminAuthenticated } = await import("@/lib/admin-auth");
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clearLinkedInAuth } = await import("@/lib/admin-db");
    await clearLinkedInAuth();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("linkedin disconnect failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not disconnect LinkedIn.",
      },
      { status: 500 },
    );
  }
}
