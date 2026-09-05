"use client";

import {
  V2DiagramArrow,
  V2DiagramCodeCard,
  V2DiagramLane,
  V2DiagramNode,
  V2DiagramShell,
} from "./V2DiagramShell";

export default function V2RagDiagram() {
  return (
    <V2DiagramShell title="rag.pipeline">
      <svg
        viewBox="0 0 720 360"
        className="w-full"
        role="img"
        aria-label="Retrieval Augmented Generation pipeline"
      >
        <defs>
          <linearGradient id="v2-rag-vec" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6dcc99" stopOpacity={0.30} />
            <stop offset="100%" stopColor="#6dcc99" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Lanes */}
        <V2DiagramLane x={10} y={12} w={140} h={336} label="CORPUS" />
        <V2DiagramLane x={160} y={12} w={150} h={336} label="INDEX" />
        <V2DiagramLane x={320} y={12} w={170} h={336} label="RETRIEVE" />
        <V2DiagramLane x={500} y={12} w={210} h={336} label="GENERATE · CITE" />

        {/* ── CORPUS ───────────────────────────────────────────────── */}
        <g transform="translate(20, 38)">
          <rect
            width={120}
            height={290}
            rx={8}
            fill="#ffffff"
            stroke="#e0dfd8"
          />
          <text
            x={60}
            y={20}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#9a9a96"
            style={{ fontSize: 8.5, letterSpacing: 1 }}
          >
            100K+ DOCS
          </text>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`translate(15, ${36 + i * 32})`}>
              <rect
                width={90}
                height={24}
                rx={4}
                fill="#fafaf7"
                stroke="#e0dfd8"
              />
              <text
                x={8}
                y={16}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fill="#525251"
                style={{ fontSize: 9 }}
              >
                doc_{String(i + 1).padStart(3, "0")}.pdf
              </text>
            </g>
          ))}
          <text
            x={60}
            y={246}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#9a9a96"
            style={{ fontSize: 8 }}
          >
            AR + EN
          </text>
          <text
            x={60}
            y={260}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#9a9a96"
            style={{ fontSize: 8 }}
          >
            policy · stats
          </text>
          <text
            x={60}
            y={278}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#2d9961"
            style={{ fontSize: 8 }}
          >
            36 chunks live
          </text>
        </g>

        {/* ── INDEX ─────────────────────────────────────────────────── */}
        <V2DiagramArrow d="M 140 100 L 172 100" />
        <V2DiagramNode
          x={172}
          y={76}
          w={126}
          h={46}
          label="Chunk"
          sublabel="semantic · 300 tok"
          tooltip="Section-boundary chunking, not fixed tokens"
        />

        <V2DiagramArrow d="M 235 122 L 235 152" delay={0.1} />
        <V2DiagramNode
          x={172}
          y={152}
          w={126}
          h={46}
          label="Embed"
          sublabel="gemini · 3072d"
          accent
          tooltip="Google Gemini gemini-embedding-001"
        />

        <V2DiagramArrow d="M 235 198 L 235 228" delay={0.2} />

        {/* Vector store */}
        <g transform="translate(172, 228)">
          <rect
            width={126}
            height={94}
            rx={8}
            fill="url(#v2-rag-vec)"
            stroke="#6dcc99"
          />
          <text
            x={63}
            y={18}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#2d9961"
            style={{ fontSize: 9, letterSpacing: 1 }}
          >
            PINECONE
          </text>
          <text
            x={63}
            y={32}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#525251"
            style={{ fontSize: 8 }}
          >
            serverless · free
          </text>
          {Array.from({ length: 24 }).map((_, i) => {
            const cx = 16 + (i % 8) * 12;
            const cy = 50 + Math.floor(i / 8) * 12;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={1.8}
                fill="#3fb578"
                opacity={0.35 + ((i * 37) % 70) / 130}
              />
            );
          })}
        </g>

        {/* ── RETRIEVE ─────────────────────────────────────────────── */}
        <g transform="translate(330, 38)">
          <rect
            width={150}
            height={56}
            rx={8}
            fill="#ffffff"
            stroke="#e0dfd8"
          />
          <text
            x={10}
            y={18}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#9a9a96"
            style={{ fontSize: 8.5, letterSpacing: 1 }}
          >
            USER QUERY
          </text>
          <text
            x={10}
            y={36}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontStyle="italic"
            fill="#0e0e0d"
            style={{ fontSize: 10 }}
          >
            &quot;How did you cut
          </text>
          <text
            x={10}
            y={48}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontStyle="italic"
            fill="#0e0e0d"
            style={{ fontSize: 10 }}
          >
            costs by 65%?&quot;
          </text>
        </g>

        <V2DiagramArrow d="M 405 94 L 405 116" delay={0.3} />

        <V2DiagramNode
          x={330}
          y={116}
          w={150}
          h={46}
          label="Hybrid Retriever"
          sublabel="BM25 + vector · RRF"
          accent
          tooltip="Reciprocal Rank Fusion of keyword + semantic"
        />

        <V2DiagramArrow d="M 298 268 C 320 268, 320 138, 330 138" delay={0.32} />
        <V2DiagramArrow d="M 405 162 L 405 188" delay={0.4} />

        <V2DiagramNode
          x={330}
          y={188}
          w={150}
          h={46}
          label="Re-rank"
          sublabel="cohere · cross-enc"
          tooltip="rerank-v3.5 — top-20 → top-5"
        />

        <V2DiagramCodeCard
          x={326}
          y={250}
          w={158}
          title="TOP-5 CHUNKS"
          lines={[
            "[1] case-rag-decisions  0.92",
            "[2] stack-cost          0.87",
            "[3] case-rag-timeline   0.81",
          ]}
        />

        {/* ── GENERATE ─────────────────────────────────────────────── */}
        <V2DiagramArrow d="M 480 138 L 510 138" delay={0.5} />

        <V2DiagramNode
          x={510}
          y={114}
          w={190}
          h={46}
          label="Groq · GPT-OSS 120B"
          sublabel="streaming · <800ms"
          accent
          tooltip="Sub-second generation, citation-by-default prompt"
        />

        <V2DiagramArrow d="M 605 160 L 605 188" delay={0.6} />

        <V2DiagramCodeCard
          x={510}
          y={188}
          w={190}
          title="ANSWER + CITATIONS"
          lines={[
            "We compressed context [1],",
            "filtered chunks via rerank",
            "[2], and used few-shot [3]",
            "to cut tokens 65%.",
          ]}
          accent
        />

        {/* ── EVAL feedback loop ───────────────────────────────────── */}
        <g>
          <path
            d="M 605 246 C 605 320, 235 320, 235 290"
            fill="none"
            stroke="#d97706"
            strokeOpacity={0.55}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
          <text
            x={420}
            y={336}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fill="#d97706"
            style={{ fontSize: 8.5, letterSpacing: 1 }}
          >
            ↻ eval harness · 200-question gold set runs on every change
          </text>
        </g>

        {/* Stats strip */}
        <text
          x={360}
          y={352}
          textAnchor="middle"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fill="#525251"
          style={{ fontSize: 9, letterSpacing: 1.5 }}
        >
          92% ACCURACY · 65% COST CUT · 5K+ QUERIES/MO · &lt;2s END-TO-END
        </text>
      </svg>
    </V2DiagramShell>
  );
}
