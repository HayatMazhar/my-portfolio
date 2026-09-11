import { NextResponse } from "next/server";
import { pollLinkedInEngagement } from "@/lib/linkedin-engagement-sync";
import { verifyCronSecret } from "@/lib/app-settings";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  const cronOk = await verifyCronSecret(bearer);
  const sessionOk = await isAdminAuthenticated();

  if (!cronOk && !sessionOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pollLinkedInEngagement();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Comment poll failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
