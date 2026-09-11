import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-cookie";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/setup"];
const PUBLIC_ADMIN_API = [
  "/api/admin/session/login",
  "/api/admin/session/logout",
  "/api/admin/setup",
  "/api/admin/ping",
  "/api/admin/diag",
  "/api/admin/linkedin/callback",
  "/api/admin/cron/publish-scheduled",
  "/api/admin/cron/poll-comments",
  "/api/admin/cron/sync-metrics",
  "/api/admin/cron/generate-series",
];

function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isPublicAdminApi(pathname: string): boolean {
  return PUBLIC_ADMIN_API.some((p) => pathname === p);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (isPublicAdminPath(pathname) || isPublicAdminApi(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
