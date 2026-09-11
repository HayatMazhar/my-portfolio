"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Sparkles } from "lucide-react";
import type { LinkedInPostRow } from "@/lib/admin-types";

interface GeneratedReply {
  label: string;
  text: string;
  intent: string;
}

interface EngagementAssistantFormProps {
  postedPosts: LinkedInPostRow[];
}

const TONES = [
  { id: "conversational", label: "Conversational" },
  { id: "professional", label: "Professional" },
  { id: "bold", label: "Bold" },
  { id: "technical", label: "Technical" },
] as const;

const INTENTS = [
  { id: "auto", label: "Smart mix" },
  { id: "thanks", label: "Thank them" },
  { id: "answer", label: "Answer" },
  { id: "follow_up", label: "Follow up" },
  { id: "recruiter", label: "Recruiter" },
] as const;

export default function EngagementAssistantForm({
  postedPosts,
}: EngagementAssistantFormProps) {
  const [postId, setPostId] = useState("");
  const [comment, setComment] = useState("");
  const [commenterContext, setCommenterContext] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [tone, setTone] = useState("conversational");
  const [intent, setIntent] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coachingNote, setCoachingNote] = useState("");
  const [recommendedAction, setRecommendedAction] = useState<
    "reply" | "ignore" | "review"
  >("reply");
  const [replies, setReplies] = useState<GeneratedReply[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReplies([]);
    setCoachingNote("");

    try {
      const res = await fetch("/api/admin/engagement/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment,
          postId: postId || undefined,
          commenterContext,
          extraContext,
          tone,
          intent,
        }),
      });
      const data = (await res.json()) as {
        replies?: GeneratedReply[];
        coachingNote?: string;
        recommendedAction?: "reply" | "ignore" | "review";
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not generate replies.");
        return;
      }
      setReplies(data.replies ?? []);
      setCoachingNote(data.coachingNote ?? "");
      setRecommendedAction(data.recommendedAction ?? "reply");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReply(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setError("Could not copy — select the text manually.");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-cream-line bg-white p-6">
        <div className="flex items-start gap-3 rounded-xl border border-mint-200 bg-mint-50/50 p-4">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-mint-700" />
          <p className="text-sm text-coal-muted">
            Paste a LinkedIn comment below. Groq drafts 3 reply options grounded in
            your CV. Copy the one you like and post it manually on LinkedIn — no
            auto-posting yet.
          </p>
        </div>

        {postedPosts.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-coal-soft">
              Link to your post (optional)
            </label>
            <select
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal"
            >
              <option value="">No post context</option>
              {postedPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.topic.slice(0, 80)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-coal-soft">
            Comment to reply to
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            required
            placeholder="Paste the LinkedIn comment here…"
            className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal outline-none focus:ring-2 focus:ring-mint-500/30"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-coal-soft">
              Who commented? (optional)
            </label>
            <input
              value={commenterContext}
              onChange={(e) => setCommenterContext(e.target.value)}
              placeholder="e.g. Recruiter at fintech, former colleague"
              className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-coal-soft">
              Reply style
            </label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal"
            >
              {INTENTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-coal-soft">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal md:max-w-xs"
          >
            {TONES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
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
            rows={2}
            placeholder="Anything to stress or avoid in the reply…"
            className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal outline-none focus:ring-2 focus:ring-mint-500/30"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !comment.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-coal px-5 py-3 font-jakarta text-sm font-bold text-white disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Drafting replies…" : "Draft reply options"}
        </button>
      </form>

      {coachingNote && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold capitalize">
            Recommended: {recommendedAction}.
          </span>{" "}
          {coachingNote}
        </p>
      )}

      {replies.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-jakarta text-sm font-bold uppercase tracking-wider text-coal-dim">
            Reply options
          </h2>
          {replies.map((reply, index) => (
            <article
              key={`${reply.label}-${index}`}
              className="rounded-2xl border border-cream-line bg-white p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-jakarta text-sm font-bold text-coal">
                    {reply.label}
                  </p>
                  <p className="text-xs capitalize text-coal-dim">{reply.intent}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyReply(reply.text, index)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cream-line px-3 py-2 text-xs font-semibold text-coal-soft hover:bg-cream-warm"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-mint-700" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy reply
                    </>
                  )}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-coal">
                {reply.text}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
