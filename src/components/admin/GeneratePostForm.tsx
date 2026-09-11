"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Newspaper,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { POST_TEMPLATES, POST_TONES } from "@/lib/linkedin-post-templates";
import {
  POST_TOPIC_CATEGORIES,
  POST_TOPIC_SUGGESTIONS,
  getTopicSuggestion,
  pickRandomTopicSuggestion,
  type PostTopicSuggestion,
} from "@/lib/linkedin-post-topics";
import {
  MAX_CUSTOM_WORDS,
  MIN_CUSTOM_WORDS,
  POST_LENGTHS,
} from "@/lib/linkedin-style-guide";
import type {
  PostAudience,
  PostGenerationMode,
  PostLength,
  PostTemplate,
} from "@/lib/admin-types";

interface TechnologyTrend {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;
  context: string;
}

const GENERATION_MODES: {
  id: PostGenerationMode;
  label: string;
  description: string;
  icon: typeof BriefcaseBusiness;
}[] = [
  {
    id: "cv",
    label: "My experience",
    description: "Grounded in your CV, projects, and metrics",
    icon: BriefcaseBusiness,
  },
  {
    id: "trend",
    label: "Tech trends",
    description: "Current tools and technologies from live sources",
    icon: Newspaper,
  },
  {
    id: "custom",
    label: "Any topic",
    description: "Educational, opinion, comparison, or custom angle",
    icon: Pencil,
  },
];

const AUDIENCES: { id: PostAudience; label: string }[] = [
  { id: "general", label: "General professional audience" },
  { id: "recruiters", label: "Recruiters and hiring managers" },
  { id: "engineering_leaders", label: "CTOs and engineering leaders" },
  { id: "developers", label: "Developers and AI builders" },
  { id: "uae_government", label: "UAE government and enterprise" },
];

