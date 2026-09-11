/**
 * Design-iteration harness: renders every card template plus a sample carousel
 * slide to `.tmp-card-previews/` so the output can be inspected by eye.
 *
 * Uses satori + resvg directly (both devDependencies) because `@vercel/og`
 * throws ERR_INVALID_URL while initialising on Windows, which makes rendering
 * through `next/og` impossible locally. Production goes through `next/og`,
 * which wraps the same satori version and the same element tree.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { describe, expect, it, vi } from "vitest";
import { buildCardLayout, type CardTemplate } from "./linkedin-card";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardElement,
  slideElement,
} from "./linkedin-card-art";
import type { CarouselSlide, LinkedInPostRow } from "./admin-types";

const OUT = ".tmp-card-previews";

/**
 * The copy generator resolves its key through the admin settings store, which
 * would drag the whole DB layer into this harness. Read it straight from
 * .env.local instead.
 */
vi.mock("./app-settings", () => ({
  resolveGroqApiKey: async () => {
    const env = await readFile(".env.local", "utf8");
    return env.match(/^GROQ_API_KEY=(.+)$/m)?.[1]?.trim() ?? null;
  },
}));

async function fonts() {
  const dir = path.join(process.cwd(), "public", "fonts");
  const load = async (file: string) => readFile(path.join(dir, file));
  return [
    { name: "Inter", data: await load("Inter-Regular.ttf"), weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: await load("Inter-Medium.ttf"), weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: await load("Inter-Bold.ttf"), weight: 700 as const, style: "normal" as const },
    { name: "Inter Tight", data: await load("InterTight-Bold.ttf"), weight: 700 as const, style: "normal" as const },
  ];
}

async function toPng(element: React.ReactElement, loaded: Awaited<ReturnType<typeof fonts>>) {
  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: loaded,
  });
  return new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_WIDTH },
  })
    .render()
    .asPng();
}

const post: LinkedInPostRow = {
  id: "preview",
  topic: "AI agents in policy drafting",
  hook: "We cut policy research from 3 weeks to 2 days",
  body: [
    "We cut policy research from 3 weeks to 2 days.",
    "",
    "Previously every analyst read the same 400-page corpus by hand and wrote their own summary.",
    "Now a retrieval layer pulls the twelve relevant clauses and the analyst argues with them.",
    "",
    "- Chunk by clause, not by page",
    "- Rerank before you summarise",
    "- Keep a citation on every claim",
    "- Measure recall, not vibes",
  ].join("\n"),
  status: "draft",
  created_at: Date.now(),
  updated_at: Date.now(),
} as LinkedInPostRow;

const slides: CarouselSlide[] = [
  {
    title: "Retrieval quality is a data problem",
    body: "Four lessons from moving a policy-drafting assistant into production — where the model was never the bottleneck.",
  },
  {
    title: "Chunk by clause",
    body: "Page-based chunks split obligations from their conditions. Clause boundaries keep the meaning intact — and they are what lawyers actually cite.",
  },
  {
    title: "Measure recall, not vibes",
    body: "Ship an eval set of real questions with known answers. Without it, every prompt change is a coin flip you cannot audit.",
  },
];

/**
 * Opt-in: this hits Groq and writes PNGs, so it stays out of `npm test`.
 * Run with `$env:PREVIEW_CARDS=1; npx vitest run src/lib/card-preview.test.ts`.
 */
describe.skipIf(process.env.PREVIEW_CARDS !== "1")("card previews", () => {
  it("renders every template and a carousel slide", async () => {
    const loaded = await fonts();
    await mkdir(OUT, { recursive: true });

    const templates: CardTemplate[] = [
      "statement",
      "stat",
      "question",
      "comparison",
      "checklist",
    ];

    for (const template of templates) {
      const layout = buildCardLayout(
        {
          topic: post.topic,
          hook: post.hook,
          body: post.body,
          mediaTitle: post.media_title,
        },
        template,
      );
      const png = await toPng(cardElement(layout), loaded);
      await writeFile(path.join(OUT, `card-${template}.png`), png);
      expect(png.length).toBeGreaterThan(1000);
    }

    // Written copy is what production actually renders, so check it by eye too.
    vi.doMock("server-only", () => ({}));
    const { generateCardCopy } = await import("./linkedin-card-copy");
    const { layoutFromCopy } = await import("./linkedin-card");
    const copy = await generateCardCopy(post, "auto");
    console.log("card copy:", JSON.stringify(copy, null, 2));
    if (copy) {
      const png = await toPng(cardElement(layoutFromCopy(copy)), loaded);
      await writeFile(path.join(OUT, "card-written.png"), png);
    }

    for (const [index, slide] of slides.entries()) {
      const png = await toPng(
        slideElement(slide, index, slides.length),
        loaded,
      );
      await writeFile(path.join(OUT, `slide-${index + 1}.png`), png);
      expect(png.length).toBeGreaterThan(1000);
    }
  }, 180_000);
});
