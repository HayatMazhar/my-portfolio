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
  Sparkles,
  Zap,
} from "lucide-react";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";

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

const EXAMPLE_QUERIES = [
  "How did you cut document research from 2 hours to 10 seconds?",
  "What makes you different from other AI engineers?",
  "What tech stack do you use for RAG systems?",
  "Are you available for new opportunities?",
];

export default function V2RagInline() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
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
        body: JSON.stringify({
          query: q,
          topK: 5,
          rerank: true,
          model: GROQ_CHAT_MODEL,
        }),
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
        fullText += decoder.decode(value, { stream: true });

        const sentinelIdx = fullText.indexOf("__SOURCES__");
        if (sentinelIdx !== -1) {
          const answerPart = fullText.slice(0, sentinelIdx).trimEnd();
          const sourcesPart = fullText.slice(sentinelIdx + "__SOURCES__".length);
          setStreamedText(answerPart);
          try {
            const parsed = JSON.parse(sourcesPart);
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
            /* parse failed — ignore */
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
    <div className="overflow-hidden rounded-3xl border border-[#e0dfd8] bg-white shadow-[0_18px_36px_-22px_rgba(14,14,13,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e0dfd8] bg-[#fafaf7] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ebf8f1]">
            <Database className="h-4 w-4 text-[#2d9961]" />
          </span>
          <div>
            <p className="font-jakarta text-sm font-bold text-[#0e0e0d]">
              Live RAG Demo
            </p>
            <p className="font-mono text-[10px] text-[#9a9a96]">
              Pinecone · Gemini · Cohere · Groq GPT-OSS 120B
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3fb578] opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3fb578]" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#2d9961]">
            Live
          </span>
        </div>
      </div>

      {/* Query input */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a96]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about Mazhar's background, projects, or skills…"
            className="w-full rounded-xl border border-[#e0dfd8] bg-[#fafaf7] py-3.5 pl-11 pr-14 text-sm text-[#0e0e0d] placeholder:text-[#9a9a96] transition focus:border-[#6dcc99] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6dcc99]/20"
          />
          <button
            type="submit"
            disabled={!query.trim() || streaming}
            className={`absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition ${
              query.trim() && !streaming
                ? "bg-[#0e0e0d] text-white hover:bg-[#2d9961]"
                : "bg-[#e0dfd8] text-[#9a9a96]"
            }`}
          >
            {streaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
          </button>
        </form>

        {/* Example chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleExample(q)}
              disabled={streaming}
              className="rounded-full border border-[#e0dfd8] bg-white px-3 py-1 text-[11px] text-[#525251] transition hover:border-[#6dcc99] hover:text-[#0e0e0d] disabled:opacity-50"
            >
              {q.length > 44 ? q.slice(0, 44) + "…" : q}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        {(streamedText || streaming) && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-[#e0dfd8]"
          >
            {/* Pipeline strip */}
            <div className="flex items-center gap-2 overflow-x-auto border-b border-[#e0dfd8] bg-[#fafaf7] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#9a9a96]">
              {[
                { label: "Query", done: true },
                { label: "Embed", done: true },
                { label: "Retrieve", done: sources.length > 0 },
                { label: "Rerank", done: sources.length > 0 },
                { label: "Generate", done: !streaming },
              ].map((step, i) => (
                <div key={step.label} className="flex shrink-0 items-center gap-2">
                  {i > 0 && <span className="text-[#e0dfd8]">→</span>}
                  <span
                    className={
                      step.done
                        ? "font-semibold text-[#2d9961]"
                        : streaming
                          ? "animate-pulse text-[#9a9a96]"
                          : "text-[#9a9a96]"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
              {result && (
                <span className="ml-auto flex shrink-0 items-center gap-2 text-[#525251]">
                  <span>{result.stats?.latencyMs ?? result.latencyMs}ms</span>
                </span>
              )}
            </div>

            {/* Answer */}
            <div className="px-6 py-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#3fb578]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#9a9a96]">
                  Grounded answer
                </span>
              </div>
              <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-[#0e0e0d]">
                {streamedText}
                {streaming && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#3fb578]" />
                )}
              </p>
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="border-t border-[#e0dfd8]">
                <button
                  type="button"
                  onClick={() => setShowSources((v) => !v)}
                  className="flex w-full items-center justify-between px-6 py-3 text-xs text-[#525251] transition hover:text-[#0e0e0d]"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-[#3fb578]" />
                    <span className="font-mono uppercase tracking-widest">
                      {sources.length} sources retrieved
                    </span>
                    {sources[0]?.reranked && (
                      <span className="rounded-full border border-[#fde68a] bg-[#fef9c3] px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#854d0e]">
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
                            className="flex items-center gap-3 rounded-xl border border-[#e0dfd8] bg-[#fafaf7] px-4 py-2.5"
                          >
                            <span className="shrink-0 font-mono text-[10px] font-bold text-[#2d9961]">
                              [{i + 1}]
                            </span>
                            <p className="min-w-0 flex-1 truncate text-xs text-[#0e0e0d]">
                              {src.title}
                            </p>
                            <span className="shrink-0 rounded-full border border-[#e0dfd8] bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#525251]">
                              {src.category}
                            </span>
                            <div className="hidden w-20 shrink-0 items-center gap-2 sm:flex">
                              <div className="h-1 flex-1 rounded-full bg-[#e0dfd8]">
                                <div
                                  className="h-full rounded-full bg-[#3fb578] transition-all"
                                  style={{ width: `${scoreBar(src.score)}%` }}
                                />
                              </div>
                              <span className="w-8 text-right font-mono text-[9px] text-[#9a9a96]">
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
