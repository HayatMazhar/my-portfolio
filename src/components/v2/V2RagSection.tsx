"use client";

import { motion } from "framer-motion";
import { Database } from "lucide-react";
import V2RagInline from "./V2RagInline";

const STEPS = [
  {
    n: "01",
    title: "Embed",
    body: "Your question becomes a 3072-dim vector with Gemini Embedding 001.",
  },
  {
    n: "02",
    title: "Retrieve + Rerank",
    body: "Pinecone fetches top-10 candidates; Cohere rerank-v3.5 reorders them.",
  },
  {
    n: "03",
    title: "Cited generation",
    body: "Groq GPT-OSS 120B synthesises a cited answer from the top-5 chunks in ~1 s.",
  },
];

export default function V2RagSection() {
  return (
    <section id="rag-demo" className="bg-[#fafaf7] py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Left — explainer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#2d9961]">
              / live demo
            </p>
            <h2 className="mt-4 font-jakarta text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0e0e0d] sm:text-5xl">
              This site runs{" "}
              <span className="font-hand text-[#3fb578]">RAG on itself.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#525251]">
              Ask anything about my CV and watch the full retrieval pipeline
              run in real time — embed, retrieve, rerank, generate with
              citations. All free-tier infrastructure.
            </p>

            <div className="mt-8 space-y-4">
              {STEPS.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e3f6ec] font-mono text-[10px] font-bold text-[#2d9961]">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-jakarta text-sm font-bold text-[#0e0e0d]">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[#525251]">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-[#b8e8ce] bg-[#f3fbf7] px-3 py-2">
              <Database className="h-4 w-4 shrink-0 text-[#2d9961]" />
              <p className="text-xs text-[#525251]">
                <span className="font-semibold text-[#0e0e0d]">16 chunks</span>{" "}
                · Pinecone serverless · Gemini · Cohere · Groq · $0/month
              </p>
            </div>
          </motion.div>

          {/* Right — real live demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="relative"
          >
            <V2RagInline />

            {/* Decorative squiggle behind */}
            <svg
              aria-hidden
              viewBox="0 0 160 60"
              className="pointer-events-none absolute -bottom-8 -right-8 hidden w-40 text-[#6dcc99] lg:block"
              fill="none"
            >
              <path
                d="M 4 30 C 20 10, 40 50, 60 30 S 100 10, 120 30 S 148 50, 156 26"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
