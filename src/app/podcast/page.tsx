"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Headphones,
  Pause,
  Play,
  Radio,
  Square,
} from "lucide-react";

interface Episode {
  id: string;
  number: number;
  title: string;
  href?: string;
  duration: string;
  description: string;
  script: string;
}

const EPISODES: Episode[] = [
  {
    id: "intro",
    number: 1,
    title: "Who is Mazhar Hayat — the 90-second version",
    duration: "≈ 90 s",
    description:
      "Background, current focus, what I'm available for. The elevator pitch you'd hear if we met in a hallway.",
    script:
      "I'm Mazhar Hayat. I'm an AI Solutions Architect based in Abu Dhabi with fifteen years of professional engineering experience. For the past three years I've been shipping production large language model systems for government — retrieval-augmented generation over a hundred thousand documents, natural-language to SQL across eight databases, and a vision pipeline that processes thousands of forms a day. Before that, twelve years of full-stack and team leadership at the Ministry of Human Resources, TRG Tech, and NETSOL. I'm available from June 2026 for senior individual contributor, principal, or hands-on tech lead positions. Remote, hybrid in the UAE, or relocation for the right role. If any of that sounds relevant, there are several ways to reach me on this site.",
  },
  {
    id: "rag",
    number: 2,
    title: "How my flagship RAG system works",
    href: "/projects/rag-document-intelligence",
    duration: "≈ 3 min",
    description:
      "The architecture of the document intelligence system at SCAD — chunking, hybrid retrieval, reranking, citations, evals.",
    script:
      "The flagship system I shipped at the Statistics Centre Abu Dhabi is a retrieval-augmented generation pipeline over a hundred thousand internal documents. Statistical reports, methodology papers, census documentation, regulatory frameworks. Let me walk through how it works. Ingestion uses semantic chunking — paragraphs grouped by topic similarity rather than character count, so context stays coherent. Every chunk gets embedded by Azure OpenAI's text-embedding model and stored in Pinecone with rich metadata: source document, page number, author, date, classification. At query time we do hybrid retrieval — semantic search plus BM25 keyword search — fused with reciprocal rank fusion. The top twelve candidates go through a cross-encoder reranker that re-scores them based on the actual question. We pick the top five. Those five chunks are stitched into a prompt with strict instructions: cite or refuse. The model — GPT-4 in production — must cite which chunk every claim comes from. If no chunk supports an answer, it must refuse rather than hallucinate. The whole pipeline runs in under two seconds at the ninety-fifth percentile. We track accuracy on a fifty-question gold set that re-runs on every release. Currently sitting at ninety-two percent. The system has been in production for eight months. Hasn't needed me in three.",
  },
  {
    id: "lessons",
    number: 3,
    title: "Three lessons from shipping AI to non-technical users",
    duration: "≈ 2 min",
    description:
      "What demos teach you. What production teaches you. The gap between them.",
    script:
      "Three lessons from shipping AI to non-technical users in production. Lesson one: confidence scoring is non-negotiable. Every model output needs a confidence score, and you need to design your UI around what happens below the threshold. The Vision AI pipeline I built routes low-confidence extractions to a human reviewer. Without that gate, you ship a system that's right ninety percent of the time and silently wrong ten percent of the time. Users lose trust fast. Lesson two: evals beat demos. Anyone can build a demo that wows in a meeting. Almost nobody builds the gold-set evaluation harness that proves the system still works six months later. The eval harness is what separates a prototype from a system. Lesson three: cite by default. If your LLM produces text without citations, users have no way to verify it. Citations turn the AI from an oracle into a research assistant. They also dramatically reduce hallucination because the model learns it has to ground every claim. Three lessons. One pattern: trust is the product.",
  },
  {
    id: "hiring",
    number: 4,
    title: "What I'm looking for next",
    href: "/for-recruiters",
    duration: "≈ 90 s",
    description: "The kind of role I'm available for — and what I'm not interested in.",
    script:
      "What I'm looking for next. I want to work on systems that real users depend on. That means three things. One: an organisation that believes evals matter — that measures AI quality the way engineers measure latency. Two: a problem where my pattern fits — production LLM systems with real users, ideally in a regulated, document-heavy, or bilingual environment. I've earned that scar tissue and I can move fast there. Three: a team that ships. I want to write code, not just decks. What I'm not looking for: roles that are a hundred percent strategy or management. I love mentoring engineers, but I want to keep my hands on the keyboard. Also not interested in moving away from production AI back into general full-stack. I've found the work that fits me; I want to do more of it. If you have something that matches — let's talk.",
  },
];

