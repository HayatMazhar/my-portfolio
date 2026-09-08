"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { POST_TEMPLATES, POST_TONES } from "@/lib/linkedin-post-templates";
import {
  POST_TOPIC_CATEGORIES,
  POST_TOPIC_SUGGESTIONS,
  pickRandomTopicSuggestion,
  type PostTopicSuggestion,
} from "@/lib/linkedin-post-topics";
import type { PostTemplate } from "@/lib/admin-types";

export default function GeneratePostForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [cvAnchor, setCvAnchor] = useState("");
  const [template, setTemplate] = useState<PostTemplate>("story");
  const [tone, setTone] = useState("professional");
  const [extraContext, setExtraContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          topicId: topicId ?? undefined,
          cvAnchor: cvAnchor || undefined,
          template,
          tone,
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
          placeholder="Or type your own — e.g. What I learned shipping NL-to-SQL for 200 non-technical users"
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
        {loading ? "Generating from your CV…" : "Generate draft"}
      </button>
    </form>
  );
}
