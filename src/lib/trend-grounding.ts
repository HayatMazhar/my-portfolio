import "server-only";

import { extractFromUrl } from "@/lib/fit-ingest";

/**
 * Trend posts used to be written from a headline plus a one-line snippet, which
 * left the model guessing at the actual news. Pulling the article text gives it
 * real detail to cite instead.
 *
 * Reuses the /fit extractor so the SSRF guards, redirect limits, and PDF/HTML
 * handling stay in one place.
 */

/** Enough for the model to find specifics without dominating the prompt. */
const MAX_GROUNDING_CHARS = 5_000;

/**
 * The extractor can spend 12s fetching and another 25s on the reader fallback.
 * Post generation already runs two Groq calls, so cap the wait to keep the
 * whole request inside shared-hosting proxy timeouts.
 */
const GROUNDING_BUDGET_MS = 15_000;

export interface TrendGrounding {
  ok: boolean;
  /** Article text, trimmed to {@link MAX_GROUNDING_CHARS}. Empty when `ok` is false. */
  text: string;
  /** Final URL after redirects, or the requested one on failure. */
  source: string;
  /** Why grounding is unavailable, for the prompt and admin diagnostics. */
  note?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${Math.round(ms / 1000)}s.`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Never throws: a source that cannot be read should downgrade the post to a
 * cautious opinion, not fail the generation.
 */
export async function fetchTrendGrounding(
  url: string | undefined,
): Promise<TrendGrounding | null> {
  const target = url?.trim();
  if (!target) return null;

  try {
    const extracted = await withTimeout(
      extractFromUrl(target),
      GROUNDING_BUDGET_MS,
    );
    const text = extracted.text.replace(/\s+\n/g, "\n").trim();
    if (text.length < 200) {
      return {
        ok: false,
        text: "",
        source: extracted.source,
        note: "The page returned too little readable text.",
      };
    }
    return {
      ok: true,
      text: text.slice(0, MAX_GROUNDING_CHARS),
      source: extracted.source,
    };
  } catch (err) {
    console.warn(`[trend-grounding] could not read ${target}:`, err);
    return {
      ok: false,
      text: "",
      source: target,
      note: err instanceof Error ? err.message : "The source could not be read.",
    };
  }
}
