import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { getAdminSessionToken } from "@/lib/admin-cookie-server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cookie-only check — avoids loading Turso/settings on every admin page (login/setup).
  const authed = Boolean(await getAdminSessionToken());

  return (
    <div className="min-h-screen bg-cream font-jakarta text-coal">
      {authed ? <AdminNav /> : null}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
