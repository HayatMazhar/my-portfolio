"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MinusCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";

interface KeyHealth {
  id: string;
  label: string;
  state: "ok" | "invalid" | "missing" | "expiring" | "unknown";
  detail: string;
  expiresInDays?: number;
  actionNeeded: boolean;
}

const ICONS = {
  ok: <CheckCircle2 className="h-4 w-4 text-mint-700" />,
  expiring: <Clock className="h-4 w-4 text-amber-600" />,
  invalid: <XCircle className="h-4 w-4 text-red-600" />,
  unknown: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  missing: <MinusCircle className="h-4 w-4 text-coal-dim" />,
};

export default function KeyHealthPanel() {
  const [keys, setKeys] = useState<KeyHealth[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/keys/health");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed.");
      setKeys(data.keys);
      setCheckedAt(data.checkedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const needsAttention = keys?.filter((key) => key.actionNeeded) ?? [];

  return (
    <section className="rounded-2xl border border-cream-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-jakarta text-sm font-bold text-coal">
            Provider key health
          </h2>
          <p className="mt-1 text-xs text-coal-dim">
            Each key is tested with one live call. API keys have no published
            expiry, so this reports whether they still work.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void check()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-cream-line px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          Re-check
        </button>
      </div>

      {needsAttention.length > 0 && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {needsAttention.length} key
          {needsAttention.length === 1 ? "" : "s"} need attention:{" "}
          {needsAttention.map((key) => key.label).join(", ")}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-3 divide-y divide-cream-line">
        {(keys ?? []).map((key) => (
          <li key={key.id} className="flex items-center gap-3 py-2.5">
            {ICONS[key.state]}
            <span className="text-xs font-semibold text-coal">{key.label}</span>
            <span className="ml-auto text-right text-[11px] text-coal-dim">
              {key.detail}
            </span>
          </li>
        ))}
        {!keys && !error && (
          <li className="py-2.5 text-xs text-coal-dim">Checking…</li>
        )}
      </ul>

      {checkedAt && (
        <p className="mt-2 text-[10px] text-coal-dim">
          Last checked {new Date(checkedAt).toLocaleString()}
        </p>
      )}
    </section>
  );
}
