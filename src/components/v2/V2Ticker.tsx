type Pill = { label: string; kind?: "core" | "agent" | "model" | "infra" | "metric" };

const ITEMS: Pill[] = [
  { label: "Agentic AI", kind: "agent" },
  { label: "Multi-Agent Orchestration", kind: "agent" },
  { label: "AutoGen", kind: "agent" },
  { label: "LangGraph", kind: "agent" },
  { label: "CrewAI", kind: "agent" },
  { label: "Tool Use", kind: "agent" },
  { label: "Function Calling", kind: "agent" },
  { label: "ReAct", kind: "agent" },
  { label: "Reflexion", kind: "agent" },
  { label: "MCP", kind: "agent" },
  { label: "A2A Protocols", kind: "agent" },
  { label: "RAG", kind: "core" },
  { label: "GraphRAG", kind: "core" },
  { label: "Hybrid Search", kind: "core" },
  { label: "Re-ranking", kind: "core" },
  { label: "Semantic Caching", kind: "core" },
  { label: "Evals & Guardrails", kind: "core" },
  { label: "Prompt Engineering", kind: "core" },
  { label: "Fine-tuning", kind: "core" },
  { label: "LoRA / QLoRA", kind: "core" },
  { label: "Vision AI", kind: "core" },
  { label: "NL-to-SQL", kind: "core" },
  { label: "GPT-4o", kind: "model" },
  { label: "GPT-4.1", kind: "model" },
  { label: "Claude 3.5 Sonnet", kind: "model" },
  { label: "Gemini 1.5 Pro", kind: "model" },
  { label: "GPT-OSS", kind: "model" },
  { label: "Mistral", kind: "model" },
  { label: "Groq", kind: "model" },
  { label: "Azure OpenAI", kind: "infra" },
  { label: "LangChain", kind: "infra" },
  { label: "LlamaIndex", kind: "infra" },
  { label: "Semantic Kernel", kind: "infra" },
  { label: "Pinecone", kind: "infra" },
  { label: "Weaviate", kind: "infra" },
  { label: "FAISS", kind: "infra" },
  { label: "Azure AI Search", kind: "infra" },
  { label: ".NET Core 8", kind: "infra" },
  { label: "Angular 17", kind: "infra" },
  { label: "Kubernetes", kind: "infra" },
  { label: "Docker", kind: "infra" },
  { label: "15+ Years", kind: "metric" },
  { label: "100K+ Docs Indexed", kind: "metric" },
  { label: "18K+ Monthly Queries", kind: "metric" },
  { label: "95% Time Reduction", kind: "metric" },
];

const TRACK = [...ITEMS, ...ITEMS];

const KIND_STYLES: Record<NonNullable<Pill["kind"]>, string> = {
  agent: "border-[#3fb578]/40 bg-[#3fb578]/8 text-[#1f6a3f]",
  core: "border-[#2563eb]/30 bg-[#2563eb]/8 text-[#1d4ed8]",
  model: "border-[#a855f7]/30 bg-[#a855f7]/8 text-[#7e22ce]",
  infra: "border-[#e0dfd8] bg-white text-[#3a3a39]",
  metric: "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#b45309]",
};

const DOT_COLOR: Record<NonNullable<Pill["kind"]>, string> = {
  agent: "#3fb578",
  core: "#2563eb",
  model: "#a855f7",
  infra: "#9b9b97",
  metric: "#f59e0b",
};

export default function V2Ticker() {
  return (
    <div
      aria-label="Skills and AI stack marquee"
      className="relative overflow-hidden border-y border-[#e0dfd8] bg-gradient-to-b from-white to-[#f7f6f1] py-4"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#f7f6f1] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#f7f6f1] to-transparent" />

      <div className="ticker-track">
        {TRACK.map((pill, i) => {
          const kind = pill.kind ?? "infra";
          return (
            <span
              key={i}
              className={`mx-1.5 inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${KIND_STYLES[kind]}`}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: DOT_COLOR[kind] }}
              />
              {pill.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
