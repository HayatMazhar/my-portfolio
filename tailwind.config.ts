import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — driven by CSS variables (see globals.css).
        // Light is the default (:root); `.dark`/`.theme-dark` swap the values.
        // This keeps every opacity modifier (bg-signal/10, etc.) working.
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          alt: "rgb(var(--ink-alt) / <alpha-value>)",
          card: "rgb(var(--ink-card) / <alpha-value>)",
          elev: "rgb(var(--ink-elev) / <alpha-value>)",
          line: "rgb(var(--ink-line) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          muted: "rgb(var(--paper-muted) / <alpha-value>)",
          dim: "rgb(var(--paper-dim) / <alpha-value>)",
        },
        signal: {
          DEFAULT: "rgb(var(--signal) / <alpha-value>)",
          dim: "rgb(var(--signal-dim) / <alpha-value>)",
          glow: "rgba(0, 255, 136, 0.18)",
          fade: "rgba(0, 255, 136, 0.06)",
        },
        amber: {
          signal: "#ffb84d",
        },
        // ── /v2 light theme palette ────────────────────────────────────
        mint: {
          50: "#f3fbf7",
          100: "#e3f6ec",
          200: "#c4ecd6",
          300: "#9fdfbb",
          400: "#6dcc99",
          500: "#3fb578",
          600: "#2d9961",
          700: "#26794e",
          800: "#1f6041",
          900: "#1a4d36",
        },
        cream: {
          DEFAULT: "#fafaf7",
          warm: "#f6f5f0",
          line: "#e9e8e3",
        },
        coal: {
          DEFAULT: "#0e0e0d",
          soft: "#262624",
          muted: "#525251",
          dim: "#9a9a96",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-instrument)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
        // /v2 fonts
        jakarta: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      boxShadow: {
        "signal-sm": "0 0 12px rgba(0, 255, 136, 0.18)",
        signal: "0 0 28px rgba(0, 255, 136, 0.22)",
        "signal-lg": "0 0 56px rgba(0, 255, 136, 0.30)",
        "inset-line": "inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
      },
      animation: {
        "pulse-signal": "pulse-signal 2.4s ease-in-out infinite",
        "ticker": "ticker 40s linear infinite",
        "blink": "blink 1s steps(2, start) infinite",
        "scan": "scan 8s linear infinite",
        "draw": "draw 1.5s ease-out forwards",
        "dash": "dash 2.5s linear infinite",
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
      keyframes: {
        "pulse-signal": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(0, 255, 136, 0.55)",
          },
          "50%": {
            boxShadow: "0 0 0 14px rgba(0, 255, 136, 0)",
          },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          to: { opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        draw: {
          to: { strokeDashoffset: "0" },
        },
        dash: {
          to: { strokeDashoffset: "-24" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
