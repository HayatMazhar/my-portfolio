import "server-only";

import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  cardElement,
  slideElement,
} from "@/lib/linkedin-card-art";
import {
  buildCardLayout,
  layoutFromCopy,
  type CardTemplate,
} from "@/lib/linkedin-card";
import { loadOgFonts } from "@/lib/og-fonts";
import { getCreativeArtwork } from "@/lib/cloudflare-image";
import type { CarouselSlide, LinkedInPostRow } from "@/lib/admin-types";

async function renderElement(
  element: React.ReactElement,
): Promise<Uint8Array> {
  const fonts = await loadOgFonts();

  // next/og resolves its bundled fallback font through an invalid file URL on
  // Windows. The local studio uses the same Satori engine directly; production
  // keeps Next's optimized ImageResponse path.
  if (process.platform === "win32") {
    const [{ default: satori }, { Resvg }] = await Promise.all([
      import("satori"),
      import("@resvg/resvg-js"),
    ]);
    const svg = await satori(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts,
    });
    return new Uint8Array(
      new Resvg(svg, {
        fitTo: { mode: "width", value: CARD_WIDTH },
      })
        .render()
        .asPng(),
    );
  }

  const response = new ImageResponse(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts,
  });
  return new Uint8Array(await response.arrayBuffer());
}

export async function renderPostImage(
  post: LinkedInPostRow,
  template: CardTemplate = "auto",
  options: { refreshArtwork?: boolean } = {},
): Promise<Uint8Array> {
  // Written copy reads like a designed card; the deterministic layout is the
  // fallback for posts generated before this existed, or when Groq is down.
  const useStoredCopy =
    post.card_copy &&
    (template === "auto" || template === post.card_copy.template);

  const layout = useStoredCopy
    ? layoutFromCopy(post.card_copy!)
    : buildCardLayout(
        {
          topic: post.topic,
          hook: post.hook,
          body: post.body,
          mediaTitle: post.media_title,
        },
        template,
      );

  const visualPrompt =
    post.card_copy?.visualPrompt ||
    `Premium editorial social-media artwork about ${post.topic}. Sophisticated visual metaphor, cinematic natural lighting, tactile materials, layered depth, dark neutral palette with restrained emerald accents. Focal subject in the upper third or right side, generous dark negative space in the lower left. No text, no letters, no logos, no watermark.`;
  const artwork = await getCreativeArtwork(visualPrompt, {
    refresh: options.refreshArtwork,
  }).catch((error) => {
    console.warn("[linkedin-media] artwork generation failed:", error);
    return null;
  });

  return renderElement(cardElement(layout, artwork?.dataUri));
}

/**
 * Slides are rendered with satori and embedded as images rather than drawn with
 * pdf-lib text. The standard PDF fonts are Latin-1 only, so the previous
 * approach had to strip every em dash, curly quote, and arrow out of the copy.
 */
export async function renderCarouselPdf(
  slides: CarouselSlide[],
): Promise<Uint8Array> {
  if (slides.length === 0) throw new Error("Generate carousel slides first.");

  const pngs = await Promise.all(
    slides.map((slide, index) =>
      renderElement(slideElement(slide, index, slides.length)),
    ),
  );

  const pdf = await PDFDocument.create();
  for (const png of pngs) {
    const embedded = await pdf.embedPng(png);
    const page = pdf.addPage([CARD_WIDTH, CARD_HEIGHT]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
  }
  return pdf.save();
}
