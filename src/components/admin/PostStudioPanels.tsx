"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  FileText,
  History,
  Image as ImageIcon,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  evaluatePostQuality,
  resolveLengthSpec,
} from "@/lib/linkedin-style-guide";
import type {
  LinkedInPostRow,
  PostMediaKind,
  PostMetrics,
  PostRevision,
  PostVariant,
  PublishTarget,
  RewriteAction,
} from "@/lib/admin-types";
import type { PreflightResult } from "@/lib/linkedin-preflight";
import type { RecommendedSlot } from "@/lib/linkedin-scheduling";
import { CARD_TEMPLATES, type CardTemplate } from "@/lib/linkedin-card";

type Quality = ReturnType<typeof evaluatePostQuality>;
type LengthSpec = ReturnType<typeof resolveLengthSpec>;

interface Props {
  post: LinkedInPostRow;
  busy: string | null;
  quality: Quality;
  lengthSpec: LengthSpec;

  onSelectVariant: (variant: PostVariant) => void;
  onSelectHook: (hook: string) => void;
  onRewrite: (action: RewriteAction, instruction?: string) => Promise<void>;

  publishTarget: PublishTarget;
  onPublishTargetChange: (value: PublishTarget) => void;
  mediaKind: PostMediaKind;
  onMediaKindChange: (value: PostMediaKind) => void;
  mediaTitle: string;
  onMediaTitleChange: (value: string) => void;

  cardTemplate: CardTemplate;
  onCardTemplateChange: (value: CardTemplate) => void;
  onRewriteCardCopy: () => void;
  onGenerateCarousel: () => Promise<void>;

  firstComment: string;
  hashtags: string;
  onFirstCommentChange: (value: string) => void;
  onHashtagsChange: (value: string) => void;
  onGenerateKit: () => Promise<void>;

  preflight: PreflightResult | null;
  onRunPreflight: () => Promise<void>;

  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  onSchedule: () => Promise<void>;
  recommendedSlot: RecommendedSlot;
  onUseSuggestedSlot: () => void;

  onSaveMetrics: (metrics: Omit<PostMetrics, "recorded_at">) => Promise<void>;
  onSyncMetrics: () => Promise<void>;

  onDuplicate: () => Promise<void>;
  onRestoreRevision: (revision: PostRevision) => Promise<void>;
}

const REWRITES: { action: RewriteAction; label: string }[] = [
  { action: "sharper_hook", label: "Sharper hook" },
  { action: "simpler", label: "Simpler language" },
  { action: "more_technical", label: "More technical" },
  { action: "more_personal", label: "More personal" },
  { action: "shorter", label: "Make shorter" },
];

const TABS = [
  { id: "improve", label: "Improve", icon: Sparkles },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "publish", label: "Publish", icon: Send },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "history", label: "History", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

function metricValue(value: number | undefined): string {
  return value ? String(value) : "";
}

