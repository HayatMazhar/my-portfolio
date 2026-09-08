import { NextResponse } from "next/server";
import { buildClearSessionCookieHeader } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", await buildClearSessionCookieHeader());
  return response;
}
