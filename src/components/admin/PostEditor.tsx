"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import PostPreview from "@/components/admin/PostPreview";
import PostStudioPanels from "@/components/admin/PostStudioPanels";
import {
  evaluatePostQuality,
  resolveLengthSpec,
} from "@/lib/linkedin-style-guide";
import type {
  LinkedInPostRow,
  PostMetrics,
  PostMediaKind,
  PostRevision,
  PostVariant,
  PublishTarget,
  RewriteAction,
} from "@/lib/admin-types";
import type { CardTemplate } from "@/lib/linkedin-card";
import type { RecommendedSlot } from "@/lib/linkedin-scheduling";
import type { PreflightResult } from "@/lib/linkedin-preflight";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-cream-warm text-coal-muted",
  approved: "bg-mint-100 text-mint-800",
  scheduled: "bg-blue-50 text-blue-700",
  posted: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

function toLocalInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

interface PostEditorProps {
  post: LinkedInPostRow;
  linkedinConnected: boolean;
  recommendedSlot: RecommendedSlot;
}

export default function PostEditor({
  post: initial,
  linkedinConnected,
  recommendedSlot,
}: PostEditorProps) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [body, setBody] = useState(initial.body);
  const [hook, setHook] = useState(initial.hook ?? "");
  const [publishTarget, setPublishTarget] = useState<PublishTarget>(
    initial.publish_target ?? "member",
  );
  const [mediaKind, setMediaKind] = useState<PostMediaKind>(
    initial.media_kind ?? "none",
  );
  const [mediaTitle, setMediaTitle] = useState(initial.media_title ?? "");
  const [firstComment, setFirstComment] = useState(initial.first_comment ?? "");
  const [hashtags, setHashtags] = useState((initial.hashtags ?? []).join(" "));
  const [scheduledAt, setScheduledAt] = useState(
    initial.scheduled_at ? toLocalInputValue(initial.scheduled_at) : "",
  );
  const [cardTemplate, setCardTemplate] = useState<CardTemplate>("auto");
  /** Bumping this busts the image cache so the card copy is rewritten. */
  const [cardVersion, setCardVersion] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);

  const lengthSpec = useMemo(
    () =>
      resolveLengthSpec(
        post.length ?? "medium",
        post.target_word_count ?? undefined,
      ),
    [post.length, post.target_word_count],
  );
  const quality = useMemo(
    () => evaluatePostQuality(body, lengthSpec),
    [body, lengthSpec],
  );

  async function patch(data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = (await res.json()) as { post?: LinkedInPostRow; error?: string };
    if (!res.ok || !json.post) throw new Error(json.error || "Update failed.");
    setPost(json.post);
    return json.post;
  }

  function kitPayload() {
    return {
      first_comment: firstComment,
      hashtags: hashtags
        .split(/[\s,]+/)
        .map((tag) => tag.replace(/^#+/, "").trim())
        .filter(Boolean),
    };
  }

  async function saveDraft() {
    setBusy("save");
    setMessage("");
    try {
      await patch({
        body,
        hook,
        status: "draft",
        publish_target: publishTarget,
        media_kind: mediaKind,
        media_title: mediaTitle,
        ...kitPayload(),
      });
      setMessage("Draft saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    setBusy("approve");
    setMessage("");
    try {
      await patch({
        body,
        hook,
        status: "approved",
        publish_target: publishTarget,
        media_kind: mediaKind,
        media_title: mediaTitle,
        ...kitPayload(),
      });
      setMessage("Approved — ready to publish.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setBusy(null);
    }
  }

  async function schedule() {
    if (!scheduledAt) {
      setMessage("Pick a date and time to schedule.");
      return;
    }
    setBusy("schedule");
    setMessage("");
    try {
      await patch({
        body,
        hook,
        status: "scheduled",
        scheduled_at: new Date(scheduledAt).toISOString(),
        publish_target: publishTarget,
        media_kind: mediaKind,
        media_title: mediaTitle,
        ...kitPayload(),
      });
      setMessage("Scheduled. Cron will publish when due (if configured).");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Schedule failed.");
    } finally {
      setBusy(null);
    }
  }

  async function regenerate() {
    setBusy("regenerate");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/posts/${post.id}?action=generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as {
        post?: LinkedInPostRow;
        error?: string;
      };
      if (!res.ok || !json.post) {
        throw new Error(json.error || "Regeneration failed.");
      }
      setPost(json.post);
      setBody(json.post.body);
      setHook(json.post.hook ?? "");
      setFirstComment(json.post.first_comment ?? "");
      setHashtags((json.post.hashtags ?? []).join(" "));
      setMessage("Regenerated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setBusy(null);
    }
  }

  function selectVariant(variant: PostVariant) {
    setBody(variant.body);
    setHook(variant.hook);
    setMessage(`${variant.label} variant selected. Save when ready.`);
  }

  function selectHook(nextHook: string) {
    const lines = body.split("\n");
    const firstContentLine = lines.findIndex((line) => line.trim().length > 0);
    if (firstContentLine >= 0) {
      lines[firstContentLine] = nextHook;
      setBody(lines.join("\n"));
    } else {
      setBody(nextHook);
    }
    setHook(nextHook);
    setMessage("Alternative hook applied.");
  }

  async function rewrite(action: RewriteAction, instruction?: string) {
    setBusy("rewrite");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/posts/${post.id}?action=rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, instruction, body }),
      });
      const json = (await res.json()) as {
        post?: LinkedInPostRow;
        error?: string;
      };
      if (!res.ok || !json.post) {
        throw new Error(json.error || "Rewrite failed.");
      }
      setPost(json.post);
      setBody(json.post.body);
      setHook(json.post.hook ?? "");
      setMessage("AI edit applied. Review the changes before approving.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Rewrite failed.");
    } finally {
      setBusy(null);
    }
  }

  async function saveMetrics(metrics: Omit<PostMetrics, "recorded_at">) {
    setBusy("metrics");
    setMessage("");
    try {
      await patch({ metrics });
      setMessage("Performance metrics saved for the learning loop.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Metrics save failed.");
    } finally {
      setBusy(null);
    }
  }

  async function syncMetrics() {
    setBusy("sync-metrics");
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/posts/${post.id}?action=sync-metrics`,
        { method: "POST" },
      );
      const json = (await res.json()) as {
        post?: LinkedInPostRow;
        error?: string;
      };
      if (!res.ok || !json.post) {
        throw new Error(json.error || "Metrics sync failed.");
      }
      setPost(json.post);
      setMessage("LinkedIn metrics synced.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "LinkedIn metrics are unavailable; manual entry still works.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function generateCarousel() {
    setBusy("carousel");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/posts/${post.id}?action=carousel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = (await res.json()) as {
        post?: LinkedInPostRow;
        error?: string;
      };
      if (!res.ok || !json.post) {
        throw new Error(json.error || "Carousel generation failed.");
      }
      setPost(json.post);
      setMediaKind("document");
      setMessage("Carousel slides generated. Open them to export a PDF.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Carousel generation failed.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function runPreflight() {
    setBusy("preflight");
    setMessage("");
    try {
      await patch({
        body,
        hook,
        publish_target: publishTarget,
        media_kind: mediaKind,
        media_title: mediaTitle,
      });
      const response = await fetch(
        `/api/admin/posts/${post.id}?action=preflight`,
        { method: "POST" },
      );
      const json = (await response.json()) as {
        preflight?: PreflightResult;
        error?: string;
      };
      if (!response.ok || !json.preflight) {
        throw new Error(json.error || "Preflight failed.");
      }
      setPreflight(json.preflight);
      setMessage(
        json.preflight.ready
          ? "Preflight passed."
          : "Resolve the blocking preflight issues before publishing.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Preflight failed.");
    } finally {
      setBusy(null);
    }
  }

  async function duplicatePost() {
    setBusy("duplicate");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/posts/${post.id}?action=duplicate`,
        { method: "POST" },
      );
      const json = (await response.json()) as {
        post?: LinkedInPostRow;
        error?: string;
      };
      if (!response.ok || !json.post) {
        throw new Error(json.error || "Duplication failed.");
      }
      router.push(`/admin/studio/${json.post.id}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Duplication failed.");
      setBusy(null);
    }
  }

  async function restoreRevision(revision: PostRevision) {
    setBusy("restore");
    setMessage("");
    try {
      const restored = await patch({
        body: revision.body,
        hook: revision.hook ?? "",
        status: "draft",
      });
      setBody(restored.body);
      setHook(restored.hook ?? "");
      setPreflight(null);
      setMessage("Earlier version restored as a draft.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setBusy(null);
    }
  }

  async function publishNow() {
    setBusy("publish");
    setMessage("");
    try {
      if (post.status !== "approved" && post.status !== "scheduled") {
        await patch({
          body,
          hook,
          status: "approved",
          publish_target: publishTarget,
          media_kind: mediaKind,
          media_title: mediaTitle,
        });
      } else {
        await patch({
          body,
          hook,
          publish_target: publishTarget,
          media_kind: mediaKind,
          media_title: mediaTitle,
          ...kitPayload(),
        });
      }

      const res = await fetch(`/api/admin/posts/${post.id}?action=publish`, {
        method: "POST",
      });
      const json = (await res.json()) as {
        post?: LinkedInPostRow;
        error?: string;
        preflight?: PreflightResult;
      };
      if (!res.ok || !json.post) {
        if (json.preflight) setPreflight(json.preflight);
        throw new Error(json.error || "Publish failed.");
      }
      setPost(json.post);
      setMessage("Published to LinkedIn.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setBusy(null);
    }
  }

  async function generateKit() {
    setBusy("kit");
    setMessage("");
    try {
      await patch({ body, hook, ...kitPayload() });
      const response = await fetch(
        `/api/admin/posts/${post.id}?action=publish-kit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      const json = (await response.json()) as {
        post?: LinkedInPostRow;
        error?: string;
      };
      if (!response.ok || !json.post) {
        throw new Error(json.error || "Publish kit failed.");
      }
      setPost(json.post);
      setFirstComment(json.post.first_comment ?? "");
      setHashtags((json.post.hashtags ?? []).join(" "));
      setMessage("First comment and hashtags ready.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Publish kit failed.");
    } finally {
      setBusy(null);
    }
  }

  async function copyPublishKit() {
    const tags = hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#+/, "").trim())
      .filter(Boolean)
      .map((tag) => `#${tag}`)
      .join(" ");
    const pack = [
      body.trim(),
      tags ? `\n${tags}` : "",
      firstComment.trim() ? `\n\nFirst comment:\n${firstComment.trim()}` : "",
    ].join("");
    await navigator.clipboard.writeText(pack.trim());
    setMessage("Publish kit copied.");
  }

  async function deletePost() {
    if (!confirm("Delete this post permanently?")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed.");
      setBusy(null);
    }
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5">
      <header className="sticky top-0 z-20 -mx-4 border-b border-cream-line bg-cream/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-coal-dim transition hover:text-coal"
          >
            <ArrowLeft className="h-4 w-4" />
            Queue
          </Link>

          <span className="hidden h-4 w-px bg-cream-line sm:block" />

          <h1 className="min-w-0 flex-1 truncate font-jakarta text-base font-bold text-coal">
            {post.topic}
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={!!busy}
              className="rounded-xl border border-cream-line bg-white px-4 py-2 text-sm font-semibold text-coal transition hover:bg-cream-warm disabled:opacity-60"
            >
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={!!busy}
              className="rounded-xl bg-mint-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-mint-700 disabled:opacity-60"
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              onClick={publishNow}
              disabled={!!busy || post.status === "posted"}
              className="rounded-xl bg-coal px-4 py-2 text-sm font-bold text-white transition hover:bg-coal-soft disabled:opacity-60"
            >
              {busy === "publish" ? "Publishing…" : "Publish now"}
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide ${
              STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
            }`}
          >
            {post.status}
          </span>
          <span className="text-coal-dim">
            {post.template.replace(/_/g, " ")}
          </span>
          <span className="text-coal-dim">·</span>
          <span className="text-coal-dim">
            {words} words · {body.length} characters
          </span>
          <span className="text-coal-dim">·</span>
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              quality.score >= 80
                ? "bg-mint-100 text-mint-800"
                : quality.score >= 65
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            Quality {quality.score}
          </span>

          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={copyPublishKit}
              className="rounded-lg px-2.5 py-1 font-semibold text-coal-muted transition hover:bg-cream-warm hover:text-coal"
            >
              Copy kit
            </button>
            <button
              type="button"
              onClick={regenerate}
              disabled={!!busy}
              className="rounded-lg px-2.5 py-1 font-semibold text-coal-muted transition hover:bg-cream-warm hover:text-coal disabled:opacity-60"
            >
              {busy === "regenerate" ? "Regenerating…" : "Regenerate"}
            </button>
            <button
              type="button"
              onClick={deletePost}
              disabled={!!busy}
              aria-label="Delete post"
              className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </span>
        </div>
      </header>

      {message && (
        <p className="rounded-xl bg-mint-50 px-4 py-3 text-sm text-mint-800">
          {message}
        </p>
      )}

      {post.error_message && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {post.error_message}
        </p>
      )}

      {!linkedinConnected && post.status !== "posted" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          LinkedIn is not connected — use Copy kit and post manually, or connect
          in{" "}
          <Link href="/admin/settings" className="font-semibold underline">
            Settings
          </Link>
          .
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-cream-line bg-white p-5">
            <label className="block text-xs font-semibold text-coal-soft">
              Hook
              <input
                value={hook}
                onChange={(event) => {
                  setHook(event.target.value);
                  setPreflight(null);
                }}
                placeholder="The first line people see before “see more”."
                className="mt-1.5 w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-sm text-coal outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-100"
              />
            </label>

            <label className="mt-4 block text-xs font-semibold text-coal-soft">
              Post body
              <textarea
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setPreflight(null);
                }}
                rows={20}
                className="mt-1.5 w-full rounded-xl border border-cream-line bg-white px-4 py-3 font-sans text-[15px] leading-relaxed text-coal outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-100"
              />
            </label>

            {post.linkedin_url && (
              <a
                href={post.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-mint-700 hover:underline"
              >
                View on LinkedIn <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </section>
        </div>

        <div className="h-fit xl:sticky xl:top-28">
          <PostPreview
            post={post}
            body={body}
            mediaKind={mediaKind}
            cardTemplate={cardTemplate}
            cardVersion={cardVersion}
          />
        </div>
      </div>

      <PostStudioPanels
        post={post}
        busy={busy}
        quality={quality}
        lengthSpec={lengthSpec}
        onSelectVariant={selectVariant}
        onSelectHook={selectHook}
        onRewrite={rewrite}
        publishTarget={publishTarget}
        onPublishTargetChange={(value) => {
          setPublishTarget(value);
          setPreflight(null);
        }}
        mediaKind={mediaKind}
        onMediaKindChange={(value) => {
          setMediaKind(value);
          setPreflight(null);
        }}
        mediaTitle={mediaTitle}
        onMediaTitleChange={(value) => {
          setMediaTitle(value);
          setPreflight(null);
        }}
        cardTemplate={cardTemplate}
        onCardTemplateChange={setCardTemplate}
        onRewriteCardCopy={() => setCardVersion(Date.now())}
        onGenerateCarousel={generateCarousel}
        firstComment={firstComment}
        hashtags={hashtags}
        onFirstCommentChange={setFirstComment}
        onHashtagsChange={setHashtags}
        onGenerateKit={generateKit}
        preflight={preflight}
        onRunPreflight={runPreflight}
        scheduledAt={scheduledAt}
        onScheduledAtChange={setScheduledAt}
        onSchedule={schedule}
        recommendedSlot={recommendedSlot}
        onUseSuggestedSlot={() =>
          setScheduledAt(toLocalInputValue(recommendedSlot.nextAt))
        }
        onSaveMetrics={saveMetrics}
        onSyncMetrics={syncMetrics}
        onDuplicate={duplicatePost}
        onRestoreRevision={restoreRevision}
      />
    </div>
  );
}
