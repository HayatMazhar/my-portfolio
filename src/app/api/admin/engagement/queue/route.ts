import { NextResponse } from "next/server";
import {
  countEngagementComments,
  getEngagementPollState,
  listEngagementComments,
} from "@/lib/admin-db";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pending, poll] = await Promise.all([
    listEngagementComments("pending"),
    getEngagementPollState(),
  ]);

  return NextResponse.json({
    pending,
    poll,
    pendingCount: pending.length,
    totalCount: await countEngagementComments(),
  });
}
