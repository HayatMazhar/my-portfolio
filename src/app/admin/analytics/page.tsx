import Link from "next/link";
import { requireAdmin } from "@/lib/admin-guard";
import { listPosts } from "@/lib/admin-db";

export const dynamic = "force-dynamic";

function engagement(post: Awaited<ReturnType<typeof listPosts>>[number]) {
  const metrics = post.metrics;
  if (!metrics) return 0;
  return metrics.reactions + metrics.comments + metrics.reposts + metrics.clicks;
}

export default async function AnalyticsPage() {
  await requireAdmin();
  const posts = await listPosts("posted");
  const measured = posts.filter((post) => (post.metrics?.impressions ?? 0) > 0);
  const impressions = measured.reduce(
    (sum, post) => sum + (post.metrics?.impressions ?? 0),
    0,
  );
  const engagements = measured.reduce((sum, post) => sum + engagement(post), 0);
  const rate = impressions > 0 ? (engagements / impressions) * 100 : 0;
  const ranked = [...measured].sort((a, b) => {
    const rateA = engagement(a) / (a.metrics?.impressions || 1);
    const rateB = engagement(b) / (b.metrics?.impressions || 1);
    return rateB - rateA;
  });
  const formats = measured.reduce<
    Record<string, { impressions: number; engagements: number; posts: number }>
  >((groups, post) => {
    const row = (groups[post.template] ??= {
      impressions: 0,
      engagements: 0,
      posts: 0,
    });
    row.impressions += post.metrics?.impressions ?? 0;
    row.engagements += engagement(post);
    row.posts += 1;
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-coal">Performance learning</h1>
        <p className="mt-1 text-sm text-coal-muted">
          Recorded results are automatically summarized for future AI drafts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Measured posts", measured.length.toLocaleString()],
          ["Impressions", impressions.toLocaleString()],
          ["Engagements", engagements.toLocaleString()],
          ["Engagement rate", `${rate.toFixed(1)}%`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-cream-line bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-coal-dim">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-coal">{value}</p>
          </div>
        ))}
      </div>

      {measured.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-line bg-white p-8 text-center">
          <p className="text-sm text-coal-muted">
            Add impressions and engagement to published posts to start the
            learning loop.
          </p>
          <Link
            href="/admin"
            className="mt-3 inline-block text-sm font-semibold text-mint-700"
          >
            Open post queue →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-jakarta text-sm font-bold text-coal">
              Best-performing posts
            </h2>
            <div className="mt-4 space-y-3">
              {ranked.slice(0, 6).map((post) => {
                const postRate =
                  (engagement(post) / (post.metrics?.impressions || 1)) * 100;
                return (
                  <Link
                    key={post.id}
                    href={`/admin/studio/${post.id}`}
                    className="block rounded-xl bg-cream-warm p-3 hover:bg-mint-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-medium text-coal">
                        {post.topic}
                      </p>
                      <span className="shrink-0 text-sm font-bold text-mint-700">
                        {postRate.toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs capitalize text-coal-dim">
                      {post.template.replace("_", " ")} ·{" "}
                      {post.metrics?.impressions.toLocaleString()} impressions
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <h2 className="font-jakarta text-sm font-bold text-coal">
              Format performance
            </h2>
            <div className="mt-4 space-y-4">
              {Object.entries(formats)
                .sort(
                  ([, a], [, b]) =>
                    b.engagements / b.impressions -
                    a.engagements / a.impressions,
                )
                .map(([format, data]) => {
                  const formatRate =
                    (data.engagements / data.impressions) * 100;
                  return (
                    <div key={format}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium capitalize text-coal">
                          {format.replace("_", " ")}
                        </span>
                        <span className="text-coal-muted">
                          {formatRate.toFixed(1)}% · {data.posts} posts
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream-warm">
                        <div
                          className="h-full rounded-full bg-mint-500"
                          style={{ width: `${Math.min(100, formatRate * 10)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
