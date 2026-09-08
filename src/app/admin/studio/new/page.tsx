import { requireAdmin } from "@/lib/admin-guard";
import GeneratePostForm from "@/components/admin/GeneratePostForm";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coal">Generate post</h1>
        <p className="mt-1 text-sm text-coal-muted">
          Pick a topic from your CV or write your own — Groq drafts with your
          real roles, projects, and metrics.
        </p>
      </div>
      <div className="rounded-2xl border border-cream-line bg-white p-6">
        <GeneratePostForm />
      </div>
    </div>
  );
}
