"use client";

import Image from "next/image";
import { Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
import type { LinkedInPostRow, PostMediaKind } from "@/lib/admin-types";
import type { CardTemplate } from "@/lib/linkedin-card";

interface PostPreviewProps {
  post: LinkedInPostRow;
  body: string;
  mediaKind: PostMediaKind;
  cardTemplate: CardTemplate;
  /** Bumped by the card designer to bust the generated-image cache. */
  cardVersion: number;
}

/** LinkedIn collapses the post body at roughly these lengths. */
const SEE_MORE_AT = { mobile: 420, desktop: 620 } as const;

export default function PostPreview({
  post,
  body,
  mediaKind,
  cardTemplate,
  cardVersion,
}: PostPreviewProps) {
  const [mode, setMode] = useState<"mobile" | "desktop">("mobile");
  const limit = SEE_MORE_AT[mode];
  const truncated = body.length > limit;

  return (
    <section className="rounded-2xl border border-cream-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-jakarta text-sm font-bold text-coal">
          LinkedIn preview
        </h3>
        <div
          className="flex rounded-lg bg-cream-warm p-1"
          role="group"
          aria-label="Preview width"
        >
          <button
            type="button"
            onClick={() => setMode("mobile")}
            aria-pressed={mode === "mobile"}
            aria-label="Mobile preview"
            className={`rounded-md p-1.5 transition ${
              mode === "mobile" ? "bg-white shadow-sm text-coal" : "text-coal-dim"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMode("desktop")}
            aria-pressed={mode === "desktop"}
            aria-label="Desktop preview"
            className={`rounded-md p-1.5 transition ${
              mode === "desktop" ? "bg-white shadow-sm text-coal" : "text-coal-dim"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        className={`mx-auto mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${
          mode === "mobile" ? "max-w-[300px]" : "max-w-full"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint-700 text-xs font-bold text-white">
            MH
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-900">
              Mazhar Hayat
            </p>
            <p className="text-[10px] text-slate-500">
              AI &amp; Software Engineering · 1m
            </p>
          </div>
        </div>

        <div className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-800">
          {body.slice(0, limit)}
          {truncated && (
            <span className="font-semibold text-slate-500"> …see more</span>
          )}
        </div>

        {mediaKind === "image" && (
          <Image
            src={`/api/admin/posts/${post.id}/media?kind=image&template=${cardTemplate}&v=${post.updated_at}${
              cardVersion ? `&refresh=1&r=${cardVersion}` : ""
            }`}
            alt={post.media_title || post.hook || post.topic}
            width={1080}
            height={1350}
            unoptimized
            className="mt-3 w-full rounded-sm bg-coal object-cover"
          />
        )}

        {mediaKind === "document" && (
          <div className="mt-3 rounded-lg bg-coal p-4 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-mint-300">
              Document · {post.carousel_slides?.length ?? 0} pages
            </p>
            <p className="mt-3 text-sm font-bold">
              {post.carousel_slides?.[0]?.title ||
                "Generate carousel slides to preview"}
            </p>
            <p className="mt-2 text-[10px] text-white/70">
              {post.carousel_slides?.[0]?.body}
            </p>
          </div>
        )}

        {post.sources?.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block truncate rounded-lg bg-slate-50 px-3 py-2 text-[10px] text-blue-700"
          >
            Source: {source.publisher || source.title} ↗
          </a>
        ))}
      </div>
    </section>
  );
}
