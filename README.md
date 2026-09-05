# Mazhar Hayat — AI-First Portfolio

A production portfolio that **runs RAG on itself**. Live at
[mazharhayat.live](https://mazharhayat.live/).

> **The entire site costs $0/month to run.** Every AI feature included.
> See [`/stack`](https://mazharhayat.live/stack) for the full receipt.

---

## What's in it

This is more than a "résumé with animations." Every feature was built to
demonstrate a real production engineering decision:

| Feature | Demonstrates |
|---|---|
| **Live RAG demo** with sandbox controls (`top_k`, rerank toggle, model picker) | Production RAG with cross-encoder reranking |
| **AI Fit Analyser** (`/fit`) — paste a JD, get a structured fit report | Structured-output prompting, JSON schemas |
| **Playground** (`/playground`) — paste your own document, ask anything | Grounded document AI |
| **Per-project AI chat** scoped to each case study | Multi-context RAG architecture |
| **Embedding Explorer** (`/embeddings`) — 2D projection of the CV corpus | Vector-space visualisation |
| **Case studies** (`/projects/[slug]`) with narrative timeline, decisions, lessons, quotes | Engineering judgement |
| **/for-recruiters** — 30-second pitch landing page | Recruiter-empathy + content design |
| **/timeline** — 15-year career story | Visual storytelling |
| **/uses** — exact hardware/editor/methodology | Transparency |
| **/ar** — Arabic / RTL landing page | Bilingual first-class support |
| **Smart 404** with AI ask CTA | Conversion-focused error handling |
| **Cmd+K palette**, dark/light mode, scroll progress, animated SVG diagrams, OG images per route | UX polish |

---

## Architecture

```
   ┌─────────────────────────────────────────────────────────┐
   │  Next.js 14 (App Router) — Static + RSC + Edge OG       │
   └─────────────────────────────────────────────────────────┘
              │
              ├── /api/chat           ─── Groq GPT-OSS 120B  (streaming)
              ├── /api/chat/followups ─── Groq GPT-OSS 20B
              ├── /api/rag-demo       ─── Gemini embed → Pinecone → Cohere rerank → Groq
              ├── /api/fit            ─── Groq + structured JSON output
              ├── /api/playground     ─── Groq (no RAG, doc-grounded)
              ├── /api/project-chat   ─── Groq scoped to a project context
              └── /api/subscribe      ─── Optional Buttondown forward
```

### The $0 stack

| Service | Role | Cost |
|---|---|---|
| Netlify | Hosting · CDN · CI | Free |
| Pinecone (serverless) | Vector index for CV chunks | Free starter |
| Google Gemini | Embeddings (`gemini-embedding-001`, 3072d) | Free tier |
| Groq | LLM inference (GPT-OSS 120B + GPT-OSS 20B) | Free tier |
| Cohere | Cross-encoder reranking (`rerank-v3.5`) | Trial tier (1K calls/mo) |
| **Total** | | **$0/month** |

---

## Running locally

```bash
git clone https://github.com/mazhar1790/portfolio.git
cd portfolio
npm install
cp .env.example .env.local
# Fill .env.local with your own API keys (Groq, Gemini, Pinecone, Cohere)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

```env
GROQ_API_KEY=...          # https://console.groq.com
GEMINI_API_KEY=...        # https://aistudio.google.com/apikey
PINECONE_API_KEY=...      # https://app.pinecone.io
COHERE_API_KEY=...        # https://dashboard.cohere.com  (optional, for rerank)
BUTTONDOWN_API_KEY=...    # optional, for email subscribers
NEXT_PUBLIC_SITE_URL=...  # optional, overrides the canonical origin
```

### Seeding the RAG corpus

After editing `src/data/rag-corpus.ts`:

```bash
node scripts/seed-pinecone.mjs
```

This embeds each chunk with Gemini and upserts to your Pinecone index.

---

## Deploying

The AI routes stream from the server, so this needs a Node host — a static
export will not work.

**mazharhayat.live** runs as a cPanel Node.js app (LiteSpeed + Passenger).
To ship a new revision, from the application root set in *Setup Node.js App*:

```bash
git pull origin master
npm ci
npm run build
```

Then hit **Restart** in *Setup Node.js App*. API keys live in that same
screen's environment-variable panel, not in a committed `.env`.

Netlify builds the same commit automatically via `netlify.toml`, which is
useful as a staging target and as a fallback host.

After changing the public origin, re-run `node scripts/seed-pinecone.mjs` so
the RAG corpus stops citing the old URL.

---

## Fork it

You're welcome to fork this and use it as a starting point for your own
portfolio. The structure that matters:

```
src/
├── app/
│   ├── api/                # All AI routes
│   ├── projects/[slug]/    # Dynamic case study pages
│   ├── for-recruiters/     # Recruiter landing
│   ├── stack/              # Cost transparency
│   ├── fit/                # JD fit analyser
│   ├── playground/         # Paste-your-doc AI
│   ├── embeddings/         # Vector viz
│   ├── timeline/           # Career timeline
│   ├── ar/                 # Arabic / RTL
│   ├── uses/               # /uses page
│   └── opengraph-image.tsx # Dynamic OG card
├── components/             # Hero, RagDemo, ProjectChat, etc.
├── data/
│   ├── cv.ts               # All editable content
│   ├── rag-corpus.ts       # RAG knowledge chunks
│   └── ...
└── lib/og-template.tsx     # Reusable OG image template
```

**To customise:** edit `src/data/cv.ts` and `src/data/rag-corpus.ts`, swap
imagery, update environment variables, and deploy.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| LLM inference | Groq SDK |
| Embeddings | Google Generative AI SDK |
| Vector DB | Pinecone serverless |
| Reranking | Cohere SDK |
| Icons | Lucide React |
| Fonts | Instrument Serif · Inter · JetBrains Mono |

---

## License

MIT. Use freely; please don't pass off the bio content as your own.

---

Built by [Mazhar Hayat](https://www.linkedin.com/in/mazharhayyat/) — Abu Dhabi.
