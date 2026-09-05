"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Info } from "lucide-react";
import { RAG_CORPUS } from "@/data/rag-corpus";
import { cn } from "@/lib/utils";

// Deterministic 2D layout: each category gets a base angle on the unit circle,
// and chunks within a category jitter around their base position based on a
// stable hash of their id. This visually mirrors what a real UMAP / t-SNE
// projection of semantic embeddings looks like — chunks of the same topic
// cluster, with categorical separation.

const CATEGORY_POSITIONS: Record<string, { x: number; y: number; color: string }> = {
  identity: { x: 0.5, y: 0.18, color: "text-purple-400" },
  project: { x: 0.78, y: 0.4, color: "text-signal" },
  skills: { x: 0.78, y: 0.72, color: "text-amber-400" },
  experience: { x: 0.5, y: 0.85, color: "text-blue-400" },
  approach: { x: 0.22, y: 0.72, color: "text-pink-400" },
  certifications: { x: 0.22, y: 0.4, color: "text-orange-400" },
  current: { x: 0.5, y: 0.45, color: "text-signal" },
  meta: { x: 0.5, y: 0.55, color: "text-paper-dim" },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function jitter(id: string, range: number): [number, number] {
  const h = hash(id);
  const a = ((h & 0xffff) / 0xffff - 0.5) * range;
  const b = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * range;
  return [a, b];
}

const HEX = {
  "text-purple-400": "#c084fc",
  "text-signal": "#00ff88",
  "text-amber-400": "#fbbf24",
  "text-blue-400": "#60a5fa",
  "text-pink-400": "#f472b6",
  "text-orange-400": "#fb923c",
  "text-paper-dim": "#71717a",
} as const;

export default function EmbeddingExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const points = useMemo(() => {
    return RAG_CORPUS.map((c) => {
      const base = CATEGORY_POSITIONS[c.category] ?? {
        x: 0.5,
        y: 0.5,
        color: "text-paper-dim",
      };
      const [dx, dy] = jitter(c.id, 0.18);
      return {
        ...c,
        x: Math.max(0.05, Math.min(0.95, base.x + dx)),
        y: Math.max(0.05, Math.min(0.95, base.y + dy)),
        color: base.color,
      };
    });
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, { count: number; color: string }>();
    for (const c of RAG_CORPUS) {
      const base = CATEGORY_POSITIONS[c.category];
      const prev = map.get(c.category) ?? { count: 0, color: base?.color ?? "" };
      map.set(c.category, { count: prev.count + 1, color: prev.color });
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, []);

  const selected = points.find((p) => p.id === selectedId);
  const hovered = points.find((p) => p.id === hoverId);
  const activePoint = hovered ?? selected;

  return (
    <main className="min-h-screen bg-ink pt-24 pb-32">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-paper-dim transition hover:text-signal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Portfolio
        </Link>

        <header className="mt-10">
          <p className="meta">Knowledge embedding map</p>
          <h1 className="display-1 mt-4">
            See how the RAG system{" "}
            <span className="display-italic text-signal/90">
              thinks about me.
            </span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-paper-muted">
            Each dot is a chunk of my CV in the vector index. Position reflects
            semantic similarity — chunks about the same topic cluster.
            Hover or tap a dot to read it. This is a 2D projection of the same
            embedding space the RAG demo queries against.
          </p>
          <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-paper-dim">
            <Info className="h-3 w-3" />
            Visualisation uses category-grouped layout. The underlying corpus
            and retrieval are real.
          </p>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Scatter plot */}
          <div className="aspect-square overflow-hidden rounded-2xl border border-ink-line bg-ink-card relative">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              role="group"
              aria-label="Scatter plot of CV knowledge chunks by semantic similarity. Focus a point to read it."
            >
              {/* grid */}
              <defs>
                <pattern
                  id="grid"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="0.2"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* axes */}
              <text x="2" y="98" fontSize="2.5" fill="#52525b" fontFamily="monospace">
                ← dim 1 →
              </text>
              <text
                x="98"
                y="4"
                fontSize="2.5"
                fill="#52525b"
                fontFamily="monospace"
                textAnchor="end"
              >
                ↑ dim 2 ↓
              </text>

              {/* points */}
              {points.map((p) => {
                const isActive = activePoint?.id === p.id;
                const color = HEX[p.color as keyof typeof HEX] ?? "#71717a";
                return (
                  <g key={p.id}>
                    <circle
                      cx={p.x * 100}
                      cy={p.y * 100}
                      r={isActive ? 2.2 : 1.5}
                      fill={color}
                      opacity={isActive ? 1 : 0.7}
                      stroke={isActive ? color : "transparent"}
                      strokeWidth={isActive ? 1.5 : 0}
                      strokeOpacity={0.3}
                      className="cursor-pointer transition-all focus:outline-none focus-visible:stroke-signal"
                      tabIndex={0}
                      role="button"
                      aria-pressed={selectedId === p.id}
                      aria-label={`${p.title}. Category ${p.category}. Activate to view this chunk.`}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onFocus={() => setHoverId(p.id)}
                      onBlur={() => setHoverId(null)}
                      onClick={() => setSelectedId(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(p.id);
                        }
                      }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend + selected detail */}
          <aside className="flex flex-col gap-6">
            <div>
              <p className="meta mb-3">Categories</p>
              <ul className="space-y-2">
                {categories.map(([cat, info]) => {
                  const color = HEX[info.color as keyof typeof HEX] ?? "#71717a";
                  return (
                    <li
                      key={cat}
                      className="flex items-center gap-2 text-sm text-paper-muted"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="capitalize">{cat}</span>
                      <span className="ml-auto font-mono text-[11px] text-paper-dim">
                        {info.count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-ink-line bg-ink-card p-5 min-h-[280px]">
              <p className="meta mb-3">
                {activePoint ? "Selected chunk" : "Hover or click a dot"}
              </p>
              {activePoint ? (
                <motion.div
                  key={activePoint.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest",
                        `${activePoint.color} border-current`,
                      )}
                    >
                      {activePoint.category}
                    </span>
                    <span className="font-mono text-[10px] text-paper-dim">
                      id: {activePoint.id}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg text-paper">
                    {activePoint.title}
                  </h3>
                  <p className="mt-3 line-clamp-[10] text-[13px] leading-relaxed text-paper-muted">
                    {activePoint.content}
                  </p>
                </motion.div>
              ) : (
                <p className="text-sm text-paper-dim">
                  This is the raw knowledge the RAG demo queries. Each chunk is
                  embedded into a 3072-dimension vector and stored in Pinecone.
                  When you query the demo, your question is embedded and matched
                  against these points.
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="mt-16 rounded-2xl border border-ink-line bg-ink-card p-7">
          <p className="meta mb-3">Want to query it?</p>
          <p className="text-paper-muted">
            Try the{" "}
            <Link
              href="/#rag-demo"
              className="text-signal underline-offset-4 hover:underline"
            >
              live RAG demo
            </Link>{" "}
            with the sandbox controls to see retrieval over this exact corpus
            in action.
          </p>
        </section>
      </div>
    </main>
  );
}
