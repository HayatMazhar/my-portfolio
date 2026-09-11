import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Fonts for satori-rendered images.
 *
 * Passing fonts explicitly is not just cosmetic: `next/og` falls back to a
 * bundled Noto Sans whose path resolution is broken on Windows dev servers
 * (ERR_INVALID_URL), so supplying our own is what makes local rendering work at
 * all. It also means the cards use the same Inter as the site instead of a
 * generic system fallback.
 *
 * TTFs live in `public/fonts` (satori cannot read woff2) and are refreshed with
 * `scripts/fetch-og-fonts.mjs`.
 */

export interface OgFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 700;
  style: "normal";
}

const FONT_FILES: { file: string; name: string; weight: 400 | 500 | 700 }[] = [
  { file: "Inter-Regular.ttf", name: "Inter", weight: 400 },
  { file: "Inter-Medium.ttf", name: "Inter", weight: 500 },
  { file: "Inter-Bold.ttf", name: "Inter", weight: 700 },
  // Tighter display cut, used for headlines and the large stat figures.
  { file: "InterTight-Bold.ttf", name: "Inter Tight", weight: 700 },
];

let cached: OgFont[] | null = null;

/** Read once per process — each render otherwise re-reads ~1.2MB from disk. */
export async function loadOgFonts(): Promise<OgFont[]> {
  if (cached) return cached;

  const dir = path.join(process.cwd(), "public", "fonts");
  const fonts = await Promise.all(
    FONT_FILES.map(async ({ file, name, weight }) => ({
      name,
      data: await readFile(path.join(dir, file)),
      weight,
      style: "normal" as const,
    })),
  );

  cached = fonts;
  return fonts;
}
