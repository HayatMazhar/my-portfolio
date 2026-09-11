import AppSettingsForm from "@/components/admin/AppSettingsForm";
import KeyHealthPanel from "@/components/admin/KeyHealthPanel";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coal">Settings</h1>
        <p className="mt-1 text-sm text-coal-muted">
          App credentials are encrypted in transit and stored in the configured
          admin database. Turso connection variables remain in cPanel.
        </p>
      </div>

      <KeyHealthPanel />

      <AppSettingsForm />
    </div>
  );
}
