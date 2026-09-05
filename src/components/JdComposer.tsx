"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function looksLikeSingleUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function resolveJdText(raw: string): Promise<string> {
  const url = looksLikeSingleUrl(raw);
  if (!url) return raw;
  const { text } = await ingestUrl(url);
  return text;
}

/**
 * Hosting panels and proxies answer with HTML error pages, so parsing blindly
 * would surface "Unexpected token '<'" instead of something actionable.
 */
async function readIngestResult(
  res: Response,
  fallback: string,
): Promise<{ text: string; via: string }> {
  const raw = await res.text();
  let data: { text?: unknown; via?: unknown; error?: unknown };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      res.status === 429
        ? "Too many requests just now — wait a moment and try again."
        : fallback,
    );
  }
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : fallback);
  }
  return { text: String(data.text ?? ""), via: String(data.via ?? "direct") };
}

async function ingestUrl(url: string): Promise<{ text: string; via: string }> {
  const res = await fetch("/api/fit/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return readIngestResult(res, "Could not fetch that URL.");
}

async function ingestFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/fit/ingest", { method: "POST", body: form });
  const { text } = await readIngestResult(res, "Could not read that file.");
  return text;
}

interface Stage {
  /** Milliseconds after the request starts. */
  at: number;
  pct: number;
  label: string;
}

// The bar cannot track real server progress, so the stages are timed to the
// work the route actually does: fetch, parse, then the slower render fallback.
const URL_STAGES: Stage[] = [
  { at: 0, pct: 12, label: "Fetching the posting…" },
  { at: 900, pct: 34, label: "Reading the page…" },
  { at: 2600, pct: 55, label: "Page builds itself in the browser — rendering it…" },
  { at: 7000, pct: 78, label: "Still rendering — heavy pages take a few seconds…" },
  { at: 16000, pct: 90, label: "Almost there…" },
];

const FILE_STAGES: Stage[] = [
  { at: 0, pct: 20, label: "Uploading the document…" },
  { at: 700, pct: 55, label: "Extracting the text…" },
  { at: 2500, pct: 80, label: "Tidying up the layout…" },
];

export default function JdComposer({
  value,
  onChange,
  compact = false,
  sampleLabel,
  onSample,
}: {
  value: string;
  onChange: (next: string) => void;
  compact?: boolean;
  sampleLabel?: string;
  onSample?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"url" | "file" | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(
    null,
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function startProgress(stages: Stage[]) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setProgress({ pct: stages[0].pct, label: stages[0].label });
    for (const stage of stages.slice(1)) {
      timers.current.push(
        setTimeout(
          () => setProgress({ pct: stage.pct, label: stage.label }),
          stage.at,
        ),
      );
    }
  }

  function endProgress(done: boolean) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!done) {
      setProgress(null);
      return;
    }
    // Let the bar land on 100% before it disappears.
    setProgress((prev) => (prev ? { pct: 100, label: "Done" } : null));
    timers.current.push(setTimeout(() => setProgress(null), 400));
  }

  async function fetchLink() {
    const target = url.trim() || looksLikeSingleUrl(value) || "";
    if (!target || busy) return;
    setBusy("url");
    setHint(null);
    startProgress(URL_STAGES);
    let ok = false;
    try {
      const { text, via } = await ingestUrl(target);
      onChange(text);
      setUrl("");
      ok = true;
      setHint(
        via === "rendered"
          ? "That page needed rendering, so it went through a reader proxy — skim it, then analyse."
          : "Pulled the posting into the box — skim it, then analyse.",
      );
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Could not fetch that URL.");
    } finally {
      endProgress(ok);
      setBusy(null);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy("file");
    setHint(null);
    startProgress(FILE_STAGES);
    let ok = false;
    try {
      const text = await ingestFile(file);
      onChange(text);
      ok = true;
      setHint(`Loaded ${file.name} — skim it, then analyse.`);
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      endProgress(ok);
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <div className={cn("flex flex-wrap items-end gap-2", compact ? "mt-2" : "mt-3")}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Job posting URL</span>
          <span className="relative block">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-paper-dim" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void fetchLink();
                }
              }}
              placeholder="https://…  paste a JD link"
              className={cn(
                "w-full rounded-lg border border-ink-line bg-ink pl-9 pr-3 text-sm text-paper placeholder:text-paper-dim focus:border-signal/40 focus:outline-none",
                compact ? "py-1.5" : "py-2",
              )}
            />
          </span>
        </label>
        <button
          type="button"
          onClick={() => void fetchLink()}
          disabled={busy !== null || !(url.trim() || looksLikeSingleUrl(value))}
          className="btn-ghost shrink-0"
        >
          {busy === "url" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-signal" />
          ) : (
            <Link2 className="h-3.5 w-3.5 text-signal" />
          )}
          Fetch
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className="btn-ghost shrink-0"
        >
          {busy === "file" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-signal" />
          ) : (
            <FileUp className="h-3.5 w-3.5 text-signal" />
          )}
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>

      {progress && (
        <div className="mt-2.5" role="status" aria-live="polite">
          <div className="h-1 w-full overflow-hidden rounded-full bg-ink-line">
            <div
              className="h-full rounded-full bg-signal transition-[width] duration-700 ease-out"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-paper-muted">
            <Loader2 className="h-3 w-3 animate-spin text-signal" />
            {progress.label}
          </p>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          compact
            ? "Paste JD, a link, or upload a file…"
            : "Paste the JD, drop in a posting URL, or upload PDF / DOCX / TXT."
        }
        rows={compact ? 8 : 12}
        maxLength={8000}
        className={cn(
          "mt-2 w-full resize-y rounded-xl border border-ink-line bg-ink-card p-4 text-sm leading-relaxed text-paper placeholder:text-paper-dim focus:border-signal/40 focus:outline-none focus:ring-1 focus:ring-signal/20",
          compact && "rounded-lg bg-ink p-3 focus:ring-0",
        )}
      />

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-paper-dim">
        <span className="font-mono">
          {value.length.toLocaleString()} / 8,000 chars
        </span>
        {onSample && sampleLabel && (
          <button
            type="button"
            onClick={() => {
              setHint(null);
              onSample();
            }}
            className="font-mono text-[10px] uppercase tracking-widest text-paper-dim transition hover:text-signal"
          >
            {sampleLabel}
          </button>
        )}
      </div>

      {hint && (
        <p
          className={cn(
            "mt-2 text-xs leading-relaxed",
            hint.toLowerCase().startsWith("could") ||
              hint.toLowerCase().includes("not ") ||
              hint.toLowerCase().includes("timed") ||
              hint.toLowerCase().includes("login") ||
              hint.toLowerCase().includes("too large") ||
              hint.toLowerCase().includes("old .doc")
              ? "text-amber-300"
              : "text-paper-muted",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
