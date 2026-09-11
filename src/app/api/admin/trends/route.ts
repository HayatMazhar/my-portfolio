import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getTechnologyTrends } from "@/lib/technology-trends";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(req, "admin-technology-trends", {
    limit: 12,
    windowMs: 300_000,
  });
  if (limited) return limited;

  try {
    return NextResponse.json(await getTechnologyTrends());
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load technology trends.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
