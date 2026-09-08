import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildLinkedInAuthUrl, isLinkedInConfigured } from "@/lib/linkedin";
import { createOAuthState, OAUTH_STATE_COOKIE } from "@/lib/linkedin-oauth-state";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isLinkedInConfigured())) {
    return NextResponse.json(
      {
        error:
          "Add LinkedIn Client ID and Secret in Admin → Settings first.",
      },
      { status: 503 },
    );
  }

  const signed = await createOAuthState();
  const jar = await cookies();
  jar.set({
    name: OAUTH_STATE_COOKIE,
    value: signed,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.json({ url: await buildLinkedInAuthUrl(signed) });
}
