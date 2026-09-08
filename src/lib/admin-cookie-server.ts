import "server-only";

import { headers } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-cookie";

/** Parse Cookie header without next/headers cookies() — works on Namecheap shared hosting. */
export async function getAdminSessionToken(): Promise<string | undefined> {
  const header = (await headers()).get("cookie");
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${ADMIN_COOKIE}=`)) continue;
    return decodeURIComponent(trimmed.slice(ADMIN_COOKIE.length + 1));
  }

  return undefined;
}
