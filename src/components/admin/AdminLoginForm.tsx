"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") || "/admin";
  const setupDone = searchParams.get("setup") === "done";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as { error?: string }) : {};
      } catch {
        setError(
          res.ok
            ? "Unexpected server response."
            : `Server error (${res.status}). Redeploy the latest build or redo /admin/setup.`,
        );
        return;
      }
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Check the site is running and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {setupDone && (
        <p className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-900">
          Setup complete. Sign in with your new password.
        </p>
      )}

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-coal-soft"
        >
          Admin password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-cream-line bg-white px-4 py-3 text-coal outline-none ring-mint-500/30 focus:ring-2"
          placeholder="Enter admin password"
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-coal px-4 py-3 font-jakarta text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
