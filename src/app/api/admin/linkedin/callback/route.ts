import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { completeLinkedInOAuth, getSiteOrigin } from "@/lib/linkedin";
import {
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "@/lib/linkedin-oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const origin = await getSiteOrigin();

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin/settings?linkedin=error&reason=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/admin/settings?linkedin=missing`);
  }

  const jar = await cookies();
  const cookieState = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.set({ name: OAUTH_STATE_COOKIE, value: "", maxAge: 0, path: "/" });

  if (!(await verifyOAuthState(state, cookieState))) {
    return NextResponse.redirect(`${origin}/admin/settings?linkedin=state`);
  }

  try {
    await completeLinkedInOAuth(code);
    return NextResponse.redirect(`${origin}/admin/settings?linkedin=connected`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      `${origin}/admin/settings?linkedin=error&reason=${encodeURIComponent(reason.slice(0, 120))}`,
    );
  }
}
