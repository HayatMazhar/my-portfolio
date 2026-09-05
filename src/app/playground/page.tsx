"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_PRESETS = [
  {
    label: "Sample contract",
    doc: `SERVICE AGREEMENT

This Agreement is made effective on March 15, 2026 between TechCorp Ltd ("Client") and Acme Consulting LLC ("Consultant").

1. SCOPE OF SERVICES
Consultant shall provide AI architecture consulting services for the Client's customer support automation initiative, including design review, implementation guidance, and weekly status reporting.

2. TERM
This Agreement begins on April 1, 2026 and continues for six (6) months, ending September 30, 2026. The Agreement may be extended by mutual written agreement for an additional six months at the same rate.

3. COMPENSATION
The Client shall pay the Consultant a fixed monthly retainer of USD 18,000, payable by the 5th of each month. Payment terms: NET-15. Late payments incur a 2% monthly penalty.

4. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all information exchanged during the engagement, surviving termination for 3 years.

5. TERMINATION
Either party may terminate this Agreement with 30 days written notice. Termination for cause may be immediate upon material breach.

6. GOVERNING LAW
This Agreement is governed by the laws of the Emirate of Abu Dhabi, UAE.`,
    question: "What's the total contract value and termination notice period?",
  },
  {
    label: "Sample JD",
    doc: `Principal AI Engineer — Healthcare Platform

We are hiring a Principal AI Engineer to lead our clinical decision support and document intelligence initiatives. You will own the architecture from research to production, mentor a team of 4 ML engineers, and partner with clinicians.

Required:
- 8+ years software engineering experience
- 3+ years building production LLM / RAG systems  
- Deep experience with vector databases and retrieval systems
- HIPAA / regulated environment familiarity
- Strong written communication

Nice to have:
- Published research or open source contributions
- Experience with multi-modal AI (vision + text)
- Track record of mentoring senior engineers

Location: Remote (US-based preferred)
Compensation: $250-320K base + equity`,
    question: "What are the must-have qualifications vs nice-to-haves?",
  },
  {
    label: "Sample meeting notes",
    doc: `Q1 Planning Meeting — March 4, 2026
Attendees: Sarah (PM), Mike (Eng Lead), Priya (Design), Ahmed (Data)

Key decisions:
- Launch new RAG-based help feature by end of Q1
- Mike to staff with 2 backend engineers, 1 ML engineer
- Sarah will define success metrics by March 11
- Target: 30% reduction in support tickets, 80% answer accuracy
- Budget approved: $45,000 for Q1

Concerns raised:
- Ahmed flagged data quality issues in the help docs corpus
- Priya wants UX research before any UI work — 2 weeks needed
- Mike worried about latency on edge cases

Action items:
- Sarah: define metrics + write PRD by March 11
- Ahmed: data quality audit, due March 18
- Priya: schedule UX interviews, start March 14
- Mike: hire 1 ML engineer by April 1, scope architecture spike

Next meeting: March 11, same time.`,
    question: "What are all the action items with their owners and dates?",
  },
];

export default function PlaygroundPage() {
  const [doc, setDoc] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function runQuery() {
    if (!doc.trim() || !question.trim() || loading) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setAnswer("");
    setError(null);

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc, question }),
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

  function loadPreset(p: (typeof SAMPLE_PRESETS)[number]) {
    setDoc(p.doc);
    setQuestion(p.question);
    setAnswer("");
    setError(null);
  }

  return (
    <main className="min-h-screen bg-ink pt-24 pb-32">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-paper-dim transition hover:text-signal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Portfolio
        </Link>

        <header className="mt-10">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-signal">
            <Wand2 className="h-3 w-3" />
            <span>Playground · paste your own document</span>
          </div>
          <h1 className="display-1 mt-5">
            Try the AI on{" "}
            <span className="display-italic text-signal/90">your document.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-paper-muted">
            Paste anything — a contract, a job description, meeting notes, a
            paper — and ask the AI a question about it. Nothing is stored.
            Sub-second responses. This is the same kind of grounded
            document-AI I build in production. Powered by GPT-OSS 120B on Groq.
          </p>
        </header>

        {/* Presets */}
        <section className="mt-8">
          <p className="meta mb-3">Try a preset</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => loadPreset(p)}
                className="inline-flex items-center gap-2 rounded-full border border-ink-line bg-ink-card px-3.5 py-1.5 text-xs text-paper-muted transition hover:border-signal/40 hover:text-paper"
              >
                <FileText className="h-3 w-3" />
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Doc + question */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="meta">Your document</label>
            <textarea
              value={doc}
              onChange={(e) => setDoc(e.target.value)}
              placeholder="Paste any text here — up to 20,000 characters."
              rows={16}
              maxLength={20000}
              className="mt-3 w-full resize-y rounded-xl border border-ink-line bg-ink-card p-4 text-sm leading-relaxed text-paper placeholder:text-paper-dim focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/20"
            />
            <p className="mt-1 text-right font-mono text-[10px] text-paper-dim">
              {doc.length.toLocaleString()} / 20,000
            </p>
          </div>

          <div className="flex flex-col">
            <label className="meta">Your question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What do you want to know about the document?"
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-ink-line bg-ink-card p-4 text-sm leading-relaxed text-paper placeholder:text-paper-dim focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/20"
            />
            <button
              type="button"
              onClick={runQuery}
              disabled={!doc.trim() || !question.trim() || loading}
              className={cn(
                "mt-3 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition",
                doc.trim() && question.trim() && !loading
                  ? "bg-signal text-ink hover:bg-signal/80"
                  : "bg-ink-line text-paper-dim",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Ask
                </>
              )}
            </button>

            {/* Answer */}
            <div className="mt-5 flex-1 rounded-xl border border-ink-line bg-ink-card p-5">
              <p className="meta mb-3">Answer</p>
              {error ? (
                <p className="text-sm text-red-300">{error}</p>
              ) : answer ? (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-paper">
                  {answer}
                  {loading && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-signal" />
                  )}
                </p>
              ) : (
                <p className="text-sm text-paper-dim">
                  Your answer will appear here.
                </p>
              )}
            </div>
          </div>
        </section>

        <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-widest text-paper-dim">
          Nothing stored · Streaming response · GPT-OSS 120B on Groq
        </p>
      </div>
    </main>
  );
}
