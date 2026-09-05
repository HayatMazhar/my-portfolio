"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      // Bumped key: resets any visitor stuck on a previously-persisted
      // "dark" preference (the old /dark route used to leak it globally),
      // so everyone starts on the light theme that matches the homepage.
      storageKey="mh-theme-2026"
    >
      {children}
    </NextThemesProvider>
  );
}
