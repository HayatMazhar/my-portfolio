"use client";

import { useCallback, useEffect, useState } from "react";
import { Suspense } from "react";
import LinkedInSettings from "@/components/admin/LinkedInSettings";

interface SettingsView {
  configured: boolean;
  siteUrl: string;
  groqApiKey: string;
  geminiApiKey: string;
  pineconeApiKey: string;
  cohereApiKey: string;
  linkedinClientId: string;
  linkedinClientSecret: string;
  linkedinRedirectUri: string;
  adminCronSecret: string;
  hasPassword: boolean;
  hasGroq: boolean;
  hasLinkedIn: boolean;
}

const SECRET_FIELDS = [
  "groqApiKey",
  "geminiApiKey",
  "pineconeApiKey",
  "cohereApiKey",
  "linkedinClientSecret",
  "adminCronSecret",
] as const;

type SecretField = (typeof SECRET_FIELDS)[number];

export default function AppSettingsForm() {
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [form, setForm] = useState({
    siteUrl: "",
    groqApiKey: "",
    geminiApiKey: "",
    pineconeApiKey: "",
    cohereApiKey: "",
    linkedinClientId: "",
    linkedinClientSecret: "",
    linkedinRedirectUri: "",
    adminCronSecret: "",
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkedin, setLinkedin] = useState({
    configured: false,
    connected: false,
    memberUrn: null as string | null,
    expiresAt: null as number | null,
  });

  const load = useCallback(async () => {
    const [settingsRes, linkedinRes] = await Promise.all([
      fetch("/api/admin/settings"),
      fetch("/api/admin/linkedin/status"),
    ]);
    const settingsJson = (await settingsRes.json()) as {
      settings?: SettingsView;
    };
    const linkedinJson = (await linkedinRes.json()) as typeof linkedin & {
      configured?: boolean;
    };

    if (settingsJson.settings) {
      setSettings(settingsJson.settings);
      setForm((f) => ({
        ...f,
        siteUrl: settingsJson.settings!.siteUrl,
        linkedinClientId: settingsJson.settings!.linkedinClientId,
        linkedinRedirectUri: settingsJson.settings!.linkedinRedirectUri,
        groqApiKey: "",
        geminiApiKey: "",
        pineconeApiKey: "",
        cohereApiKey: "",
        linkedinClientSecret: "",
        adminCronSecret: "",
      }));
    }

    setLinkedin({
      configured: Boolean(linkedinJson.configured),
      connected: Boolean(linkedinJson.connected),
      memberUrn: linkedinJson.memberUrn ?? null,
      expiresAt: linkedinJson.expiresAt ?? null,
    });
  }, []);

  useEffect(() => {
    load().catch(() => setError("Failed to load settings."));
  }, [load]);

  function setField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string; settings?: SettingsView };
      if (!res.ok) {
        setError(data.error || "Save failed.");
        return;
      }
      if (data.settings) setSettings(data.settings);
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
      setMessage("Settings saved.");
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateCron() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateCronSecret: "true" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Failed.");
        return;
      }
      setMessage("New cron secret generated.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return <p className="text-sm text-coal-dim">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-6">
        <section className="rounded-2xl border border-cream-line bg-white p-6">
          <h2 className="font-jakarta text-lg font-bold text-coal">General</h2>
          <label className="mt-4 block text-sm font-medium text-coal-soft">
            Site URL
          </label>
          <input
            value={form.siteUrl}
            onChange={(e) => setField("siteUrl", e.target.value)}
            className="mt-1 w-full rounded-xl border border-cream-line px-4 py-3 text-sm"
          />
        </section>

        <section className="rounded-2xl border border-cream-line bg-white p-6 space-y-4">
          <h2 className="font-jakarta text-lg font-bold text-coal">AI keys</h2>
          <p className="text-sm text-coal-muted">
            Stored on your server. Secret fields are blank — enter a new value
            only when you want to replace the saved key.
          </p>
          {(
            [
              ["groqApiKey", "Groq (LinkedIn drafts)", true],
              ["geminiApiKey", "Gemini (RAG embed)", false],
              ["pineconeApiKey", "Pinecone (vectors)", false],
              ["cohereApiKey", "Cohere (rerank)", false],
            ] as const
          ).map(([key, label, required]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-coal-soft">
                {label}
              </label>
              {settings[key as SecretField] && (
                <p className="mt-1 text-xs text-mint-800">
                  Saved: {settings[key as SecretField]}
                </p>
              )}
              <input
                type="password"
                value={form[key]}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={
                  required
                    ? settings.hasGroq
                      ? "Paste new Groq key to replace saved key"
                      : "Required — get a free key at console.groq.com"
                    : "Optional"
                }
                className="mt-1 w-full rounded-xl border border-cream-line px-4 py-3 font-mono text-sm"
              />
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-cream-line bg-white p-6 space-y-4">
          <h2 className="font-jakarta text-lg font-bold text-coal">LinkedIn app</h2>
          <div>
            <label className="block text-sm font-medium text-coal-soft">
              Client ID
            </label>
            <input
              value={form.linkedinClientId}
              onChange={(e) => setField("linkedinClientId", e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-line px-4 py-3 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coal-soft">
              Client Secret
            </label>
            <input
              type="password"
              value={form.linkedinClientSecret}
              onChange={(e) => setField("linkedinClientSecret", e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-line px-4 py-3 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coal-soft">
              OAuth redirect URI
            </label>
            <input
              value={form.linkedinRedirectUri}
              onChange={(e) => setField("linkedinRedirectUri", e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-line px-4 py-3 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-coal-dim">
              Add this exact URL in your LinkedIn developer app.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-cream-line bg-white p-6 space-y-4">
          <h2 className="font-jakarta text-lg font-bold text-coal">Security</h2>
          <div>
            <label className="block text-sm font-medium text-coal-soft">
              Cron secret (scheduled posts)
            </label>
            <input
              type="password"
              value={form.adminCronSecret}
              onChange={(e) => setField("adminCronSecret", e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-line px-4 py-3 font-mono text-sm"
            />
            <button
              type="button"
              onClick={regenerateCron}
              disabled={busy}
              className="mt-2 text-sm text-mint-700 hover:underline disabled:opacity-60"
            >
              Generate new cron secret
            </button>
            <p className="mt-2 text-xs text-coal-dim">
              cPanel cron:{" "}
              <code className="font-mono">
                curl -X POST -H &quot;Authorization: Bearer SECRET&quot;{" "}
                {form.siteUrl || settings.siteUrl}/api/admin/cron/publish-scheduled
              </code>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setField("currentPassword", e.target.value)}
              placeholder="Current password (to change)"
              className="rounded-xl border border-cream-line px-4 py-3 text-sm"
            />
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setField("newPassword", e.target.value)}
              placeholder="New password (min 8 chars)"
              className="rounded-xl border border-cream-line px-4 py-3 text-sm"
            />
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && (
          <p className="rounded-xl bg-mint-50 px-4 py-3 text-sm text-mint-800">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-coal px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>

      <Suspense fallback={<p className="text-sm text-coal-dim">Loading LinkedIn…</p>}>
        <LinkedInSettings
          configured={linkedin.configured}
          connected={linkedin.connected}
          memberUrn={linkedin.memberUrn}
          expiresAt={linkedin.expiresAt}
        />
      </Suspense>
    </div>
  );
}
