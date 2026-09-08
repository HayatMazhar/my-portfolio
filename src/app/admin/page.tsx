import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { getPostCounts, listPosts } from "@/lib/admin-db";
import { getLinkedInConnectionStatus } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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
        <Link
          href="/admin/studio/new"
          className="rounded-xl bg-coal px-5 py-3 text-sm font-bold text-white"
        >
          + New post
        </Link>
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
        <div className="overflow-hidden rounded-2xl border border-cream-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-line bg-cream-warm text-xs uppercase tracking-wider text-coal-dim">
              <tr>
                <th className="px-4 py-3 font-semibold">Topic</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">
                  Status
                </th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                  Updated
                </th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-cream-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-coal line-clamp-1">{post.topic}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-coal-dim md:hidden">
                      {post.status} · {formatDate(post.updated_at)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 capitalize text-coal-muted md:table-cell">
                    {post.status}
                  </td>
                  <td className="hidden px-4 py-3 text-coal-dim lg:table-cell">
                    {formatDate(post.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/studio/${post.id}`}
                      className="font-medium text-mint-700 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
