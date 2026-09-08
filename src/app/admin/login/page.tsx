import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { isAppAdminConfigured } from "@/lib/app-settings";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (!(await isAppAdminConfigured())) {
    redirect("/admin/setup");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12 font-jakarta">
      <div className="w-full max-w-md rounded-2xl border border-cream-line bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-coal-dim">
          Portfolio Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-coal">Sign in</h1>
        <p className="mt-2 text-sm text-coal-muted">
          LinkedIn post studio — generate, approve, publish.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-coal-dim">Loading…</p>}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
