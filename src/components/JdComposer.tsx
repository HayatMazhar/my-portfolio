"use client";

import { useRef, useState } from "react";
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

async function ingestUrl(url: string): Promise<{ text: string; via: string }> {
  const res = await fetch("/api/fit/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not fetch that URL.");
  return { text: String(data.text ?? ""), via: String(data.via ?? "direct") };
}

async function ingestFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/fit/ingest", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not read that file.");
  return String(data.text ?? "");
}

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
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"url" | "file" | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function fetchLink() {
    const target = url.trim() || looksLikeSingleUrl(value) || "";
    if (!target || busy) return;
    setBusy("url");
    setHint(null);
    try {
      const { text, via } = await ingestUrl(target);
      onChange(text);
      setUrl("");
      setHint(
        via === "rendered"
          ? "That page needed rendering, so it went through a reader proxy — skim it, then analyse."
          : "Pulled the posting into the box — skim it, then analyse.",
      );
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Could not fetch that URL.");
    } finally {
      setBusy(null);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy("file");
    setHint(null);
    try {
      const text = await ingestFile(file);
      onChange(text);
      setHint(`Loaded ${file.name} — skim it, then analyse.`);
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
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
