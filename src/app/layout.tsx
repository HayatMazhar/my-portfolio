import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PERSONAL } from "@/data/cv";
import { ChatProvider } from "@/components/AiChat/ChatContext";
import ScrollProgress from "@/components/ScrollProgress";
import ThemeProvider from "@/components/ThemeProvider";
import VisitPulse from "@/components/VisitPulse";
import EasterEgg from "@/components/EasterEgg";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});

// Light-theme display font (used by /v2)
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Hand-drawn accent font (used by /v2 squiggle labels)
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mazharhayat.live";

const SHORT_DESCRIPTION =
  "AI Solutions Architect (15+ yrs) shipping production RAG, NL-to-SQL, and Vision AI systems. This site runs RAG on itself — try the live demo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${PERSONAL.name} — ${PERSONAL.title}`,
  description: SHORT_DESCRIPTION,
  keywords: [
    "AI Solutions Architect",
    "LLM",
    "RAG",
    "Azure OpenAI",
    "GPT-4",
    "Vector Search",
    "Conversational AI",
    "Mazhar Hayat",
    "Abu Dhabi",
    "UAE",
  ],
  authors: [{ name: PERSONAL.name, url: SITE_URL }],
  creator: PERSONAL.name,
  openGraph: {
    title: `${PERSONAL.name} — ${PERSONAL.title}`,
    description: SHORT_DESCRIPTION,
    url: SITE_URL,
    siteName: `${PERSONAL.name} — Portfolio`,
    type: "website",
    locale: "en_US",
    // /opengraph-image.tsx is auto-detected by Next.js
  },
  twitter: {
    card: "summary_large_image",
    title: `${PERSONAL.name} — ${PERSONAL.title}`,
    description: SHORT_DESCRIPTION,
    creator: "@mazharhayyat",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${plusJakarta.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ScrollProgress />
        <ThemeProvider>
        <ChatProvider>{children}</ChatProvider>
        </ThemeProvider>
        <VisitPulse />
        <EasterEgg />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
