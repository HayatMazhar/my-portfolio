import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getKeyHealth } from "@/lib/key-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getKeyHealth());
  } catch (err) {
    console.error("key health check failed:", err);
    return NextResponse.json(
      { error: "Could not check provider keys." },
      { status: 500 },
    );
  }
}
