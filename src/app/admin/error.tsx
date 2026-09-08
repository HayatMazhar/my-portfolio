"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h1 className="font-jakarta text-xl font-bold text-coal">
        Admin failed to load
      </h1>
      <p className="mt-3 text-sm text-coal-muted">
        This usually happens after a rebuild while the old server is still
        running. Restart the app, then hard-refresh the page.
      </p>
      <p className="mt-2 font-mono text-xs text-red-700">{error.message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-coal px-4 py-2.5 text-sm font-bold text-white"
        >
          Try again
        </button>
        <Link
          href="/admin/login"
          className="rounded-xl border border-cream-line px-4 py-2.5 text-sm text-coal-muted"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
