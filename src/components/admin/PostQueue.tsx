"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LinkedInPostRow, PostStatus } from "@/lib/admin-types";

const STATUSES: Array<PostStatus | "all"> = [
  "all",
  "draft",
  "approved",
  "scheduled",
  "posted",
  "failed",
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PostQueue({ posts }: { posts: LinkedInPostRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PostStatus | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (status !== "all" && post.status !== status) return false;
      if (!needle) return true;
      return (
        post.topic.toLowerCase().includes(needle) ||
        post.body.toLowerCase().includes(needle) ||
        (post.hook ?? "").toLowerCase().includes(needle)
      );
    });
  }, [posts, query, status]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleAll() {
    if (selected.length === filtered.length) {
      setSelected([]);
      return;
    }
    setSelected(filtered.map((post) => post.id));
  }

  async function bulk(action: "approve" | "draft" | "delete") {
    if (selected.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${selected.length} posts?`)) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error || "Bulk update failed.");
      setSelected([]);
      setMessage(
        action === "delete"
          ? "Selected posts deleted."
          : `Updated ${selected.length} posts.`,
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search topic or body"
          className="min-w-[220px] flex-1 rounded-xl border border-cream-line px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                status === item
                  ? "bg-coal text-white"
                  : "bg-white text-coal-muted ring-1 ring-cream-line"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-cream-warm px-3 py-2 text-sm">
          <span className="text-coal-muted">{selected.length} selected</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulk("approve")}
            className="rounded-lg bg-mint-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulk("draft")}
            className="rounded-lg border border-cream-line bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Move to draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void bulk("delete")}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}

      {message && (
        <p className="text-sm text-mint-800">{message}</p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-line bg-white px-6 py-12 text-center">
          <p className="text-coal-muted">No posts match this filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cream-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-line bg-cream-warm text-xs uppercase tracking-wider text-coal-dim">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 && selected.length === filtered.length
                    }
                    onChange={toggleAll}
                    aria-label="Select all visible posts"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Topic</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">
                  Status
                </th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                  Updated
                </th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-cream-line last:border-0"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(post.id)}
                      onChange={() => toggle(post.id)}
                      aria-label={`Select ${post.topic}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-coal line-clamp-1">
                      {post.topic}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-coal-dim md:hidden">
                      {post.status} · {formatDate(post.updated_at)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 capitalize text-coal-muted md:table-cell">
                    {post.status}
                  </td>
                  <td className="hidden px-4 py-3 text-coal-dim lg:table-cell">
                    {formatDate(post.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/studio/${post.id}`}
                      className="font-medium text-mint-700 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
