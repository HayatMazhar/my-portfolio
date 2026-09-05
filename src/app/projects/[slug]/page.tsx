import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Quote, Sparkles } from "lucide-react";
import { PROJECTS, PROJECT_STUDIES, PERSONAL } from "@/data/cv";
import RagDiagram from "@/components/diagrams/RagDiagram";
import NlSqlDiagram from "@/components/diagrams/NlSqlDiagram";
import VisionDiagram from "@/components/diagrams/VisionDiagram";
import ProjectChat from "@/components/ProjectChat";
import type { ComponentType } from "react";

const CHAT_SUGGESTIONS: Record<string, string[]> = {
  "rag-document-intelligence": [
    "What was the hardest part of building this?",
    "How did you reduce GPT-4 costs by 65%?",
    "What would you do differently?",
  ],
  "conversational-analytics": [
    "How does the SQL repair loop work?",
    "What about security and SQL injection?",
    "Why few-shot over fine-tuning?",
  ],
  "vision-ai-pipeline": [
    "Why two models instead of one?",
    "How do confidence scores work?",
    "What's the accuracy on Arabic handwriting?",
  ],
  "ai-chatbot": [
    "How did you hit 90% first-contact resolution?",
    "How does the escalation to humans work?",
    "What kept answers accurate for the public?",
  ],
  "regulatory-change-watcher": [
    "How do you keep false positives so low?",
    "Why diff before using the LLM?",
    "How has it stayed reliable for 3+ years?",
  ],
  "prompt-eval-harness": [
    "What does the CI gate actually block?",
    "How does the judge-LLM scoring work?",
    "What regressions did it catch?",
  ],
  "mcp-portfolio-server": [
    "Which tools does the server expose?",
    "Why typed tools over a search endpoint?",
    "How do I wire it into Claude or Cursor?",
  ],
};

const DIAGRAMS: Record<string, ComponentType> = {
  "rag-document-intelligence": RagDiagram,
  "conversational-analytics": NlSqlDiagram,
  "vision-ai-pipeline": VisionDiagram,
};

export async function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = PROJECTS.find((p) => p.slug === params.slug);
  if (!project) return {};
  const study = PROJECT_STUDIES[params.slug];
  return {
    title: `${project.title} — ${PERSONAL.name}`,
    description: study?.tagline ?? project.solution,
  };
}

