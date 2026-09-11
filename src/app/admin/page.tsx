import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { getPostCounts, listPosts } from "@/lib/admin-db";
import { getLinkedInConnectionStatus } from "@/lib/linkedin";
import PostQueue from "@/components/admin/PostQueue";
import IdeaBank from "@/components/admin/IdeaBank";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [posts, counts, linkedin] = await Promise.all([
    listPosts(),
    getPostCounts(),
    getLinkedInConnectionStatus(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coal">Post queue</h1>
          <p className="mt-1 text-sm text-coal-muted">
            Generate drafts with Groq, approve, then publish to LinkedIn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/studio/engagement"
            className="rounded-xl border border-cream-line bg-white px-5 py-3 text-sm font-bold text-coal hover:bg-cream-warm"
          >
            Reply to comments
          </Link>
          <Link
            href="/admin/studio/new"
            className="rounded-xl bg-coal px-5 py-3 text-sm font-bold text-white"
          >
            + New post
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(
          [
            ["draft", counts.draft],
            ["approved", counts.approved],
            ["scheduled", counts.scheduled],
            ["posted", counts.posted],
            ["failed", counts.failed],
          ] as const
        ).map(([label, count]) => (
          <div
            key={label}
            className="rounded-2xl border border-cream-line bg-white px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wider text-coal-dim">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-coal">{count}</p>
          </div>
        ))}
      </div>

      {!linkedin.connected && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          LinkedIn is not connected.{" "}
          <Link href="/admin/settings" className="font-semibold underline">
            Connect in Settings
          </Link>{" "}
          to publish directly — or copy drafts manually.
        </p>
      )}

      <IdeaBank posts={posts} />

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-line bg-white px-6 py-12 text-center">
          <p className="text-coal-muted">No posts yet.</p>
          <Link
            href="/admin/studio/new"
            className="mt-3 inline-block text-sm font-semibold text-mint-700"
          >
            Generate your first draft →
          </Link>
        </div>
      ) : (
        <PostQueue posts={posts} />
      )}
    </div>
  );
}
