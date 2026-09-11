"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type {
  ContentSeries,
  LinkedInPostRow,
  PostAudience,
} from "@/lib/admin-types";

const AUDIENCES: { id: PostAudience; label: string }[] = [
  { id: "general", label: "General" },
  { id: "recruiters", label: "Recruiters" },
  { id: "engineering_leaders", label: "Engineering leaders" },
  { id: "developers", label: "Developers" },
  { id: "uae_government", label: "UAE government" },
];

function dateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ContentCalendar({
  posts,
  series,
}: {
  posts: LinkedInPostRow[];
  series: ContentSeries[];
}) {
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [audience, setAudience] = useState<PostAudience>("developers");
  const [count, setCount] = useState(4);
  const [intervalDays, setIntervalDays] = useState(7);
  const [recurring, setRecurring] = useState(false);
  const [startAt, setStartAt] = useState(() =>
    new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const scheduled = useMemo(
    () =>
      posts.reduce<Record<string, LinkedInPostRow[]>>((groups, post) => {
        if (!post.scheduled_at) return groups;
        const key = dateKey(post.scheduled_at);
        (groups[key] ??= []).push(post);
        return groups;
      }, {}),
    [posts],
  );
  const days = useMemo(() => {
    const firstWeekday = month.getDay();
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [month]);
  const seriesNames = new Map(series.map((item) => [item.id, item.name]));

  async function createSeries(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          theme,
          audience,
          count,
          intervalDays,
          startAt,
          recurring,
        }),
      });
      const json = (await response.json()) as {
        posts?: LinkedInPostRow[];
        error?: string;
      };
      if (!response.ok) throw new Error(json.error || "Series creation failed.");
      setMessage(
        `${json.posts?.length ?? count} drafts created with proposed calendar dates.`,
      );
      setName("");
      setTheme("");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Series creation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="overflow-hidden rounded-2xl border border-cream-line bg-white">
        <div className="flex items-center justify-between border-b border-cream-line p-4">
          <button
            type="button"
            onClick={() =>
              setMonth(
                new Date(month.getFullYear(), month.getMonth() - 1, 1),
              )
            }
            className="rounded-lg border border-cream-line p-2"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="font-jakarta font-bold text-coal">
            {month.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            type="button"
            onClick={() =>
              setMonth(
                new Date(month.getFullYear(), month.getMonth() + 1, 1),
              )
            }
            className="rounded-lg border border-cream-line p-2"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b border-cream-line bg-cream-warm text-center text-[10px] font-semibold uppercase tracking-wide text-coal-dim">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="px-1 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayPosts = day
              ? scheduled[
                  `${month.getFullYear()}-${month.getMonth()}-${day}`
                ] ?? []
              : [];
            return (
              <div
                key={`${index}-${day ?? "empty"}`}
                className="min-h-24 border-b border-r border-cream-line p-1.5 md:min-h-32"
              >
                {day && (
                  <>
                    <span className="text-[10px] font-semibold text-coal-dim">
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/admin/studio/${post.id}`}
                          className={`block rounded-md px-1.5 py-1 text-[9px] leading-tight ${
                            post.status === "scheduled"
                              ? "bg-blue-50 text-blue-800"
                              : post.status === "posted"
                                ? "bg-mint-100 text-mint-800"
                                : "bg-amber-50 text-amber-800"
                          }`}
                          title={post.topic}
                        >
                          <span className="line-clamp-2">{post.topic}</span>
                          {post.series_id && (
                            <span className="mt-0.5 block opacity-70">
                              {seriesNames.get(post.series_id)}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 p-3 text-[10px] text-coal-dim">
          <span>🟡 Draft/proposed</span>
          <span>🔵 Scheduled</span>
          <span>🟢 Posted</span>
        </div>
      </section>

      <aside>
        <form
          onSubmit={createSeries}
          className="rounded-2xl border border-cream-line bg-white p-4"
        >
          <h3 className="flex items-center gap-2 font-jakarta text-sm font-bold text-coal">
            <Sparkles className="h-4 w-4 text-mint-700" /> Create a series
          </h3>
          <p className="mt-1 text-xs text-coal-dim">
            Generate connected drafts with proposed publishing dates. Nothing
            publishes until you review and schedule it.
          </p>
          <label className="mt-4 block text-xs font-medium text-coal-soft">
            Series name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Building reliable RAG"
              className="mt-1 w-full rounded-lg border border-cream-line px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-coal-soft">
            Theme and angle
            <textarea
              required
              rows={3}
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              placeholder="Practical lessons, failure modes, evaluation, and production trade-offs…"
              className="mt-1 w-full rounded-lg border border-cream-line px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 flex items-start gap-2 rounded-lg bg-mint-50 p-3 text-xs text-mint-900">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(event) => setRecurring(event.target.checked)}
              className="mt-0.5"
            />
            Keep this series recurring. The cron creates one new review-first
            draft at each interval.
          </label>
          <label className="mt-3 block text-xs font-medium text-coal-soft">
            Audience
            <select
              value={audience}
              onChange={(event) =>
                setAudience(event.target.value as PostAudience)
              }
              className="mt-1 w-full rounded-lg border border-cream-line px-3 py-2 text-sm"
            >
              {AUDIENCES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs font-medium text-coal-soft">
              Posts
              <input
                type="number"
                min={2}
                max={6}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-cream-line px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-coal-soft">
              Every (days)
              <input
                type="number"
                min={1}
                max={30}
                value={intervalDays}
                onChange={(event) =>
                  setIntervalDays(Number(event.target.value))
                }
                className="mt-1 w-full rounded-lg border border-cream-line px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="mt-3 block text-xs font-medium text-coal-soft">
            First proposed date
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              className="mt-1 w-full rounded-lg border border-cream-line px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-coal px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Generating series…" : "Generate series drafts"}
          </button>
          {message && (
            <p className="mt-3 rounded-lg bg-cream-warm p-2 text-xs text-coal-muted">
              {message}
            </p>
          )}
        </form>
      </aside>
    </div>
  );
}
