import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PERSONAL } from "@/data/cv";

export const metadata: Metadata = {
  title: `/uses — ${PERSONAL.name}`,
  description:
    "What I use day-to-day to ship production AI: hardware, editor, AI tools, terminal, languages, methodologies.",
};

interface Section {
  title: string;
  items: { name: string; detail?: string }[];
}

const SECTIONS: Section[] = [
  {
    title: "Hardware",
    items: [
      { name: "MacBook Pro M3", detail: "Daily driver. 16″, 36GB RAM." },
      { name: "External monitor — LG UltraFine 27″", detail: "4K, vertical for code reviews." },
      { name: "Logitech MX Master 3S", detail: "Worth every fil." },
      { name: "Keychron K2", detail: "Brown switches." },
    ],
  },
  {
    title: "Editor & coding",
    items: [
      { name: "Cursor", detail: "AI-first editor. Worth the subscription." },
      { name: "VS Code", detail: "Backup. Same extensions where it matters." },
      { name: "GitHub Copilot", detail: "On for boilerplate, off for architecture." },
      { name: "Theme: Tokyo Night Storm", detail: "Easy on the eyes for long sessions." },
      { name: "Font: JetBrains Mono", detail: "Ligatures on." },
    ],
  },
  {
    title: "AI tools",
    items: [
      { name: "Claude Sonnet 4 / Opus 4.5", detail: "Primary AI pair-programmer." },
      { name: "ChatGPT (GPT-5)", detail: "Second opinion + image generation." },
      { name: "Cursor agents", detail: "Long-running refactors." },
      { name: "Perplexity", detail: "Up-to-date research." },
      { name: "Groq Playground", detail: "Latency-sensitive prototyping." },
    ],
  },
  {
    title: "Terminal & shell",
    items: [
      { name: "Warp", detail: "AI-native terminal." },
      { name: "zsh + Oh My Zsh", detail: "Powerlevel10k prompt." },
      { name: "lazygit", detail: "Faster than the GUI." },
      { name: "ripgrep, fd, bat", detail: "The unix toolkit, modernised." },
    ],
  },
  {
    title: "Languages & frameworks",
    items: [
      { name: "TypeScript", detail: "Frontend + Node services." },
      { name: "C# / .NET 8", detail: "15 years and still my favourite for backend." },
      { name: "Python", detail: "ML / scripting / FastAPI." },
      { name: "Next.js 14", detail: "App router. This site runs on it." },
      { name: "Tailwind CSS", detail: "Productive when constrained." },
    ],
  },
  {
    title: "AI / infra stack",
    items: [
      { name: "Azure OpenAI", detail: "Production GPT-4o for SCAD systems." },
      { name: "Groq", detail: "Sub-second GPT-OSS 120B for low-latency UX." },
      { name: "Pinecone", detail: "Serverless vector DB." },
      { name: "Cohere rerank", detail: "Precision lift on retrieval." },
      { name: "LangChain / Semantic Kernel", detail: "Orchestration when warranted." },
    ],
  },
  {
    title: "Productivity",
    items: [
      { name: "Notion", detail: "Specs, notes, project tracking." },
      { name: "Obsidian", detail: "Personal knowledge base." },
      { name: "Linear", detail: "Issue tracker for solo & team projects." },
      { name: "Raycast", detail: "Replaced Spotlight years ago." },
      { name: "Arc Browser", detail: "Workspace per project." },
    ],
  },
  {
    title: "Methodology",
    items: [
      { name: "Evaluation harnesses, always", detail: "Before models, before prompts." },
      { name: "Measure latency, accuracy, cost", detail: "Three numbers, every release." },
      { name: "Two pizzas, one ticket", detail: "If it can't fit, split it." },
      { name: "Boring tech wins", detail: "Production AI on Azure, not bleeding-edge OSS." },
    ],
  },
];

export default function UsesPage() {
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
          <p className="meta">/uses</p>
          <h1 className="display-1 mt-4">
            What I use to{" "}
            <span className="display-italic text-signal/90">ship.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper-muted">
            Inspired by{" "}
            <a
              href="https://uses.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="text-signal underline-offset-4 hover:underline"
            >
              uses.tech
            </a>
            . The exact hardware, editor setup, AI tools, and methodology I use
            day-to-day to build production AI. Updated as things change.
          </p>
        </header>

        <div className="mt-14 space-y-14">
          {SECTIONS.map((sec) => (
            <section key={sec.title}>
              <h2 className="font-display text-2xl text-paper">{sec.title}</h2>
              <ul className="mt-5 grid gap-px overflow-hidden rounded-xl border border-ink-line bg-ink-line sm:grid-cols-2">
                {sec.items.map((it) => (
                  <li
                    key={it.name}
                    className="bg-ink-card px-5 py-4"
                  >
                    <p className="font-medium text-paper">{it.name}</p>
                    {it.detail && (
                      <p className="mt-1 text-sm text-paper-muted">
                        {it.detail}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-16 text-center font-mono text-[10px] uppercase tracking-widest text-paper-dim">
          Last updated · May 2026
        </p>
      </div>
    </main>
  );
}
