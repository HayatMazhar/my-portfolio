import Link from "next/link";
import type { LinkedInPostRow } from "@/lib/admin-types";
import {
  buildWeeklyPlan,
  unusedTopicSuggestions,
} from "@/lib/linkedin-idea-bank";

export default function IdeaBank({ posts }: { posts: LinkedInPostRow[] }) {
  const unused = unusedTopicSuggestions(posts).slice(0, 6);
  const plan = buildWeeklyPlan(posts, 3);

  if (unused.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-cream-line bg-white p-5">
        <h2 className="font-jakarta text-sm font-bold text-coal">
          Unused CV angles
        </h2>
        <p className="mt-1 text-xs text-coal-dim">
          Topics from your experience that are not in the queue yet.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {unused.map((suggestion) => (
            <Link
              key={suggestion.id}
              href={`/admin/studio/new?topic=${encodeURIComponent(suggestion.id)}`}
              className="rounded-xl bg-cream-warm px-3 py-2 text-xs text-coal hover:bg-mint-50"
            >
              {suggestion.label}
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-cream-line bg-white p-5">
        <h2 className="font-jakarta text-sm font-bold text-coal">
          Suggested week
        </h2>
        <p className="mt-1 text-xs text-coal-dim">
          One draft every other day, starting with unused CV topics.
        </p>
        <ol className="mt-3 space-y-2">
          {plan.map((item, index) => (
            <li
              key={item.suggestion.id}
              className="rounded-xl bg-cream-warm px-3 py-2 text-sm"
            >
              <span className="text-xs font-semibold text-mint-700">
                Day {item.dayOffset + 1}
              </span>
              <p className="mt-0.5 text-coal">{item.suggestion.label}</p>
              {index === 0 && (
                <Link
                  href={`/admin/studio/new?topic=${encodeURIComponent(item.suggestion.id)}`}
                  className="mt-1 inline-block text-xs font-semibold text-mint-700"
                >
                  Generate this →
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
