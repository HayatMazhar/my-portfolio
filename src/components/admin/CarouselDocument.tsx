"use client";

import type { CarouselSlide } from "@/lib/admin-types";

export default function CarouselDocument({
  title,
  slides,
}: {
  title: string;
  slides: CarouselSlide[];
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 print:max-w-none print:p-0">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-coal">Carousel preview</h1>
          <p className="mt-1 text-sm text-coal-muted">
            Print and choose “Save as PDF”. Use portrait layout with no margins.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-coal px-5 py-3 text-sm font-bold text-white"
        >
          Export PDF
        </button>
      </div>

      <div className="space-y-6 print:space-y-0">
        {slides.map((slide, index) => (
          <article
            key={`${index}-${slide.title}`}
            className="relative mx-auto flex w-full max-w-[720px] flex-col justify-between overflow-hidden rounded-3xl bg-coal p-12 text-white shadow-xl print:h-screen print:max-w-none print:break-after-page print:rounded-none print:shadow-none"
            style={{ aspectRatio: "4 / 5" }}
          >
            <div
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mint-500/20"
              aria-hidden
            />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-mint-300">
                {index === 0 ? "Mazhar Hayat" : `${index + 1} / ${slides.length}`}
              </p>
              <h2 className="mt-10 max-w-2xl font-jakarta text-4xl font-bold leading-tight md:text-6xl">
                {slide.title}
              </h2>
              <p className="mt-8 max-w-xl whitespace-pre-wrap text-xl leading-relaxed text-white/80 md:text-2xl">
                {slide.body}
              </p>
            </div>
            <div className="relative flex items-center justify-between border-t border-white/15 pt-6 text-sm text-white/50">
              <span>mazharhayat.com</span>
              <span>{title.slice(0, 48)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