function Card({
  title,
  icon: Icon,
  hint,
  children,
  className = "",
}: {
  title: string;
  icon?: typeof Sparkles;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-cream-line bg-white p-5 ${className}`}
    >
      <h3 className="flex items-center gap-2 font-jakarta text-sm font-bold text-coal">
        {Icon && <Icon className="h-4 w-4 text-mint-700" />}
        {title}
      </h3>
      {hint && <p className="mt-1 text-xs text-coal-dim">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const FIELD =
  "w-full rounded-xl border border-cream-line bg-white px-3 py-2.5 text-sm text-coal outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-100";
const BTN_SOFT =
  "rounded-xl border border-cream-line px-3 py-2.5 text-xs font-semibold text-coal-soft transition hover:bg-cream-warm disabled:opacity-50";
const BTN_SOLID =
  "rounded-xl bg-coal px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-coal-soft disabled:opacity-50";

export default function PostStudioPanels(props: Props) {
  const {
    post,
    busy,
    quality,
    lengthSpec,
    onSelectVariant,
    onSelectHook,
    onRewrite,
    publishTarget,
    onPublishTargetChange,
    mediaKind,
    onMediaKindChange,
    mediaTitle,
    onMediaTitleChange,
    cardTemplate,
    onCardTemplateChange,
    onRewriteCardCopy,
    onGenerateCarousel,
    firstComment,
    hashtags,
    onFirstCommentChange,
    onHashtagsChange,
    onGenerateKit,
    preflight,
    onRunPreflight,
    scheduledAt,
    onScheduledAtChange,
    onSchedule,
    recommendedSlot,
    onUseSuggestedSlot,
    onSaveMetrics,
    onSyncMetrics,
    onDuplicate,
    onRestoreRevision,
  } = props;

  const [tab, setTab] = useState<TabId>("improve");
  const [customInstruction, setCustomInstruction] = useState("");
  const [metrics, setMetrics] = useState({
    impressions: metricValue(post.metrics?.impressions),
    reactions: metricValue(post.metrics?.reactions),
    comments: metricValue(post.metrics?.comments),
    reposts: metricValue(post.metrics?.reposts),
    clicks: metricValue(post.metrics?.clicks),
  });

  useEffect(() => {
    setMetrics({
      impressions: metricValue(post.metrics?.impressions),
      reactions: metricValue(post.metrics?.reactions),
      comments: metricValue(post.metrics?.comments),
      reposts: metricValue(post.metrics?.reposts),
      clicks: metricValue(post.metrics?.clicks),
    });
  }, [post.metrics]);

  const engagementRate =
    post.metrics && post.metrics.impressions > 0
      ? ((post.metrics.reactions +
          post.metrics.comments +
          post.metrics.reposts +
          post.metrics.clicks) /
          post.metrics.impressions) *
        100
      : null;

  const hasVariants =
    (post.variants?.length ?? 0) > 1 ||
    (post.alternative_hooks?.length ?? 0) > 0;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Post tools"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-cream-line bg-white p-1.5"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-coal text-white"
                  : "text-coal-muted hover:bg-cream-warm hover:text-coal"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === "improve" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Quality check"
              icon={ShieldCheck}
              hint={`${quality.wordCount} words · target ${lengthSpec.minWords}–${lengthSpec.maxWords}`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold ${
                    quality.score >= 80
                      ? "bg-mint-100 text-mint-800"
                      : quality.score >= 65
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {quality.score}
                </span>
                <div className="grid flex-1 grid-cols-2 gap-2 text-xs">
                  {Object.entries(quality.dimensions).map(([label, score]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg bg-cream-warm px-2.5 py-2"
                    >
                      <span className="capitalize text-coal-dim">{label}</span>
                      <span className="font-semibold text-coal">{score}</span>
                    </div>
                  ))}
                </div>
              </div>
              {quality.issues.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-xs text-amber-800">
                  {quality.issues.slice(0, 5).map((issue) => (
                    <li key={issue}>• {issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 flex items-center gap-1.5 text-xs text-mint-700">
                  <Check className="h-3.5 w-3.5" /> No common AI-writing tells
                  found.
                </p>
              )}
            </Card>

            <Card
              title="AI editor"
              icon={Sparkles}
              hint="Rewrites the body in place. Review before approving."
            >
              <div className="flex flex-wrap gap-2">
                {REWRITES.map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => void onRewrite(item.action)}
                    disabled={!!busy}
                    className={BTN_SOFT}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={customInstruction}
                  onChange={(event) => setCustomInstruction(event.target.value)}
                  placeholder="Custom change…"
                  className={`min-w-0 flex-1 ${FIELD}`}
                />
                <button
                  type="button"
                  disabled={!!busy || !customInstruction.trim()}
                  onClick={() => void onRewrite("custom", customInstruction)}
                  className={BTN_SOLID}
                >
                  {busy === "rewrite" ? "Applying…" : "Apply"}
                </button>
              </div>
            </Card>

            {hasVariants && (
              <Card
                title="Variants and A/B hooks"
                icon={Copy}
                className="lg:col-span-2"
              >
                <div className="grid gap-2 md:grid-cols-2">
                  {post.variants?.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => onSelectVariant(variant)}
                      className="rounded-xl border border-cream-line p-3 text-left transition hover:bg-cream-warm"
                    >
                      <span className="block text-xs font-bold text-mint-700">
                        {variant.label}
                      </span>
                      <span className="mt-1 block line-clamp-3 text-xs text-coal-muted">
                        {variant.hook || variant.body}
                      </span>
                    </button>
                  ))}
                </div>
                {(post.alternative_hooks?.length ?? 0) > 0 && (
                  <div className="mt-4 border-t border-cream-line pt-4">
                    <p className="mb-2 text-xs font-semibold text-coal-soft">
                      Alternative hooks
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {post.alternative_hooks?.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => onSelectHook(item)}
                          className="rounded-lg bg-cream-warm px-3 py-2 text-left text-xs text-coal-muted transition hover:text-coal"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {tab === "media" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Attachment"
              icon={ImageIcon}
              hint="Choose what LinkedIn shows below the text."
            >
              <label className="block text-xs font-semibold text-coal-soft">
                Post media
                <select
                  value={mediaKind}
                  onChange={(event) =>
                    onMediaKindChange(event.target.value as PostMediaKind)
                  }
                  className={`mt-1.5 ${FIELD}`}
                >
                  <option value="none">Text only</option>
                  <option value="image">Generated branded image</option>
                  <option value="document">Carousel PDF</option>
                </select>
              </label>
              {mediaKind !== "none" && (
                <label className="mt-3 block text-xs font-semibold text-coal-soft">
                  Media title
                  <input
                    value={mediaTitle}
                    onChange={(event) => onMediaTitleChange(event.target.value)}
                    placeholder={post.hook || post.topic}
                    className={`mt-1.5 ${FIELD}`}
                  />
                </label>
              )}
            </Card>

            <Card
              title="Document carousel"
              icon={FileText}
              hint="Convert this post into 6–9 printable slides."
            >
              <button
                type="button"
                disabled={!!busy}
                onClick={() => void onGenerateCarousel()}
                className={`inline-flex w-full items-center justify-center gap-2 ${BTN_SOFT}`}
              >
                {busy === "carousel" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {post.carousel_slides?.length
                  ? "Regenerate slides"
                  : "Generate carousel"}
              </button>
              {!!post.carousel_slides?.length && (
                <a
                  href={`/admin/studio/${post.id}/carousel`}
                  target="_blank"
                  className="mt-2 block w-full rounded-xl bg-coal px-3 py-2.5 text-center text-xs font-semibold text-white"
                >
                  Open and export PDF ({post.carousel_slides.length} slides)
                </a>
              )}
            </Card>

            {mediaKind === "image" && (
              <Card
                title="Creative direction"
                icon={Sparkles}
                hint="FLUX creates text-free editorial artwork; the studio overlays crisp branded typography."
                className="lg:col-span-2"
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {CARD_TEMPLATES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.hint}
                      onClick={() => onCardTemplateChange(item.id)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                        cardTemplate === item.id
                          ? "border-mint-600 bg-mint-50 text-mint-800"
                          : "border-cream-line text-coal-soft hover:bg-cream-warm"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onRewriteCardCopy}
                  className={`mt-3 inline-flex w-full items-center justify-center gap-2 ${BTN_SOFT}`}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate creative
                </button>
              </Card>
            )}
          </div>
        )}

        {tab === "publish" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Destination" icon={Send}>
              <label className="block text-xs font-semibold text-coal-soft">
                Publish as
                <select
                  value={publishTarget}
                  onChange={(event) =>
                    onPublishTargetChange(event.target.value as PublishTarget)
                  }
                  className={`mt-1.5 ${FIELD}`}
                >
                  <option value="member">Personal profile</option>
                  <option value="organization">Company page</option>
                </select>
              </label>

              <div className="mt-4 border-t border-cream-line pt-4">
                <p className="text-xs font-semibold text-coal-soft">
                  Suggested time
                </p>
                <div className="mt-2 rounded-xl bg-mint-50 p-3">
                  <p className="text-xs font-semibold text-mint-800">
                    {recommendedSlot.label}
                  </p>
                  <p className="mt-1 text-[10px] text-mint-700">
                    {recommendedSlot.basedOnPosts > 0
                      ? `Based on ${recommendedSlot.basedOnPosts} measured post${
                          recommendedSlot.basedOnPosts === 1 ? "" : "s"
                        }.`
                      : "Starter recommendation until more post metrics are available."}
                  </p>
                  <button
                    type="button"
                    onClick={onUseSuggestedSlot}
                    className="mt-2 text-xs font-semibold text-mint-800 underline"
                  >
                    Use next suggested slot
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => onScheduledAtChange(event.target.value)}
                  className={`mt-3 ${FIELD}`}
                />
                <button
                  type="button"
                  onClick={() => void onSchedule()}
                  disabled={!!busy}
                  className={`mt-2 w-full ${BTN_SOFT}`}
                >
                  {busy === "schedule" ? "Scheduling…" : "Schedule post"}
                </button>
                <p className="mt-2 text-[10px] text-coal-dim">
                  Set <code className="font-mono">ADMIN_CRON_SECRET</code> and
                  hit{" "}
                  <code className="font-mono">
                    /api/admin/cron/publish-scheduled
                  </code>{" "}
                  on a free cron.
                </p>
              </div>
            </Card>

            <Card
              title="Publish kit"
              icon={MessageCircle}
              hint="Hashtags are appended on publish. The first comment posts automatically when LinkedIn allows it."
            >
              <label className="block text-xs font-semibold text-coal-soft">
                First comment
                <textarea
                  value={firstComment}
                  onChange={(event) => onFirstCommentChange(event.target.value)}
                  rows={4}
                  className={`mt-1.5 ${FIELD}`}
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-coal-soft">
                Hashtags
                <input
                  value={hashtags}
                  onChange={(event) => onHashtagsChange(event.target.value)}
                  placeholder="ArtificialIntelligence RAG UAE"
                  className={`mt-1.5 ${FIELD}`}
                />
              </label>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => void onGenerateKit()}
                className={`mt-3 w-full ${BTN_SOFT}`}
              >
                {busy === "kit"
                  ? "Generating kit…"
                  : "Generate first comment + tags"}
              </button>
              {post.first_comment_posted_at ? (
                <p className="mt-2 text-[11px] text-mint-700">
                  First comment posted{" "}
                  {new Date(post.first_comment_posted_at).toLocaleString()}.
                </p>
              ) : null}
            </Card>

            <Card
              title="Publish preflight"
              icon={ShieldCheck}
              hint="Checks LinkedIn limits, media readiness, sources, quality, and similar posts."
              className="lg:col-span-2"
            >
              <button
                type="button"
                disabled={!!busy}
                onClick={() => void onRunPreflight()}
                className={`w-full sm:w-auto ${BTN_SOLID}`}
              >
                {busy === "preflight" ? "Checking…" : "Run preflight"}
              </button>
              {preflight && (
                <div className="mt-4 space-y-2">
                  <p
                    className={`text-xs font-semibold ${
                      preflight.ready ? "text-mint-700" : "text-red-700"
                    }`}
                  >
                    {preflight.ready
                      ? "Ready to publish"
                      : "Blocking issues found"}
                  </p>
                  {preflight.issues.length === 0 ? (
                    <p className="text-xs text-coal-dim">All checks passed.</p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {preflight.issues.map((issue) => (
                        <div
                          key={`${issue.code}-${issue.message}`}
                          className={`rounded-lg p-2.5 text-[11px] ${
                            issue.severity === "error"
                              ? "bg-red-50 text-red-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {issue.message}
                          {issue.relatedPostId && (
                            <a
                              href={`/admin/studio/${issue.relatedPostId}`}
                              className="ml-1 font-semibold underline"
                            >
                              Open
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "insights" && (
          <Card
            title="Performance"
            icon={BarChart3}
            hint="These results teach future generations which topics and formats work."
          >
            {engagementRate != null && (
              <p className="mb-3 text-sm font-semibold text-mint-700">
                {engagementRate.toFixed(1)}% recorded engagement
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Object.entries(metrics).map(([key, value]) => (
                <label
                  key={key}
                  className="text-[11px] font-semibold capitalize text-coal-dim"
                >
                  {key}
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(event) =>
                      setMetrics((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className={`mt-1 ${FIELD}`}
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!!busy}
                onClick={() =>
                  void onSaveMetrics({
                    impressions: Number(metrics.impressions) || 0,
                    reactions: Number(metrics.reactions) || 0,
                    comments: Number(metrics.comments) || 0,
                    reposts: Number(metrics.reposts) || 0,
                    clicks: Number(metrics.clicks) || 0,
                  })
                }
                className={BTN_SOFT}
              >
                {busy === "metrics" ? "Saving…" : "Save metrics"}
              </button>
              {post.linkedin_post_urn && (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void onSyncMetrics()}
                  className="rounded-xl bg-[#0A66C2] px-3 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {busy === "sync-metrics"
                    ? "Syncing LinkedIn…"
                    : "Sync from LinkedIn"}
                </button>
              )}
            </div>
            {post.metrics?.source && (
              <p className="mt-3 text-[10px] text-coal-dim">
                Source: {post.metrics.source} ·{" "}
                {new Date(post.metrics.recorded_at).toLocaleString()}
              </p>
            )}
          </Card>
        )}

        {tab === "history" && (
          <Card
            title="Version history"
            icon={History}
            hint={`${post.revisions?.length ?? 0} saved version${
              (post.revisions?.length ?? 0) === 1 ? "" : "s"
            }. Restoring brings the post back to draft.`}
          >
            {post.revisions?.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {post.revisions.slice(0, 8).map((revision) => (
                  <button
                    key={revision.id}
                    type="button"
                    disabled={!!busy}
                    onClick={() => void onRestoreRevision(revision)}
                    className="rounded-xl border border-cream-line p-3 text-left transition hover:bg-cream-warm disabled:opacity-50"
                  >
                    <span className="block text-[10px] text-coal-dim">
                      {new Date(revision.created_at).toLocaleString()}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs text-coal-muted">
                      {revision.hook || revision.body || "Empty draft"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-coal-dim">
                Earlier versions appear after the first content edit.
              </p>
            )}
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void onDuplicate()}
              className={`mt-4 inline-flex items-center justify-center gap-2 ${BTN_SOFT}`}
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate for repurposing
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
