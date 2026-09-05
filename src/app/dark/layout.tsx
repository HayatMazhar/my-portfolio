import type { Metadata } from "next";
import { PERSONAL } from "@/data/cv";

export const metadata: Metadata = {
  title: `${PERSONAL.name} — Portfolio (Dark Edition)`,
  description:
    "The original dark / Signal-themed version of Mazhar's portfolio. The default site now uses the Studio (light) theme.",
};

export default function DarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `theme-dark` scopes the dark design tokens to this subtree only, so the
  // dark showcase stays dark no matter the global (light) theme — and, unlike
  // the old next-themes approach, it can't persist "dark" back onto the site.
  return (
    <div className="theme-dark min-h-screen bg-ink text-paper antialiased noise">
      {children}
    </div>
  );
}
