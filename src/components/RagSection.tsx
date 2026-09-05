"use client";

import { motion } from "framer-motion";
import { Database } from "lucide-react";
import RagDemo from "./RagDemo";

export default function RagSection() {
  return (
    <section id="rag-demo" className="section bg-ink-alt">
      <div className="container-page">
        {/* Header */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-signal">07</span>
          <span className="hairline w-12" />
          <span className="meta">Live Demo</span>
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left — explainer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="display-2">
              This site runs{" "}
              <span className="display-italic">RAG on itself.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-paper-muted">
              The demo below queries a Pinecone vector index of my CV content
              — in real time. Type any question and watch the retrieval pipeline
              run: embed → retrieve → rank → generate with citations.
            </p>

            <div className="mt-8 space-y-5">
              {[
                {
                  step: "01",
                  title: "Embed query",
                  desc: "Your question is converted to a 3072-dimension vector using Gemini Embedding 001 (free).",
                },
                {
                  step: "02",
                  title: "Retrieve + Rerank",
                  desc: "Top 10 candidates fetched from Pinecone, then Cohere rerank-v3.5 reorders them by relevance.",
                },
                {
                  step: "03",
                  title: "Cited generation",
                  desc: "Groq GPT-OSS 120B synthesises a cited answer from the top 5 chunks — in ~1 second.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="mt-1 shrink-0 font-mono text-xs text-signal">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-paper">{item.title}</p>
                    <p className="mt-0.5 text-sm text-paper-dim">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-lg border border-signal/20 bg-signal/5 px-4 py-3">
              <Database className="h-4 w-4 shrink-0 text-signal" />
              <p className="text-xs text-paper-muted">
                <span className="text-paper">16 knowledge chunks</span> · Pinecone
                serverless · Gemini embed (3072d) · Cohere rerank-v3.5 ·
                Groq GPT-OSS 120B · All free tier.
              </p>
            </div>
          </motion.div>

          {/* Right — demo widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <RagDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
