import { verifySessionToken } from "@/lib/admin-session";
import { getAdminSessionToken } from "@/lib/admin-cookie-server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const token = await getAdminSessionToken();
  if (!(await verifySessionToken(token))) {
    redirect("/admin/login");
  }
}

export async function requireAdminApi(): Promise<boolean> {
  const token = await getAdminSessionToken();
  return verifySessionToken(token);
}
