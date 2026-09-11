import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  try {
    const { resolveAdminStoreBackend } = await import("@/lib/admin-db");
    const { isAppAdminConfigured } = await import("@/lib/app-settings");
    await resolveAdminStoreBackend();
    if (!(await isAppAdminConfigured())) {
      redirect("/admin/setup");
    }
  } catch (err) {
    console.error("admin login page failed:", err);
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12 font-jakarta">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-coal">Admin storage unavailable</h1>
          <p className="mt-3 text-sm text-coal-muted">
            The app could not read admin settings. Check Turso credentials in your
            host env vars, or redeploy the latest zip so{" "}
            <code className="text-xs">.data/admin-store.json</code> can be used as
            fallback.
          </p>
          <p className="mt-3 font-mono text-xs text-red-700">
            {err instanceof Error ? err.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
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
