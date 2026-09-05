import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { PERSONAL } from "@/data/cv";

export const metadata: Metadata = {
  title: `Stack & cost — ${PERSONAL.name}`,
  description:
    "Full transparency on the stack powering this portfolio — and why it costs $0/month to run all the AI features.",
};

interface Row {
  service: string;
  role: string;
  tier: string;
  monthlyCost: string;
  url: string;
  note?: string;
}

const ROWS: Row[] = [
  {
    service: "Next.js 14",
    role: "App framework (App Router, Server Components)",
    tier: "Open source",
    monthlyCost: "$0",
    url: "https://nextjs.org",
  },
  {
    service: "Netlify",
    role: "Hosting · CDN · build · preview deploys",
    tier: "Starter (free)",
    monthlyCost: "$0",
    url: "https://netlify.com",
    note: "100 GB bandwidth + 300 build min / mo — well within limits.",
  },
  {
    service: "GitHub",
    role: "Source control · CI trigger",
    tier: "Free",
    monthlyCost: "$0",
    url: "https://github.com",
  },
  {
    service: "Pinecone",
    role: "Vector database for RAG retrieval",
    tier: "Starter (free)",
    monthlyCost: "$0",
    url: "https://pinecone.io",
    note: "1 serverless index, ~36 CV chunks, < 0.1% of free quota.",
  },
  {
    service: "Google Gemini",
    role: "Embeddings (gemini-embedding-001, 3072 dim)",
    tier: "Free tier",
    monthlyCost: "$0",
    url: "https://ai.google.dev",
    note: "60 RPM, 1,500 RPD. Portfolio traffic is nowhere near.",
  },
  {
    service: "Groq",
    role: "LLM inference (GPT-OSS 120B + GPT-OSS 20B)",
    tier: "Free tier",
    monthlyCost: "$0",
    url: "https://groq.com",
    note: "Sub-second latency on GPT-OSS 120B. Ridiculous quality-to-cost ratio.",
  },
  {
    service: "Cohere",
    role: "Cross-encoder reranking (rerank-v3.5)",
    tier: "Trial tier",
    monthlyCost: "$0",
    url: "https://cohere.com",
    note: "1,000 calls / month free — enough for portfolio traffic for years.",
  },
  {
    service: "Vercel Analytics + Speed Insights",
    role: "RUM · Core Web Vitals",
    tier: "Hobby (free)",
    monthlyCost: "$0",
    url: "https://vercel.com/analytics",
  },
];

const PRINCIPLES = [
  {
    title: "Best-of-tier for each job",
    detail:
      "Groq for fast LLM. Cohere for rerank. Pinecone for vectors. Gemini for embeddings. Each one is independently the best free tier in its category — and they compose cleanly.",
  },
  {
    title: "Graceful degradation built-in",
    detail:
      "If Cohere is missing, the API falls back to pure vector retrieval. If a key is missing, the feature degrades — the site never breaks.",
  },
  {
    title: "Cost > 0 — but it's negligible",
    detail:
      "If traffic ever pushes one of these tiers, the next step up is $20–50 / month — still cheaper than a single hour of a human analyst.",
  },
  {
    title: "Show, don't tell",
    detail:
      "This page exists because the cleanest way to demonstrate engineering judgement is to expose your trade-offs publicly. Transparency is a signal.",
  },
];

export default function StackPage() {
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
          <p className="meta">Transparency</p>
          <h1 className="display-1 mt-4">
            This entire portfolio runs at{" "}
            <span className="display-italic text-signal">$0 / month</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper-muted">
            Live RAG against my CV. Streaming AI chat. Vector search. Cross-encoder
            reranking. Three LLM choices. Static deploys with previews. All of it on
            free tiers — and not in a hacky way. Here&apos;s the receipt.
          </p>
        </header>

        {/* Big zero */}
        <section className="mt-12 grid grid-cols-3 gap-6 border-y border-ink-line py-12">
          <div>
            <div className="font-display text-6xl text-signal">$0</div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              Monthly cost
            </p>
          </div>
          <div>
            <div className="font-display text-6xl text-paper">8</div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              Services composed
            </p>
          </div>
          <div>
            <div className="font-display text-6xl text-paper">&lt;2s</div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
              End-to-end RAG latency
            </p>
          </div>
        </section>

        {/* Table */}
        <section className="mt-12">
          <p className="meta mb-4">The stack</p>
          <div className="overflow-hidden rounded-xl border border-ink-line">
            <table className="w-full text-sm">
              <thead className="bg-ink-elev">
                <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                  <th className="px-4 py-3">Service</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Role</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3 text-right">Cost / mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line">
                {ROWS.map((r) => (
                  <tr key={r.service} className="bg-ink-card">
                    <td className="px-4 py-4">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 font-medium text-paper transition hover:text-signal"
                      >
                        {r.service}
                        <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                      </a>
                      {r.note && (
                        <p className="mt-1 text-xs leading-relaxed text-paper-dim sm:hidden">
                          {r.role}
                        </p>
                      )}
                      {r.note && (
                        <p className="mt-1 text-[11px] leading-relaxed text-paper-dim">
                          {r.note}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-4 text-paper-muted sm:table-cell">
                      {r.role}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-ink-line bg-ink-elev px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                        {r.tier}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-signal">
                      {r.monthlyCost}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-ink-line bg-signal/5">
                  <td className="px-4 py-4 font-display text-paper" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-4 text-right font-display text-xl text-signal">
                    $0
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Principles */}
        <section className="mt-16">
          <p className="meta mb-6">Engineering principles behind it</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-ink-line bg-ink-card p-6"
              >
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                  <div>
                    <h3 className="font-display text-lg text-paper">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-paper-muted">
                      {p.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-signal/20 bg-signal/[0.03] p-7">
          <p className="text-paper-muted">
            Want this kind of cost discipline applied to your team&apos;s AI
            infra?{" "}
            <Link
              href="/#contact"
              className="text-signal underline-offset-4 hover:underline"
            >
              Let&apos;s talk →
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