export default function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = PROJECTS.find((p) => p.slug === params.slug);
  if (!project) notFound();

  const study = PROJECT_STUDIES[params.slug];
  const Diagram = DIAGRAMS[project.slug];
  const idx = PROJECTS.findIndex((p) => p.slug === params.slug);
  const prev = PROJECTS[idx - 1];
  const next = PROJECTS[idx + 1];

  return (
    <main className="min-h-screen bg-ink pt-24 pb-32">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-12">
        {/* Back */}
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-paper-dim transition hover:text-signal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All work
        </Link>

        {/* Header */}
        <header className="mt-12">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-xs text-signal">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-xs text-paper-dim">
              {project.year}
            </span>
            <span className="h-px w-8 bg-ink-line" />
            <span className="font-mono text-xs text-paper-dim">
              {project.company.split("—")[0]?.trim()}
            </span>
          </div>
          <h1 className="display-1 mt-6 max-w-4xl">{project.title}</h1>
          {study?.tagline && (
            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-paper-muted sm:text-[1.4rem]">
              {study.tagline}
            </p>
          )}
        </header>

        {/* Diagram */}
        {Diagram && (
          <section className="mt-16">
            <p className="meta mb-4">Architecture</p>
            <div className="-mx-5 overflow-x-auto sm:mx-0">
              <div className="min-w-[640px] px-5 sm:min-w-0 sm:px-0">
                <Diagram />
              </div>
            </div>
          </section>
        )}

        {/* Before / After */}
        {study && (
          <section className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-ink-line bg-ink-line sm:grid-cols-2">
            <div className="bg-ink-card p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-400/80">
                Before
              </p>
              <p className="mt-4 text-lg leading-relaxed text-paper-muted">
                {study.before}
              </p>
            </div>
            <div className="bg-ink-card p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">
                After
              </p>
              <p className="mt-4 text-lg leading-relaxed text-paper">
                {study.after}
              </p>
            </div>
          </section>
        )}

        {/* Challenge + Approach (always shown) */}
        <section className="mt-16 grid gap-10 md:grid-cols-2">
          <div>
            <p className="meta">Challenge</p>
            <p className="mt-4 text-lg leading-relaxed text-paper">
              {project.challenge}
            </p>
          </div>
          <div>
            <p className="meta">Approach</p>
            <p className="mt-4 text-lg leading-relaxed text-paper-muted">
              {project.solution}
            </p>
          </div>
        </section>

        {/* Timeline */}
        {study?.timeline && (
          <section className="mt-20">
            <p className="meta mb-8">How it was built</p>
            <ol className="relative space-y-10 border-l border-ink-line pl-8">
              {study.timeline.map((t, i) => (
                <li key={t.phase} className="relative">
                  <span className="absolute -left-[35px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-signal/40 bg-ink text-[10px] font-mono text-signal">
                    {i + 1}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="font-display text-xl text-paper">
                      {t.phase}
                    </h3>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-paper-dim">
                      {t.period}
                    </span>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-paper-muted">
                    {t.story}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Key decisions */}
        {study?.decisions && (
          <section className="mt-20">
            <p className="meta mb-6">Key architecture decisions</p>
            <div className="grid gap-px overflow-hidden rounded-xl border border-ink-line bg-ink-line sm:grid-cols-2">
              {study.decisions.map((d) => (
                <div key={d.title} className="bg-ink-card p-6">
                  <h3 className="font-display text-lg text-paper">
                    {d.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper-muted">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-signal">
                      Why ·
                    </span>{" "}
                    {d.why}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Impact bullets */}
        <section className="mt-20">
          <p className="meta mb-6">Impact</p>
          <ul className="space-y-4">
            {project.impact.map((line) => (
              <li
                key={line}
                className="flex gap-4 text-lg leading-relaxed text-paper"
              >
                <span className="mt-3 h-px w-6 shrink-0 bg-signal" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        {/* Metrics */}
        <section className="mt-16 grid grid-cols-2 gap-6 border-y border-ink-line py-12 sm:grid-cols-4">
          {Object.entries(project.metrics).map(([k, v]) => (
            <div key={k}>
              <div className="font-display text-5xl text-paper">{v}</div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                {k}
              </div>
            </div>
          ))}
        </section>

        {/* Lessons */}
        {study?.lessons && (
          <section className="mt-16">
            <p className="meta mb-6">What I&apos;d tell someone building this</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {study.lessons.map((l, i) => (
                <li
                  key={l}
                  className="flex gap-4 rounded-lg border border-ink-line bg-ink-card p-5"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-signal" />
                  <span className="text-[15px] leading-relaxed text-paper-muted">
                    <span className="font-mono text-[10px] text-paper-dim">
                      0{i + 1} ·
                    </span>{" "}
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Stakeholder quote */}
        {study?.quote && (
          <section className="mt-16">
            <figure className="rounded-2xl border border-signal/20 bg-signal/[0.03] p-8 sm:p-10">
              <Quote className="h-6 w-6 text-signal" />
              <blockquote className="mt-5 font-display text-xl leading-snug text-paper sm:text-2xl">
                <span className="display-italic">&ldquo;{study.quote.text}&rdquo;</span>
              </blockquote>
              <figcaption className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-paper-dim">
                — {study.quote.author}
              </figcaption>
            </figure>
          </section>
        )}

        {/* Stack */}
        <section className="mt-12">
          <p className="meta mb-4">Tech stack</p>
          <div className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* Project-scoped AI chat */}
        <ProjectChat
          slug={project.slug}
          projectName={project.title}
          suggestions={CHAT_SUGGESTIONS[project.slug] ?? []}
        />

        {/* Prev / Next */}
        <nav className="mt-20 flex items-center justify-between border-t border-ink-line pt-10">
          {prev ? (
            <Link
              href={`/projects/${prev.slug}`}
              className="group flex items-center gap-2 text-sm text-paper-dim transition hover:text-paper"
            >
              <ArrowLeft className="h-4 w-4 transition group-hover:text-signal" />
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                  Previous
                </span>
                <span className="mt-1 block font-display text-lg text-paper">
                  {prev.title}
                </span>
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className="group flex items-center gap-2 text-right text-sm text-paper-dim transition hover:text-paper"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-paper-dim">
                  Next
                </span>
                <span className="mt-1 block font-display text-lg text-paper">
                  {next.title}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 transition group-hover:text-signal" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </main>
  );
}
