"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Send, SkipForward } from "lucide-react";
import type { EngagementCommentRow, EngagementPollState } from "@/lib/admin-types";

function formatWhen(ts: number | null): string {
  if (!ts) return "Never";
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function EngagementQueue() {
  const [pending, setPending] = useState<EngagementCommentRow[]>([]);
  const [poll, setPoll] = useState<EngagementPollState | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/engagement/queue");
      const data = (await res.json()) as {
        pending?: EngagementCommentRow[];
        poll?: EngagementPollState;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Could not load engagement queue.");
        return;
      }
      setPending(data.pending ?? []);
      setPoll(data.poll ?? null);
      setDrafts(
        Object.fromEntries(
          (data.pending ?? []).map((item) => [
            item.id,
            item.approved_reply ?? item.suggested_replies[0]?.text ?? "",
          ]),
        ),
      );
    } catch {
      setError("Network error loading queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  async function pollNow() {
    setPolling(true);
    setError("");
    try {
      const res = await fetch("/api/admin/engagement/poll", { method: "POST" });
      const data = (await res.json()) as {
        newQueued?: number;
        error?: string;
        errors?: { postId: string; error: string }[];
      };
      if (!res.ok) {
        setError(data.error || "Poll failed.");
        return;
      }
      if (data.errors?.length) {
        setError(data.errors.map((item) => item.error).join(" "));
      }
      await loadQueue();
    } catch {
      setError("Network error during poll.");
    } finally {
      setPolling(false);
    }
  }

  async function act(id: string, action: "reply" | "skip" | "regenerate") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/engagement/queue/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          replyText: drafts[id],
        }),
      });
      const data = (await res.json()) as { error?: string; item?: EngagementCommentRow };
      if (!res.ok) {
        setError(data.error || "Action failed.");
        await loadQueue();
        return;
      }
      await loadQueue();
    } catch {
      setError("Network error.");
    } finally {
      setBusyId(null);
    }
  }

  async function copyReply(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Could not copy reply.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-white p-4">
        <div>
          <p className="font-jakarta text-sm font-bold text-coal">Comment queue</p>
          <p className="mt-1 text-xs text-coal-muted">
            Polls LinkedIn for new comments on your published posts, drafts replies,
            and posts when you approve.
          </p>
          <p className="mt-2 text-xs text-coal-dim">
            Last poll: {formatWhen(poll?.last_poll_at ?? null)}
            {poll?.last_new_count ? ` · ${poll.last_new_count} new` : ""}
          </p>
          {poll?.last_poll_error && (
            <p className="mt-2 text-xs text-amber-800">{poll.last_poll_error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={pollNow}
          disabled={polling}
          className="inline-flex items-center gap-2 rounded-xl bg-coal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${polling ? "animate-spin" : ""}`} />
          {polling ? "Polling…" : "Poll LinkedIn now"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-coal-dim">Loading queue…</p>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-line bg-white px-6 py-10 text-center">
          <p className="text-coal-muted">No pending comments.</p>
          <p className="mt-2 text-xs text-coal-dim">
            Click Poll LinkedIn now, or set a cPanel cron on{" "}
            <code className="font-mono">/api/admin/cron/poll-comments</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-cream-line bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-coal-dim">
                    {item.author_label} · {formatWhen(item.commented_at)}
                  </p>
                  <p className="mt-1 font-jakarta text-sm font-bold text-coal">
                    Re: {item.post_topic}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => act(item.id, "skip")}
                    disabled={busyId === item.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-cream-line px-3 py-2 text-xs font-semibold text-coal-muted"
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => act(item.id, "regenerate")}
                    disabled={busyId === item.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-cream-line px-3 py-2 text-xs font-semibold text-coal-soft"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Redraft
                  </button>
                </div>
              </div>

              <blockquote className="mt-4 rounded-xl bg-cream-warm px-4 py-3 text-sm text-coal">
                {item.comment_text}
              </blockquote>

              {item.coaching_note && (
                <p className="mt-3 text-xs text-amber-900">{item.coaching_note}</p>
              )}

              {item.suggested_replies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.suggested_replies.map((reply) => (
                    <button
                      key={`${item.id}-${reply.label}`}
                      type="button"
                      onClick={() =>
                        setDrafts((current) => ({ ...current, [item.id]: reply.text }))
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        drafts[item.id] === reply.text
                          ? "bg-mint-600 text-white"
                          : "bg-cream-warm text-coal-soft ring-1 ring-cream-line"
                      }`}
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={drafts[item.id] ?? ""}
                onChange={(e) =>
                  setDrafts((current) => ({ ...current, [item.id]: e.target.value }))
                }
                rows={3}
                className="mt-4 w-full rounded-xl border border-cream-line px-4 py-3 text-sm text-coal outline-none focus:ring-2 focus:ring-mint-500/30"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => act(item.id, "reply")}
                  disabled={busyId === item.id || !drafts[item.id]?.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-coal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {busyId === item.id ? "Posting…" : "Approve & reply on LinkedIn"}
                </button>
                <button
                  type="button"
                  onClick={() => copyReply(item.id, drafts[item.id] ?? "")}
                  className="inline-flex items-center gap-2 rounded-xl border border-cream-line px-4 py-2.5 text-sm font-semibold text-coal-soft"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="h-4 w-4 text-mint-700" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy instead
                    </>
                  )}
                </button>
              </div>

              {item.error_message && (
                <p className="mt-3 text-sm text-red-600">{item.error_message}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
