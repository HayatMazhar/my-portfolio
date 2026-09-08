import AdminSetupForm from "@/components/admin/AdminSetupForm";
import { isAppAdminConfigured } from "@/lib/app-settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  if (await isAppAdminConfigured()) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-coal-dim">
          First-time setup
        </p>
        <h1 className="mt-1 text-2xl font-bold text-coal">Configure admin</h1>
        <p className="mt-2 text-sm text-coal-muted">
          All settings live in the app — saved to{" "}
          <code className="font-mono text-xs">.data/admin-store.json</code> on
          your server. No cPanel env vars required.
        </p>
      </div>
      <div className="rounded-2xl border border-cream-line bg-white p-6">
        <AdminSetupForm />
      </div>
    </div>
  );
}