export default function GeneratePostForm({
  usedTopicIds = [],
  initialTopicId,
}: {
  usedTopicIds?: string[];
  initialTopicId?: string;
}) {
  const router = useRouter();
  const used = new Set(usedTopicIds);
  const [mode, setMode] = useState<PostGenerationMode>("cv");
  const [topic, setTopic] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [cvAnchor, setCvAnchor] = useState("");
  const [template, setTemplate] = useState<PostTemplate>("story");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState<PostLength>("medium");
  const [customWordCount, setCustomWordCount] = useState(180);
  const [audience, setAudience] = useState<PostAudience>("general");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trends, setTrends] = useState<TechnologyTrend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState("");
  const [selectedTrend, setSelectedTrend] =
    useState<TechnologyTrend | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    (typeof POST_TOPIC_CATEGORIES)[number]["id"] | "all"
  >("all");

  function applySuggestion(suggestion: PostTopicSuggestion) {
    setTopicId(suggestion.id);
    setTopic(suggestion.topic);
    setCvAnchor(suggestion.cvAnchor);
    setTemplate(suggestion.suggestedTemplate);
    setError("");
  }

  function clearSuggestion() {
    setTopicId(null);
    setCvAnchor("");
  }

  function surpriseMe() {
    applySuggestion(pickRandomTopicSuggestion());
  }

  async function loadTrends() {
    setTrendsLoading(true);
    setTrendsError("");
    try {
      const res = await fetch("/api/admin/trends");
      const data = (await res.json()) as {
        trends?: TechnologyTrend[];
        error?: string;
      };
      if (!res.ok) {
        setTrendsError(data.error || "Could not load current trends.");
        return;
      }
      setTrends(data.trends ?? []);
    } catch {
      setTrendsError("Network error loading trends.");
    } finally {
      setTrendsLoading(false);
    }
  }

  useEffect(() => {
    if (!initialTopicId) return;
    const suggestion = getTopicSuggestion(initialTopicId);
    if (suggestion) applySuggestion(suggestion);
    // Prefill once from the dashboard idea bank.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopicId]);

  useEffect(() => {
    if (mode === "trend" && trends.length === 0 && !trendsLoading) {
      void loadTrends();
    }
    // Load only when trend mode is first opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function changeMode(nextMode: PostGenerationMode) {
    setMode(nextMode);
    setTopic("");
    setTopicId(null);
    setCvAnchor("");
    setSelectedTrend(null);
    setError("");
    if (nextMode === "trend") setTemplate("hot_take");
  }

  function applyTrend(trend: TechnologyTrend) {
    setSelectedTrend(trend);
    setTopic(trend.title);
    setTopicId(null);
    setCvAnchor("");
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          topic,
          topicId: topicId ?? undefined,
          cvAnchor: cvAnchor || undefined,
          sourceTitle: selectedTrend?.title,
          sourceUrl: selectedTrend?.url,
          sourceName: selectedTrend?.source,
          sourceContext: selectedTrend?.context,
          template,
          tone,
          length,
          customWordCount: length === "custom" ? customWordCount : undefined,
          audience,
          extraContext,
          generate: true,
        }),
      });
      const data = (await res.json()) as {
        post?: { id: string; status?: string; error_message?: string | null };
        error?: string;
      };
      if (!res.ok || !data.post) {
        setError(data.error || "Failed to generate post.");
        return;
      }
      if (data.post.status === "failed") {
        setError(
          data.post.error_message ||
            "Generation failed. Check your Groq API key in Admin → Settings.",
        );
        return;
      }
      router.push(`/admin/studio/${data.post.id}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const visibleSuggestions =
    activeCategory === "all"
      ? POST_TOPIC_SUGGESTIONS
      : POST_TOPIC_SUGGESTIONS.filter((s) => s.category === activeCategory);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section>
        <p className="mb-2 text-sm font-medium text-coal-soft">
          What should this post be based on?
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {GENERATION_MODES.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => changeMode(item.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-mint-500 bg-mint-50 ring-2 ring-mint-500/20"
                    : "border-cream-line bg-white hover:bg-cream-warm"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    active ? "text-mint-700" : "text-coal-dim"
                  }`}
                />
                <span className="mt-3 block text-sm font-bold text-coal">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs text-coal-muted">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {mode === "cv" && (
      <section className="rounded-2xl border border-mint-200 bg-mint-50/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-jakarta text-sm font-bold text-coal">
              Generate from your experience
            </h2>
            <p className="mt-1 text-xs text-coal-muted">
              Pick a CV-backed angle — Groq pulls matching roles, projects, and
              metrics from your corpus.
            </p>
          </div>
          <button
            type="button"
            onClick={surpriseMe}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cream-line bg-white px-3 py-2 text-xs font-semibold text-coal-soft hover:bg-cream-warm"
          >
            <Sparkles className="h-3.5 w-3.5 text-mint-700" />
            Surprise me
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeCategory === "all"
                ? "bg-coal text-white"
                : "bg-white text-coal-muted ring-1 ring-cream-line"
            }`}
          >
            All
          </button>
          {POST_TOPIC_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeCategory === cat.id
                  ? "bg-coal text-white"
                  : "bg-white text-coal-muted ring-1 ring-cream-line"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {visibleSuggestions.map((suggestion) => {
            const selected = topicId === suggestion.id;
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => applySuggestion(suggestion)}
                className={`rounded-xl px-3 py-2 text-left text-xs transition ${
                  selected
                    ? "bg-mint-600 text-white ring-2 ring-mint-700/30"
                    : "bg-white text-coal-soft ring-1 ring-cream-line hover:bg-cream-warm"
                }`}
              >
                {suggestion.label}
                {used.has(suggestion.id) && !selected && (
                  <span className="mt-1 block text-[10px] opacity-70">Used</span>
                )}
              </button>
            );
          })}
        </div>

        {topicId && (
          <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-coal-muted ring-1 ring-cream-line">
            <span className="font-semibold text-coal">Selected:</span> {topic}
          </p>
        )}
      </section>
      )}

      {mode === "trend" && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-jakarta text-sm font-bold text-coal">
                Current technology signals
              </h2>
              <p className="mt-1 text-xs text-coal-muted">
                Recent discussions from Hacker News and DEV Community. Always
                review the source before publishing.
              </p>
            </div>
            <button
              type="button"
              onClick={loadTrends}
              disabled={trendsLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cream-line bg-white px-3 py-2 text-xs font-semibold text-coal-soft disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  trendsLoading ? "animate-spin" : ""
                }`}
              />
              Refresh trends
            </button>
          </div>

          {trendsError && (
            <p className="mt-3 text-xs text-red-600">{trendsError}</p>
          )}
          {trendsLoading && trends.length === 0 && (
            <p className="mt-3 text-xs text-coal-dim">
              Finding current tools and technology discussions…
            </p>
          )}
          <div className="mt-3 grid gap-2">
            {trends.map((trend) => (
              <button
                key={trend.id}
                type="button"
                onClick={() => applyTrend(trend)}
                className={`rounded-xl p-3 text-left transition ${
                  selectedTrend?.id === trend.id
                    ? "bg-mint-600 text-white"
                    : "bg-white text-coal ring-1 ring-cream-line hover:bg-cream-warm"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {trend.title}
                </span>
                <span
                  className={`mt-1 block text-xs ${
                    selectedTrend?.id === trend.id
                      ? "text-white/80"
                      : "text-coal-dim"
                  }`}
                >
                  {trend.source} ·{" "}
                  {new Date(trend.publishedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
          {selectedTrend && (
            <a
              href={selectedTrend.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-blue-700 underline"
            >
              Review original source ↗
            </a>
          )}
        </section>
      )}

      {mode === "custom" && (
        <p className="rounded-xl border border-cream-line bg-cream-warm px-4 py-3 text-sm text-coal-muted">
          Write about any tool, technology, architecture, tutorial, comparison,
          or opinion. CV references are optional and will not be forced.
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-coal-soft">
          Topic or angle
        </label>
        <input
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            clearSuggestion();
          }}
          placeholder={
            mode === "trend"
              ? "Select a trend above, or type a current tool or technology"
              : mode === "custom"
                ? "e.g. MCP vs traditional APIs for AI agents"
                : "Or type your own CV-backed angle"
          }
          className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal outline-none focus:ring-2 focus:ring-mint-500/30"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-coal-soft">
            Template
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as PostTemplate)}
            className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal"
          >
            {POST_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-coal-dim">
            {POST_TEMPLATES.find((t) => t.id === template)?.description}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-coal-soft">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal"
          >
            {POST_TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section>
        <label className="mb-2 block text-sm font-medium text-coal-soft">
          Post length
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {POST_LENGTHS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setLength(option.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                length === option.id
                  ? "border-mint-500 bg-mint-50 ring-2 ring-mint-500/20"
                  : "border-cream-line bg-white hover:bg-cream-warm"
              }`}
            >
              <span className="block text-sm font-bold text-coal">
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-coal-dim">
                {option.hint}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setLength("custom")}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              length === "custom"
                ? "border-mint-500 bg-mint-50 ring-2 ring-mint-500/20"
                : "border-cream-line bg-white hover:bg-cream-warm"
            }`}
          >
            <span className="block text-sm font-bold text-coal">Custom</span>
            <span className="mt-1 block text-xs text-coal-dim">
              Choose 30–500 words
            </span>
          </button>
        </div>
        {length === "custom" && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-cream-line bg-white p-3">
            <input
              type="range"
              min={MIN_CUSTOM_WORDS}
              max={MAX_CUSTOM_WORDS}
              step={10}
              value={customWordCount}
              onChange={(event) =>
                setCustomWordCount(Number(event.target.value))
              }
              className="min-w-0 flex-1 accent-mint-600"
            />
            <input
              type="number"
              min={MIN_CUSTOM_WORDS}
              max={MAX_CUSTOM_WORDS}
              value={customWordCount}
              onChange={(event) =>
                setCustomWordCount(
                  Math.min(
                    MAX_CUSTOM_WORDS,
                    Math.max(MIN_CUSTOM_WORDS, Number(event.target.value)),
                  ),
                )
              }
              className="w-24 rounded-lg border border-cream-line px-3 py-2 text-sm"
            />
            <span className="text-xs text-coal-dim">words</span>
          </div>
        )}
      </section>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-coal-soft">
          Target audience
        </label>
        <select
          value={audience}
          onChange={(event) => setAudience(event.target.value as PostAudience)}
          className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal"
        >
          {AUDIENCES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-coal-soft">
          Extra context (optional)
        </label>
        <textarea
          value={extraContext}
          onChange={(e) => setExtraContext(e.target.value)}
          rows={3}
          placeholder="Anything else to stress — a metric, stakeholder quote, or angle to avoid…"
          className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal outline-none focus:ring-2 focus:ring-mint-500/30"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !topic.trim()}
        className="rounded-xl bg-coal px-5 py-3 font-jakarta text-sm font-bold text-white disabled:opacity-60"
      >
        {loading
          ? "Generating draft…"
          : mode === "trend"
            ? "Generate trend analysis"
            : mode === "custom"
              ? "Generate post"
              : "Generate from my experience"}
      </button>
    </form>
  );
}
