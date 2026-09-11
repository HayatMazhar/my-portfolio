import { requireAdmin } from "@/lib/admin-guard";
import EngagementAssistantForm from "@/components/admin/EngagementAssistantForm";
import EngagementQueue from "@/components/admin/EngagementQueue";
import { getEngagementPollState, listPosts } from "@/lib/admin-db";

export const dynamic = "force-dynamic";

export default async function EngagementPage() {
  await requireAdmin();

  const [posts, poll] = await Promise.all([
    listPosts("posted"),
    getEngagementPollState(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-coal">Engagement assistant</h1>
        <p className="mt-1 text-sm text-coal-muted">
          Phase 2: poll LinkedIn comments, review AI drafts, approve replies.
          Manual paste mode is still available below.
        </p>
      </div>

      <EngagementQueue />

      <section className="space-y-4 border-t border-cream-line pt-8">
        <div>
          <h2 className="font-jakarta text-lg font-bold text-coal">Manual paste mode</h2>
          <p className="mt-1 text-sm text-coal-muted">
            Use this if LinkedIn has not approved comment API access yet.
          </p>
          {poll.last_poll_error && (
            <p className="mt-2 text-xs text-amber-900">{poll.last_poll_error}</p>
          )}
        </div>
        <EngagementAssistantForm postedPosts={posts} />
      </section>
    </div>
  );
}
