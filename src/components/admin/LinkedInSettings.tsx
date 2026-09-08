"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface LinkedInSettingsProps {
  configured: boolean;
  connected: boolean;
  memberUrn: string | null;
  expiresAt: number | null;
}

export default function LinkedInSettings({
  configured,
  connected: initialConnected,
  memberUrn,
  expiresAt,
}: LinkedInSettingsProps) {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(initialConnected);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => {
    const status = searchParams.get("linkedin");
    if (status === "connected") return "LinkedIn connected successfully.";
    if (status === "error") {
      return `LinkedIn error: ${searchParams.get("reason") || "unknown"}`;
    }
    if (status === "state") return "OAuth state mismatch — try again.";
    return "";
  });

  async function connect() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/linkedin/connect");
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setMessage(data.error || "Could not start OAuth.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setMessage("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/admin/linkedin/status", { method: "DELETE" });
      setConnected(false);
      setMessage("LinkedIn disconnected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-white p-6">
      <h2 className="font-jakarta text-lg font-bold text-coal">LinkedIn</h2>
      <p className="mt-1 text-sm text-coal-muted">
        Connect once to publish approved posts directly. Uses LinkedIn&apos;s free
        OAuth + Posts API.
      </p>

      {!configured && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Save LinkedIn Client ID and Secret in the form above, then connect
          below.
        </p>
      )}

      <div className="mt-4 space-y-2 text-sm text-coal-soft">
        <p>
          Status:{" "}
          <span className={connected ? "text-mint-700 font-semibold" : "text-coal-dim"}>
            {connected ? "Connected" : "Not connected"}
          </span>
        </p>
        {memberUrn && (
          <p className="font-mono text-xs text-coal-dim">{memberUrn}</p>
        )}
        {expiresAt && (
          <p className="text-xs text-coal-dim">
            Token expires {new Date(expiresAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!connected ? (
          <button
            type="button"
            onClick={connect}
            disabled={!configured || busy}
            className="rounded-xl bg-[#0A66C2] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? "Redirecting…" : "Connect LinkedIn"}
          </button>
        ) : (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="rounded-xl border border-cream-line px-4 py-2.5 text-sm text-coal-muted"
          >
            Disconnect
          </button>
        )}
      </div>

      {message && (
        <p className="mt-4 rounded-xl bg-cream-warm px-4 py-3 text-sm text-coal-soft">
          {message}
        </p>
      )}

      <div className="mt-6 border-t border-cream-line pt-4 text-xs text-coal-dim">
        <p className="font-semibold text-coal-muted">Setup checklist</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Create app at linkedin.com/developers</li>
          <li>Add product: Share on LinkedIn</li>
          <li>Redirect URL: your site + /api/admin/linkedin/callback</li>
          <li>Request scope: w_member_social (may need app review)</li>
        </ol>
      </div>
    </div>
  );
}
