"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
  GitCompare,
} from "lucide-react";
import { PERSONAL } from "@/data/cv";
import { cn } from "@/lib/utils";
import BookCall from "@/components/BookCall";
import JdComposer, { resolveJdText } from "@/components/JdComposer";

interface FitReport {
  overallFit: "strong" | "good" | "partial" | "weak";
  fitScore: number;
  headline: string;
  strengths: { requirement: string; evidence: string }[];
  gaps: { requirement: string; honestNote: string }[];
  tailoredPitch: string;
  suggestedNextStep: string;
}

const FIT_COLORS: Record<string, string> = {
  strong: "text-signal border-signal/40 bg-signal/10",
  good: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  partial: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  weak: "text-red-400 border-red-400/40 bg-red-400/10",
};

const SAMPLE_JD = `Senior AI Engineer
Location: Dubai, UAE (Hybrid)

We're looking for a senior AI engineer to lead the LLM and RAG initiatives for our fintech platform. You'll own the architecture of conversational interfaces, document intelligence pipelines, and structured data extraction systems.

Required:
- 7+ years software engineering, 2+ years building production LLM systems
- Experience with RAG, vector databases (Pinecone, Weaviate, or similar)
- Hands-on with Azure OpenAI, GPT-4, Claude
- Strong full-stack background (TypeScript / Python / .NET acceptable)
- Track record of shipped AI products (demos don't count)
- Comfortable with Arabic content / bilingual systems

Nice to have:
- Microsoft Azure AI training or certifications
- Experience in regulated environments (banking, government)
- Open-source contributions`;

interface CompareJD {
  id: number;
  label: string;
  jd: string;
  report: FitReport | null;
  loading: boolean;
  error: string | null;
}

let nextId = 1;

