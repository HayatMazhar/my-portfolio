import { NextResponse } from "next/server";
import { pollLinkedInEngagement } from "@/lib/linkedin-engagement-sync";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(req, "admin-engagement-poll", {
    limit: 6,
    windowMs: 300_000,
  });
  if (limited) return limited;

  try {
    const result = await pollLinkedInEngagement();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Comment poll failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
