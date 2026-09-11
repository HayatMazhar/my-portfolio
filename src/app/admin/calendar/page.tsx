import ContentCalendar from "@/components/admin/ContentCalendar";
import { requireAdmin } from "@/lib/admin-guard";
import { listContentSeries, listPosts } from "@/lib/admin-db";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireAdmin();
  const [posts, series] = await Promise.all([
    listPosts(),
    listContentSeries(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-coal">Content calendar</h1>
        <p className="mt-1 text-sm text-coal-muted">
          Plan individual posts and generate review-first recurring series.
        </p>
      </div>
      <ContentCalendar posts={posts} series={series} />
    </div>
  );
}
