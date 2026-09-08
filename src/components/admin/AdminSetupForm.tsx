"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminSetupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    siteUrl:
      typeof window !== "undefined" ?
        window.location.origin.replace(/\/$/, "")
      : "https://mazharhayat.live",
    password: "",
    confirmPassword: "",
    groqApiKey: "",
    linkedinClientId: "",
    linkedinClientSecret: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Setup failed.");
        return;
      }
      router.push("/admin/login?setup=done");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="space-y-3">
        <h2 className="font-jakarta text-sm font-bold text-coal">Site</h2>
        <input
          value={form.siteUrl}
          onChange={(e) => set("siteUrl", e.target.value)}
          placeholder="https://mazharhayat.live"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm"
          required
        />
        <p className="text-xs text-coal-dim">
          Used for LinkedIn OAuth redirect and social cards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-jakarta text-sm font-bold text-coal">Admin login</h2>
        <input
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder="Password (min 8 chars)"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm"
          required
          minLength={8}
        />
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          placeholder="Confirm password"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm"
          required
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-jakarta text-sm font-bold text-coal">AI (Groq)</h2>
        <input
          type="password"
          value={form.groqApiKey}
          onChange={(e) => set("groqApiKey", e.target.value)}
          placeholder="Groq API key — free at console.groq.com"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm font-mono"
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-jakarta text-sm font-bold text-coal">
          LinkedIn (optional now)
        </h2>
        <input
          value={form.linkedinClientId}
          onChange={(e) => set("linkedinClientId", e.target.value)}
          placeholder="LinkedIn Client ID"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm font-mono"
        />
        <input
          type="password"
          value={form.linkedinClientSecret}
          onChange={(e) => set("linkedinClientSecret", e.target.value)}
          placeholder="LinkedIn Client Secret"
          className="w-full rounded-xl border border-cream-line px-4 py-3 text-sm font-mono"
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-coal py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save & continue"}
      </button>

      <p className="text-xs text-coal-dim">
        Everything is stored in{" "}
        <code className="font-mono">.data/admin-store.json</code> on your
        server — no cPanel env vars needed. You can change keys anytime in
        Settings.
      </p>
    </form>
  );
}
