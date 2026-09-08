"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LinkedInPostRow } from "@/lib/admin-types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-cream-warm text-coal-muted",
  approved: "bg-mint-100 text-mint-800",
  scheduled: "bg-blue-50 text-blue-700",
  posted: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

interface PostEditorProps {
  post: LinkedInPostRow;
  linkedinConnected: boolean;
}

export default function PostEditor({
  post: initial,
  linkedinConnected,
}: PostEditorProps) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [body, setBody] = useState(initial.body);
  const [hook, setHook] = useState(initial.hook ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    initial.scheduled_at
      ? new Date(initial.scheduled_at).toISOString().slice(0, 16)
      : "",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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

  async function saveDraft() {
    setBusy("save");
    setMessage("");
    try {
      await patch({ body, hook, status: "draft" });
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
      await patch({ body, hook, status: "approved" });
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
      const res = await fetch(
        `/api/admin/posts/${post.id}?action=generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
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
      setMessage("Regenerated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setBusy(null);
    }
  }

  async function publishNow() {
    setBusy("publish");
    setMessage("");
    try {
      if (post.status !== "approved" && post.status !== "scheduled") {
        await patch({ body, hook, status: "approved" });
      } else {
        await patch({ body, hook });
      }

      const res = await fetch(
        `/api/admin/posts/${post.id}?action=publish`,
        { method: "POST" },
      );
      const json = (await res.json()) as {
        post?: LinkedInPostRow;
        error?: string;
      };
      if (!res.ok || !json.post) {
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

  async function copyToClipboard() {
    await navigator.clipboard.writeText(body);
    setMessage("Copied to clipboard.");
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}
          >
            {post.status}
          </span>
          <span className="text-sm text-coal-dim">{post.template.replace("_", " ")}</span>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-coal-soft">
            Hook (optional)
          </label>
          <input
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-coal-soft">
            Post body
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 font-sans text-[15px] leading-relaxed text-coal"
          />
          <p className="mt-1 text-xs text-coal-dim">{body.length} characters</p>
        </div>

        {post.error_message && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {post.error_message}
          </p>
        )}

        {post.linkedin_url && (
          <a
            href={post.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-mint-700 hover:underline"
          >
            View on LinkedIn →
          </a>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-cream-line bg-white p-4">
          <h3 className="font-jakarta text-sm font-bold text-coal">Actions</h3>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={!!busy}
              className="rounded-xl border border-cream-line px-4 py-2.5 text-sm font-medium text-coal hover:bg-cream-warm disabled:opacity-60"
            >
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={approve}
              disabled={!!busy}
              className="rounded-xl bg-mint-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              onClick={publishNow}
              disabled={!!busy || post.status === "posted"}
              className="rounded-xl bg-coal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy === "publish" ? "Publishing…" : "Publish now"}
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-xl border border-cream-line px-4 py-2.5 text-sm text-coal-muted"
            >
              Copy to clipboard
            </button>
            <button
              type="button"
              onClick={regenerate}
              disabled={!!busy}
              className="rounded-xl border border-cream-line px-4 py-2.5 text-sm text-coal-muted disabled:opacity-60"
            >
              {busy === "regenerate" ? "Regenerating…" : "Regenerate with AI"}
            </button>
            <button
              type="button"
              onClick={deletePost}
              disabled={!!busy}
              className="rounded-xl px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Delete
            </button>
          </div>

          {!linkedinConnected && post.status !== "posted" && (
            <p className="mt-3 text-xs text-amber-700">
              LinkedIn not connected — use copy + manual post, or connect in Settings.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-cream-line bg-white p-4">
          <h3 className="font-jakarta text-sm font-bold text-coal">Schedule</h3>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-3 w-full rounded-xl border border-cream-line px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={schedule}
            disabled={!!busy}
            className="mt-2 w-full rounded-xl border border-cream-line px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {busy === "schedule" ? "Scheduling…" : "Schedule post"}
          </button>
          <p className="mt-2 text-xs text-coal-dim">
            Set{" "}
            <code className="font-mono">ADMIN_CRON_SECRET</code> and hit{" "}
            <code className="font-mono">/api/admin/cron/publish-scheduled</code>{" "}
            on a free cron (e.g. cron-job.org).
          </p>
        </div>

        {message && (
          <p className="rounded-xl bg-mint-50 px-4 py-3 text-sm text-mint-800">
            {message}
          </p>
        )}

        <Link
          href="/admin"
          className="block text-center text-sm text-coal-dim hover:text-coal"
        >
          ← Back to queue
        </Link>
      </aside>
    </div>
  );
}
