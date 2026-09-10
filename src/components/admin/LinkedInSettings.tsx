"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

interface LinkedInSettingsProps {
  configured: boolean;
  connected: boolean;
  memberUrn: string | null;
  expiresAt: number | null;
  organizationUrn?: string | null;
  advancedScopes?: boolean;
  grantedScopes?: string[];
  canReadComments?: boolean;
}

export default function LinkedInSettings({
  configured,
  connected: initialConnected,
  memberUrn,
  expiresAt,
  organizationUrn,
  advancedScopes,
  grantedScopes = [],
  canReadComments = false,
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
        {organizationUrn && (
          <p className="font-mono text-xs text-coal-dim">
            Company: {organizationUrn}
          </p>
        )}
      </div>

      {connected && (
        <div className="mt-4 rounded-xl border border-cream-line bg-cream-warm px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-coal-muted">
            Permissions LinkedIn granted
          </p>
          {grantedScopes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {grantedScopes.map((scope) => (
                <span
                  key={scope}
                  className="rounded-md border border-cream-line bg-white px-2 py-0.5 font-mono text-[11px] text-coal-soft"
                >
                  {scope}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-coal-dim">
              Unknown — this connection predates scope tracking. Reconnect to
              record exactly what LinkedIn granted.
            </p>
          )}

          <p
            className={`mt-3 text-xs ${
              canReadComments ? "text-mint-700" : "text-amber-800"
            }`}
          >
            {canReadComments
              ? "Comment polling is available (r_member_social granted)."
              : "Comment polling unavailable — r_member_social was not granted, so reading comments returns 403. Publishing and posting replies still work. Use manual paste mode until LinkedIn approves the Community Management API for this app."}
          </p>
        </div>
      )}

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
          <li>
            Company publishing and automatic analytics require Community
            Management API approval and reconnecting with advanced scopes
            enabled.
          </li>
        </ol>
        {advancedScopes && (
          <p className="mt-2 font-semibold text-amber-700">
            Advanced scopes are enabled. Reconnect after changing scope access.
          </p>
        )}
      </div>
    </div>
  );
}