export default function PodcastPage() {
  const [active, setActive] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startedAtRef = useRef<number>(0);
  const totalCharsRef = useRef<number>(1);
  const progressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  function play(ep: Episode) {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(ep.script);
    u.rate = 1.0;
    u.pitch = 1.0;
    // Prefer a high-quality English voice if available.
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /Google.*English|Microsoft.*English|Samantha/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;

    u.onstart = () => {
      startedAtRef.current = Date.now();
      totalCharsRef.current = Math.max(ep.script.length, 1);
      setProgress(0);
      setPaused(false);
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      // Rough progress tick — SpeechSynthesis doesn't expose true position.
      progressTimerRef.current = window.setInterval(() => {
        if (window.speechSynthesis.paused) return;
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        const estDuration = totalCharsRef.current / 16; // ~16 chars/sec avg
        setProgress(Math.min(100, (elapsed / estDuration) * 100));
      }, 250);
    };
    u.onend = () => {
      setProgress(100);
      setActive(null);
      setPaused(false);
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };

    utteranceRef.current = u;
    setActive(ep.id);
    window.speechSynthesis.speak(u);
  }

  function togglePause() {
    if (!supported || !active) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setActive(null);
    setPaused(false);
    setProgress(0);
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
            <Radio className="h-3 w-3" />
            <span>The portfolio · audio edition</span>
          </div>
          <h1 className="display-1 mt-5">
            Listen, instead of{" "}
            <span className="display-italic text-signal/90">reading.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper-muted">
            Four episodes covering the highlights of this portfolio — about me,
            how my flagship RAG system works, what I&apos;ve learned shipping AI
            to non-technical users, and what I&apos;m available for next. Plays
            in your browser using built-in text-to-speech.{" "}
            <span className="text-signal">No tracking. No accounts. No cost.</span>
          </p>
          {!supported && (
            <p className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2 font-mono text-xs text-amber-300">
              Your browser doesn&apos;t support SpeechSynthesis. Try Chrome,
              Edge, or Safari.
            </p>
          )}
        </header>

        {/* Episodes */}
        <ol className="mt-12 space-y-4">
          {EPISODES.map((ep, i) => {
            const isActive = active === ep.id;
            return (
              <motion.li
                key={ep.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`group rounded-2xl border bg-ink-card p-5 transition ${
                  isActive
                    ? "border-signal/40 shadow-signal-sm"
                    : "border-ink-line hover:border-paper-dim/40"
                }`}
              >
                <div className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-signal/30 bg-signal/10 font-display text-lg text-signal">
                    {ep.number.toString().padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="font-display text-xl text-paper">
                        {ep.title}
                      </h2>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-paper-dim">
                        <Clock className="h-3 w-3" />
                        {ep.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-paper-muted">
                      {ep.description}
                    </p>

                    {/* Progress bar */}
                    {isActive && (
                      <div
                        className="mt-4 h-1 overflow-hidden rounded-full bg-ink-line"
                        role="progressbar"
                        aria-label={`Playback progress: episode ${ep.number}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress)}
                      >
                        <div
                          className="h-full bg-signal transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => play(ep)}
                          disabled={!supported}
                          className="btn-primary"
                          aria-label={`Play episode ${ep.number}`}
                        >
                          <Play className="h-3.5 w-3.5 text-ink" />
                          Play episode
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={togglePause}
                            className="btn-primary"
                            aria-label={paused ? "Resume" : "Pause"}
                          >
                            {paused ? (
                              <>
                                <Play className="h-3.5 w-3.5 text-ink" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="h-3.5 w-3.5 text-ink" />
                                Pause
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={stop}
                            className="btn-ghost"
                            aria-label="Stop"
                          >
                            <Square className="h-3.5 w-3.5 text-signal" />
                            Stop
                          </button>
                        </>
                      )}
                      {ep.href && (
                        <Link href={ep.href} className="btn-ghost">
                          Read the full page →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>

        {/* Footer */}
        <section className="mt-16 rounded-2xl border border-ink-line bg-ink-card p-7 text-center">
          <Headphones className="mx-auto h-5 w-5 text-signal" />
          <p className="mt-4 max-w-xl mx-auto text-sm text-paper-muted">
            Audio generated on-device with your browser&apos;s built-in
            text-to-speech engine — same API used by screen readers. No third
            party hears these requests. The transcripts are part of the page
            source, so accessibility tooling sees them too.
          </p>
        </section>
      </div>
    </main>
  );
}
