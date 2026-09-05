"use client";

import { useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  projectName: string;
  suggestions?: string[];
}

export default function ProjectChat({ slug, projectName, suggestions = [] }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setAnswer("");
    setError(null);
    setQuestion(q);

    try {
      const res = await fetch("/api/project-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, question: q }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        setError(body.error ?? "Request failed");
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setAnswer(full);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-20">
      <div className="rounded-2xl border border-signal/20 bg-signal/[0.03] p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-signal/30 bg-signal/10">
            <Sparkles className="h-4 w-4 text-signal" />
          </div>
          <div>
            <p className="font-display text-lg text-paper">
              Ask anything about {projectName}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              AI scoped to this project · GPT-OSS 120B
            </p>
          </div>
        </div>

        {/* Suggestion chips */}
        {suggestions.length > 0 && !answer && !loading && (
          <div className="mt-5 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-ink-line bg-ink-card px-3 py-1.5 text-xs text-paper-muted transition hover:border-signal/40 hover:text-paper"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="mt-5 flex gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's the most expensive lesson from this project?"
            className="flex-1 rounded-lg border border-ink-line bg-ink-card px-4 py-2.5 text-sm text-paper placeholder:text-paper-dim focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/20"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-4 transition",
              question.trim() && !loading
                ? "bg-signal text-ink hover:bg-signal/80"
                : "bg-ink-line text-paper-dim",
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>

        {/* Answer */}
        {(answer || error) && (
          <div className="mt-5 rounded-xl border border-ink-line bg-ink-card p-5">
            {error ? (
              <p className="text-sm text-red-300">{error}</p>
            ) : (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-paper">
                {answer}
                {loading && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-signal" />
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
