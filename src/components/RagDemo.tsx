"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Database,
  Loader2,
  Search,
  Settings2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GROQ_DEMO_MODELS } from "@/lib/groq-models";

interface Source {
  id: string;
  title: string;
  category: string;
  score: number;
  reranked?: boolean;
}

interface DemoResult {
  answer: string;
  sources: Source[];
  query: string;
  latencyMs: number;
  stats?: {
    latencyMs: number;
    topK: number;
    retrieved: number;
    reranked: boolean;
    model: string;
  };
}

const MODELS = GROQ_DEMO_MODELS;

const EXAMPLE_QUERIES = [
  "How did you cut document research from 2 hours to 10 seconds?",
  "What makes you different from other AI engineers?",
  "What tech stack do you use for RAG systems?",
  "Tell me about your NL-to-SQL platform",
  "What certifications do you hold?",
  "Are you available for new opportunities?",
];

const CATEGORY_COLORS: Record<string, string> = {
  project: "text-signal bg-signal/10 border-signal/20",
  skills: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  experience: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  identity: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  certifications: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  approach: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  current: "text-signal bg-signal/10 border-signal/20",
  meta: "text-paper-dim bg-ink-elev border-ink-line",
};

export default function RagDemo() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [topK, setTopK] = useState(5);
  const [rerank, setRerank] = useState(true);
  const [model, setModel] = useState(MODELS[0].id);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runQuery(q: string) {
    if (!q.trim() || streaming) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStreaming(true);
    setStreamedText("");
    setSources([]);
    setResult(null);
    setError(null);
    setShowSources(false);

    const startMs = Date.now();

    try {
      const res = await fetch("/api/rag-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, topK, rerank, model }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        setError(body.error ?? "Request failed");
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Check for sources sentinel
        const sentinelIdx = fullText.indexOf("__SOURCES__");
        if (sentinelIdx !== -1) {
          const answerPart = fullText.slice(0, sentinelIdx).trimEnd();
          const sourcesPart = fullText.slice(sentinelIdx + "__SOURCES__".length);
          setStreamedText(answerPart);
          try {
            const parsed = JSON.parse(sourcesPart);
            // Support both old shape (array) and new shape ({ chunks, stats })
            const parsedSources: Source[] = Array.isArray(parsed)
              ? parsed
              : (parsed.chunks ?? []);
            const stats = Array.isArray(parsed) ? undefined : parsed.stats;
            setSources(parsedSources);
            setResult({
              answer: answerPart,
              sources: parsedSources,
              query: q,
              latencyMs: Date.now() - startMs,
              stats,
            });
          } catch {
            /* sources parse failed — ignore */
          }
        } else {
          setStreamedText(fullText);
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runQuery(query);
  }

  function handleExample(q: string) {
    setQuery(q);
    runQuery(q);
    inputRef.current?.blur();
  }

  const scoreBar = (score: number) => Math.round(score * 100);

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink-line px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/10">
            <Database className="h-4 w-4 text-signal" />
          </div>
          <div>
            <p className="text-sm font-medium text-paper">Live RAG Demo</p>
            <p className="font-mono text-[10px] text-paper-dim">
              Pinecone · Gemini embed · Cohere rerank · Groq GPT-OSS 120B
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-signal" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
            Live
          </span>
        </div>
      </div>

      {/* Query input */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-dim" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about Mazhar's background, projects, or skills…"
            className="w-full rounded-xl border border-ink-line bg-ink-elev py-3.5 pl-11 pr-14 text-sm text-paper placeholder:text-paper-dim focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/20 transition"
          />
          <button
            type="submit"
            disabled={!query.trim() || streaming}
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg transition",
              query.trim() && !streaming
                ? "bg-signal text-ink hover:bg-signal/80"
                : "bg-ink-line text-paper-dim",
            )}
          >
            {streaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
          </button>
        </form>

        {/* Example queries */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {EXAMPLE_QUERIES.slice(0, 4).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleExample(q)}
              disabled={streaming}
              className="rounded-full border border-ink-line bg-ink-elev px-3 py-1 text-[11px] text-paper-dim transition hover:border-signal/30 hover:text-paper disabled:opacity-50"
            >
              {q.length > 42 ? q.slice(0, 42) + "…" : q}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowSandbox((v) => !v)}
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition",
              showSandbox
                ? "border-signal/40 bg-signal/10 text-signal"
                : "border-ink-line bg-ink-elev text-paper-dim hover:text-paper",
            )}
            aria-expanded={showSandbox}
          >
            <Settings2 className="h-3 w-3" />
            Sandbox
          </button>
        </div>

        {/* Sandbox controls */}
        <AnimatePresence>
          {showSandbox && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-4 rounded-xl border border-ink-line bg-ink-elev/60 p-4 sm:grid-cols-3">
                {/* top_k slider */}
                <div>
                  <label className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                    <span>top_k</span>
                    <span className="text-signal">{topK}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="mt-2 w-full accent-signal"
                  />
                  <p className="mt-1 text-[10px] text-paper-dim">
                    Chunks sent to the model
                  </p>
                </div>

                {/* rerank toggle */}
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                    Reranking
                  </label>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRerank(true)}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-1.5 text-xs transition",
                        rerank
                          ? "border-signal/40 bg-signal/10 text-signal"
                          : "border-ink-line text-paper-dim hover:text-paper",
                      )}
                    >
                      Cohere on
                    </button>
                    <button
                      type="button"
                      onClick={() => setRerank(false)}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-1.5 text-xs transition",
                        !rerank
                          ? "border-paper/40 bg-paper/10 text-paper"
                          : "border-ink-line text-paper-dim hover:text-paper",
                      )}
                    >
                      Vector only
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-paper-dim">
                    Cross-encoder reranking lifts precision
                  </p>
                </div>

                {/* model picker */}
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                    Generator
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-2 w-full rounded-md border border-ink-line bg-ink-card px-2 py-1.5 text-xs text-paper focus:border-signal/40 focus:outline-none"
                  >
                    {MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} — {m.hint}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-paper-dim">
                    Try a smaller model — see latency drop
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-6 mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}

        {(streamedText || streaming) && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-ink-line"
          >
            {/* Pipeline visualization */}
            <div className="flex items-center gap-2 overflow-x-auto px-6 py-3 text-[10px] font-mono uppercase tracking-[0.15em] text-paper-dim border-b border-ink-line bg-ink-elev/50">
              {[
                { label: "Query", done: true },
                { label: "Embed", done: true },
                { label: "Retrieve", done: sources.length > 0 },
                { label: "Rerank", done: sources.length > 0 },
                { label: "Generate", done: !streaming },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 shrink-0">
                  {i > 0 && <span className="text-ink-line">→</span>}
                  <span
                    className={cn(
                      "transition",
                      step.done ? "text-signal" : streaming ? "text-paper-dim animate-pulse" : "text-paper-dim",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
              {result && (
                <span className="ml-auto flex shrink-0 items-center gap-2 text-paper-dim">
                  <span>{(result.stats?.latencyMs ?? result.latencyMs)}ms</span>
                  {result.stats && (
                    <>
                      <span className="text-ink-line">·</span>
                      <span>
                        top_k={result.stats.topK}
                        {result.stats.reranked ? "·rerank" : ""}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>

            {/* Answer */}
            <div className="px-6 py-5">
              <p className="text-[15px] leading-[1.8] text-paper-muted whitespace-pre-wrap">
                {streamedText}
                {streaming && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-signal" />
                )}
              </p>
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="border-t border-ink-line">
                <button
                  type="button"
                  onClick={() => setShowSources((v) => !v)}
                  className="flex w-full items-center justify-between px-6 py-3 text-xs text-paper-dim transition hover:text-paper"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-signal" />
                    <span className="font-mono uppercase tracking-widest">
                      {sources.length} sources retrieved
                    </span>
                    {sources[0]?.reranked && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400">
                        Cohere reranked
                      </span>
                    )}
                  </div>
                  {showSources ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <AnimatePresence>
                  {showSources && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 px-6 pb-5">
                        {sources.map((src, i) => (
                          <div
                            key={src.id}
                            className="flex items-center gap-3 rounded-lg border border-ink-line bg-ink-elev px-4 py-2.5"
                          >
                            <span className="shrink-0 font-mono text-[10px] text-signal/60">
                              [{i + 1}]
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-paper">
                                {src.title}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                                CATEGORY_COLORS[src.category] ?? CATEGORY_COLORS.meta,
                              )}
                            >
                              {src.category}
                            </span>
                            {/* Similarity score bar */}
                            <div className="hidden w-20 shrink-0 items-center gap-2 sm:flex">
                              <div className="h-1 flex-1 rounded-full bg-ink-line">
                                <div
                                  className="h-full rounded-full bg-signal transition-all"
                                  style={{ width: `${scoreBar(src.score)}%` }}
                                />
                              </div>
                              <span className="w-8 text-right font-mono text-[9px] text-paper-dim">
                                {scoreBar(src.score)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