export default function FitPage() {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<FitReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<CompareJD[]>(() => [
    { id: nextId++, label: "JD 1", jd: "", report: null, loading: false, error: null },
    { id: nextId++, label: "JD 2", jd: "", report: null, loading: false, error: null },
  ]);

  async function analyzeOne(text: string): Promise<FitReport | { error: string }> {
    const res = await fetch("/api/fit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd: text }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Analysis failed" };
    return data as FitReport;
  }

  async function analyzeAll() {
    // Analyse every JD that has content but no report yet
    const targets = comparisons.filter((c) => c.jd.trim() && !c.report && !c.loading);
    if (!targets.length) return;
    setComparisons((prev) =>
      prev.map((c) =>
        targets.find((t) => t.id === c.id) ? { ...c, loading: true, error: null } : c,
      ),
    );
    await Promise.all(
      targets.map(async (t) => {
        try {
          const jdText = await resolveJdText(t.jd);
          if (jdText !== t.jd) {
            setComparisons((prev) =>
              prev.map((c) => (c.id === t.id ? { ...c, jd: jdText } : c)),
            );
          }
          const result = await analyzeOne(jdText);
          setComparisons((prev) =>
            prev.map((c) =>
              c.id === t.id
                ? "error" in result
                  ? { ...c, loading: false, error: result.error }
                  : { ...c, loading: false, report: result }
                : c,
            ),
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Could not read that JD.";
          setComparisons((prev) =>
            prev.map((c) =>
              c.id === t.id ? { ...c, loading: false, error: message } : c,
            ),
          );
        }
      }),
    );
  }

  function addComparison() {
    setComparisons((prev) => [
      ...prev,
      { id: nextId++, label: `JD ${prev.length + 1}`, jd: "", report: null, loading: false, error: null },
    ]);
  }

  function removeComparison(id: number) {
    setComparisons((prev) => prev.filter((c) => c.id !== id));
  }

  function updateComparison(id: number, patch: Partial<CompareJD>) {
    setComparisons((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function analyze() {
    if (!jd.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const jdText = await resolveJdText(jd);
      if (jdText !== jd) setJd(jdText);
      const res = await fetch("/api/fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: jdText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
      } else {
        setReport(data as FitReport);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink pt-24 pb-32">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-paper-dim transition hover:text-signal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Portfolio
        </Link>

        <header className="mt-10">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
            <Target className="h-3 w-3" />
            <span>AI Fit Analyser</span>
          </div>
          <h1 className="display-1 mt-5">
            Paste a JD, a link, or a document.
            <br />
            <span className="display-italic text-signal/90">
              I&apos;ll tell you honestly
            </span>{" "}
            if I&apos;m a fit.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper-muted">
            Drop in the posting as text, a public URL, or a PDF/DOCX. An AI
            compares it against my full CV and produces a structured fit
            report: strengths, gaps (yes, real gaps — not just spin), a
            tailored pitch, and a suggested next step. Powered by GPT-OSS 120B
            on Groq. Takes ~10 seconds. Free.
          </p>

          {/* Mode toggle */}
          <div className="mt-8 inline-flex rounded-full border border-ink-line bg-ink-card p-1">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition",
                mode === "single"
                  ? "bg-signal/15 text-signal"
                  : "text-paper-dim hover:text-paper",
              )}
            >
              <Target className="-mt-0.5 mr-1.5 inline h-3 w-3" />
              Single JD
            </button>
            <button
              type="button"
              onClick={() => setMode("compare")}
              className={cn(
                "rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition",
                mode === "compare"
                  ? "bg-signal/15 text-signal"
                  : "text-paper-dim hover:text-paper",
              )}
            >
              <GitCompare className="-mt-0.5 mr-1.5 inline h-3 w-3" />
              Compare {comparisons.length} JDs
            </button>
          </div>
        </header>

        {mode === "compare" ? (
          <ComparePanel
            comparisons={comparisons}
            onUpdate={updateComparison}
            onAdd={addComparison}
            onRemove={removeComparison}
            onAnalyze={analyzeAll}
          />
        ) : (
        <>
        {/* JD input */}
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <label className="meta">Job description</label>
          </div>
          <JdComposer
            value={jd}
            onChange={setJd}
            sampleLabel="Load sample JD"
            onSample={() => setJd(SAMPLE_JD)}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={analyze}
              disabled={!jd.trim() || loading}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition",
                jd.trim() && !loading
                  ? "bg-signal text-ink hover:bg-signal/80"
                  : "bg-ink-line text-paper-dim",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyse fit
                </>
              )}
            </button>
          </div>
        </section>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report */}
        <AnimatePresence>
          {report && (
            <motion.section
              key="report"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-12"
            >
              {/* Overall fit hero */}
              <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                <div
                  className={cn(
                    "flex h-32 w-32 flex-col items-center justify-center rounded-2xl border",
                    FIT_COLORS[report.overallFit],
                  )}
                >
                  <span className="font-display text-5xl">
                    {report.fitScore}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    {report.overallFit} fit
                  </span>
                </div>
                <div>
                  <p className="meta">Fit headline</p>
                  <p className="mt-2 text-xl leading-snug text-paper">
                    {report.headline}
                  </p>
                </div>
              </div>

              {/* Strengths */}
              <div className="mt-10">
                <p className="meta mb-4 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-signal" />
                  Strengths · {report.strengths.length}
                </p>
                <ul className="space-y-3">
                  {report.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-ink-line bg-ink-card p-5"
                    >
                      <p className="font-medium text-paper">{s.requirement}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-paper-muted">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                          Evidence ·
                        </span>{" "}
                        {s.evidence}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              {report.gaps?.length > 0 && (
                <div className="mt-10">
                  <p className="meta mb-4 flex items-center gap-2">
                    <X className="h-3.5 w-3.5 text-red-400" />
                    Honest gaps · {report.gaps.length}
                  </p>
                  <ul className="space-y-3">
                    {report.gaps.map((g, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-5"
                      >
                        <p className="font-medium text-paper">
                          {g.requirement}
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-paper-muted">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                            Honest note ·
                          </span>{" "}
                          {g.honestNote}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pitch */}
              <div className="mt-10 rounded-2xl border border-signal/20 bg-signal/[0.04] p-7">
                <p className="meta mb-3">Tailored opening pitch</p>
                <p className="text-lg leading-relaxed text-paper">
                  &ldquo;{report.tailoredPitch}&rdquo;
                </p>
              </div>

              {/* Next step */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-line bg-ink-card p-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                    Suggested next step
                  </p>
                  <p className="mt-1 text-paper">
                    {report.suggestedNextStep}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BookCall variant="primary" label="Book call" />
                  <a
                    href={`mailto:${PERSONAL.email}?subject=${encodeURIComponent(
                      "Quick call about fit — " + report.headline,
                    )}`}
                    className="btn-secondary"
                  >
                    <Mail className="h-3.5 w-3.5 text-signal" />
                    Email
                  </a>
                </div>
              </div>

              <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                Generated by GPT-OSS 120B on Groq · grounded against Mazhar&apos;s
                full CV
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Help text */}
        {!report && !error && (
          <p className="mt-8 text-center text-sm text-paper-dim">
            Tip: a public careers-page URL or a PDF/DOCX works. LinkedIn and
            some boards hide the posting — paste the text if Fetch comes back
            empty.
          </p>
        )}
        </>
        )}
      </div>
    </main>
  );
}

function ComparePanel({
  comparisons,
  onUpdate,
  onAdd,
  onRemove,
  onAnalyze,
}: {
  comparisons: CompareJD[];
  onUpdate: (id: number, patch: Partial<CompareJD>) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
  onAnalyze: () => void;
}) {
  const anyAnalysed = comparisons.some((c) => c.report);
  const anyLoading = comparisons.some((c) => c.loading);
  const ready = comparisons.filter((c) => c.jd.trim()).length;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="meta">Side-by-side mode</p>
          <p className="mt-1.5 text-sm text-paper-muted">
            Paste {comparisons.length} JDs as text, a public URL, or a file. I&apos;ll
            score them all in parallel and surface the strongest match.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAdd}
            disabled={comparisons.length >= 4}
            className="btn-ghost"
          >
            <Plus className="h-3.5 w-3.5 text-signal" />
            Add JD
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!ready || anyLoading}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition",
              ready && !anyLoading
                ? "bg-signal text-ink hover:bg-signal/80"
                : "bg-ink-line text-paper-dim",
            )}
          >
            {anyLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing {comparisons.filter((c) => c.loading).length}…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyse all ({ready})
              </>
            )}
          </button>
        </div>
      </div>

      {/* JD inputs grid */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {comparisons.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-ink-line bg-ink-card p-4"
          >
            <div className="flex items-center justify-between">
              <input
                value={c.label}
                onChange={(e) => onUpdate(c.id, { label: e.target.value })}
                className="bg-transparent font-mono text-[11px] uppercase tracking-widest text-signal outline-none"
              />
              {comparisons.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemove(c.id)}
                  aria-label="Remove JD"
                  className="rounded p-1 text-paper-dim transition hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <JdComposer
              compact
              value={c.jd}
              onChange={(jd) => onUpdate(c.id, { jd })}
            />
            {c.error && (
              <p className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {c.error}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Comparison table */}
      {anyAnalysed && (
        <div className="mt-12">
          <p className="meta mb-4">Comparison results</p>
          <div className="overflow-x-auto rounded-2xl border border-ink-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-line bg-ink-card font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                  <th className="px-4 py-3 text-left">JD</th>
                  <th className="px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Fit</th>
                  <th className="px-4 py-3 text-left">Headline</th>
                  <th className="px-4 py-3 text-right">Strengths · Gaps</th>
                </tr>
              </thead>
              <tbody>
                {[...comparisons]
                  .filter((c) => c.report)
                  .sort((a, b) => (b.report!.fitScore - a.report!.fitScore))
                  .map((c, i) => (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-ink-line transition hover:bg-ink-card",
                        i === 0 && "bg-signal/[0.05]",
                      )}
                    >
                      <td className="px-4 py-4 font-medium text-paper">
                        {c.label}
                        {i === 0 && (
                          <span className="ml-2 rounded-full border border-signal/40 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal">
                            Best
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-display text-2xl text-paper">
                        {c.report!.fitScore}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest",
                            FIT_COLORS[c.report!.overallFit],
                          )}
                        >
                          {c.report!.overallFit}
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-4 text-paper-muted">
                        {c.report!.headline}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-xs text-paper-dim">
                        <span className="text-signal">
                          ✓ {c.report!.strengths.length}
                        </span>{" "}
                        ·{" "}
                        <span className="text-amber-400">
                          ⚠ {c.report!.gaps.length}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-paper-dim">
            Sorted by fit score · highest first · all reports grounded in the
            same CV
          </p>
        </div>
      )}
    </section>
  );
}
