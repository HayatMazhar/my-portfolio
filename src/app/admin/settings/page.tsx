import AppSettingsForm from "@/components/admin/AppSettingsForm";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coal">Settings</h1>
        <p className="mt-1 text-sm text-coal-muted">
          All keys and credentials are stored in-app on your server (
          <code className="font-mono text-xs">.data/admin-store.json</code>).
          Change anything here — no cPanel env vars needed.
        </p>
      </div>

      <AppSettingsForm />
    </div>
  );
}
