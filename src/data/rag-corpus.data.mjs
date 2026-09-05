/**
 * Single source of truth for the RAG knowledge corpus.
 *
 * This is a plain-data ES module (no TypeScript) so it can be imported by BOTH:
 *   - the Next.js app (via `src/data/rag-corpus.ts`, which adds types), and
 *   - the plain-Node seed script (`scripts/seed-pinecone.mjs`, run with `node`).
 *
 * Keeping the data here means the live RAG demo and the Pinecone seed can never
 * drift out of sync. Edit chunks HERE.
 *
 * Each chunk is a discrete, retrievable unit — embedded once, queried at runtime.
 * Keep chunks focused (one topic per chunk, ~200-400 tokens ideal).
 */

/** @typedef {{ id: string, category: string, title: string, content: string }} KnowledgeChunk */

/** @type {KnowledgeChunk[]} */
export const RAG_CORPUS_DATA = [
  // ── Identity & Summary ──────────────────────────────────────────────────
  {
    id: "identity-summary",
    category: "identity",
    title: "Who is Mazhar Hayat",
    content: `Mazhar Hayat is an AI Solutions Architect with 15+ years of experience building production-grade intelligent systems. He is based in Abu Dhabi, UAE and specializes in LLM integration, RAG architectures, and conversational AI. He works at SCAD (Statistics Centre Abu Dhabi) as the lead AI architect. His expertise spans deploying GPT-4, Azure OpenAI, and vector search solutions for government and enterprise environments. He has a proven track record of building scalable AI systems that reduce operational costs by 40%, process over 100,000 documents, and handle 15,000+ daily user interactions.`,
  },
  {
    id: "identity-contact",
    category: "identity",
    title: "Contact and location details",
    content: `Mazhar Hayat is located in Abu Dhabi, United Arab Emirates. His email is Mazhar1783@outlook.com. His phone number is +971 556 127 178. His LinkedIn profile is at https://www.linkedin.com/in/mazharhayyat/. He is currently open to senior AI architecture roles and consulting opportunities, available from June 2026.`,
  },

  // ── Projects ─────────────────────────────────────────────────────────────
  {
    id: "project-rag",
    category: "project",
    title: "Enterprise RAG Document Intelligence System",
    content: `At SCAD (Statistics Centre Abu Dhabi) in 2025, Mazhar designed and built an Enterprise RAG (Retrieval Augmented Generation) Document Intelligence System. The challenge was that analysts spent 2+ hours manually searching through 100,000+ policy and statistical documents. The solution used Azure OpenAI GPT-4o with a hybrid retrieval pipeline combining BM25 keyword search and Pinecone vector search, with Cohere cross-encoder re-ranking. Key results: document research time reduced from 2 hours to 10 seconds (95% reduction), 5,000+ queries processed monthly, 92% accuracy validated by domain experts, and GPT-4o API costs cut by 65% through intelligent context compression. The system processes documents in both Arabic and English.`,
  },
  {
    id: "project-nl-sql",
    category: "project",
    title: "Intelligent Conversational Analytics Platform (NL-to-SQL)",
    content: `Mazhar built an Intelligent Conversational Analytics Platform at SCAD from 2023 onwards. This natural language to SQL system enables 200+ non-technical staff to query complex databases using plain English or Arabic — no SQL knowledge required. The system achieves 85%+ query accuracy through multi-shot prompting, schema-aware context injection, and query validation layers. It handles 18,000+ queries per month. The platform democratized data access across the organization and reduced reliance on data analysts for ad-hoc reporting by 70%.`,
  },
  {
    id: "project-vision",
    category: "project",
    title: "Document Processing & Vision AI Pipeline",
    content: `In 2025, Mazhar architected a Document Processing and Vision AI Pipeline at SCAD that processes scanned government documents using Azure Document Intelligence and GPT-4 Vision. The pipeline handles tables, handwritten text, Arabic/English mixed content, and complex form layouts. It saves 2,000 staff hours every month by automating data extraction that was previously done manually. The system integrates with SCAD's data warehouse and triggers downstream analytics workflows.`,
  },
  {
    id: "project-chatbot",
    category: "project",
    title: "AI Conversational Chatbot handling 18K+ monthly queries",
    content: `Mazhar built and deployed a production AI conversational chatbot that now handles over 18,000 queries per month. The chatbot serves SCAD staff and the public, answering questions about statistical publications, data definitions, and administrative processes. It uses Azure OpenAI with custom fine-tuning and retrieval augmentation for domain-specific knowledge. The system has a 94% user satisfaction rate and reduced support ticket volume by 60%.`,
  },

  // ── Skills & Expertise ────────────────────────────────────────────────────
  {
    id: "skills-ai-llm",
    category: "skills",
    title: "AI and LLM expertise",
    content: `Mazhar's core AI expertise includes: GPT-4/GPT-4o, GPT-3.5-Turbo, Claude 3.5/3.7, Azure OpenAI Service, LangChain, LlamaIndex, RAG (Retrieval Augmented Generation) architecture, vector embeddings, semantic search, prompt engineering, fine-tuning, function calling, structured output generation, AI agent orchestration, chain-of-thought prompting, and multi-modal AI (vision + text).`,
  },
  {
    id: "skills-vector-db",
    category: "skills",
    title: "Vector databases and search infrastructure",
    content: `Mazhar has production experience with Pinecone, Azure AI Search, PostgreSQL pgvector, and Weaviate for vector search. He has implemented hybrid retrieval systems combining dense vector search with sparse BM25/TF-IDF keyword search using Reciprocal Rank Fusion. He has built re-ranking pipelines using Cohere Rerank v3 and cross-encoder models.`,
  },
  {
    id: "skills-fullstack",
    category: "skills",
    title: "Full-stack development skills",
    content: `Mazhar is proficient in full-stack development with: C# and ASP.NET Core (15+ years), Next.js 14 with TypeScript, React, Node.js, Python (FastAPI, Flask), SQL Server, PostgreSQL, Entity Framework, REST APIs, and Azure cloud services (Azure OpenAI, Azure Functions, Azure Container Apps, Azure Document Intelligence, Azure Storage).`,
  },
  {
    id: "skills-architecture",
    category: "skills",
    title: "Architecture and enterprise systems",
    content: `Mazhar's architecture expertise covers: microservices design, event-driven architecture, API gateway patterns, multi-tenant SaaS systems, secure government-grade data pipelines, CI/CD with Azure DevOps, Docker/Kubernetes, and enterprise integration patterns. He has designed systems handling 15,000+ daily active users with 99.9% uptime.`,
  },

  // ── Experience ────────────────────────────────────────────────────────────
  {
    id: "experience-scad",
    category: "experience",
    title: "Current role at SCAD",
    content: `Mazhar Hayat currently works at SCAD — Statistics Centre Abu Dhabi as an AI Solutions Architect and Senior Software Engineer. He has been there since approximately 2010, accumulating 15+ years. At SCAD he leads AI/LLM initiatives including the RAG system, NL-to-SQL platform, vision pipeline, and conversational chatbot. SCAD is a government statistical authority in the Emirate of Abu Dhabi.`,
  },
  {
    id: "experience-impact",
    category: "experience",
    title: "Career impact and key achievements",
    content: `Key career achievements by Mazhar Hayat: reduced document research time from 2 hours to 10 seconds with RAG system; built AI chatbot now handling 18,000+ queries per month; enabled 200+ non-technical staff to query databases in plain English; deployed vision AI pipeline saving 2,000 staff hours every month; reduced GPT-4 API costs by 38% through context compression; built systems serving 500+ daily users; processed 100,000+ documents through AI pipelines.`,
  },

  // ── Training & programs ────────────────────────────────────────────────────
  {
    id: "training",
    category: "training",
    title: "Microsoft training & development programs",
    content: `Training and AI/Azure programs Mazhar has completed: (1) Microsoft AI Developer Program — a Microsoft Official Course delivered by Skillsoft Global Knowledge, attended 25 August – 30 September 2025, covering Azure AI services, Copilot Studio, prompt engineering, RAG, and responsible AI; a Microsoft Certificate of Achievement was issued for completion. (2) Azure AI Engineer (AI-102) learning path — full curriculum completed via Microsoft Learn (Azure OpenAI, Cognitive Services, knowledge mining, conversational AI); applied directly in production at SCAD. (3) Azure Solutions Architect (AZ-305) learning path — full curriculum completed via Microsoft Learn. Important: these are training-program completions; Mazhar has not yet sat the AI-102 or AZ-305 certification exams. The knowledge is applied daily in production but the formal exam credentials are not held.`,
  },

  // ── Differentiators ───────────────────────────────────────────────────────
  {
    id: "differentiators",
    category: "approach",
    title: "What makes Mazhar different from other AI engineers",
    content: `What sets Mazhar apart: First, he has shipped production AI systems (not just demos) — his RAG system runs 24/7 in a government environment with real accountability. Second, he bridges AI and full-stack engineering — he designs the AI pipeline AND builds the application around it. Third, he works in government/enterprise contexts where reliability, security, and Arabic language support matter more than novelty. Fourth, he has a 15-year foundation in software architecture that prevents common AI-hype mistakes. Fifth, he measures outcomes: every project he describes has concrete metrics (time saved, cost reduced, accuracy achieved).`,
  },
  {
    id: "operating-principles",
    category: "approach",
    title: "Working principles and philosophy",
    content: `Mazhar's core operating principles: (1) Measure or it didn't happen — every AI feature ships with baseline metrics and a clear definition of success. (2) RAG beats fine-tuning for enterprise knowledge — knowledge changes faster than models can be retrained. (3) The bottleneck is never the model — it's chunking strategy, retrieval quality, and prompt design. (4) Arabic-first design — government systems in the UAE must handle Arabic as a primary language, not an afterthought. (5) Boring infrastructure wins — proven Azure services over cutting-edge but unstable open-source alternatives for production.`,
  },

  // ── What he's working on now ──────────────────────────────────────────────
  {
    id: "current-focus",
    category: "current",
    title: "Current work and interests",
    content: `Currently Mazhar is focused on: extending his RAG system with multi-hop reasoning across document chains, building agentic workflows where AI systems take actions (not just answer questions), exploring structured output extraction from Arabic-English mixed government forms, and publishing technical writing about production AI lessons. He is also available for senior AI architecture roles and consulting from June 2026.`,
  },

  // ── Portfolio site ────────────────────────────────────────────────────────
  {
    id: "portfolio-site",
    category: "meta",
    title: "About this portfolio site",
    content: `This portfolio website was built by Mazhar Hayat using Next.js 14, TypeScript, Tailwind CSS, and Framer Motion. It features an AI chat widget, a live RAG demo with sandbox controls (top_k, rerank toggle, model picker), Cmd+K command palette, dark/light mode, /for-recruiters page, /stack transparency page, /ar Arabic landing page, /playground for paste-your-own-doc queries, and a /fit AI feature for comparing a job description against the CV. Source code: github.com/mazhar1790/portfolio. Live at mazharhayat.live.`,
  },

  // ── $0 stack and infrastructure ────────────────────────────────────────────
  {
    id: "stack-cost",
    category: "meta",
    title: "The $0/month tech stack powering this portfolio",
    content: `This entire portfolio runs at $0/month — every AI feature included. The stack: Next.js 14 (open source), Netlify hosting (free starter tier, 100GB bandwidth), GitHub (free), Pinecone serverless (free starter, one index with ~36 CV chunks), Google Gemini embeddings (gemini-embedding-001, 3072 dimensions, free tier 1500 RPD), Groq inference (GPT-OSS 120B + GPT-OSS 20B, free tier with sub-second latency), Cohere reranking (rerank-v3.5, 1000 calls/month free), and Vercel Analytics & Speed Insights (free). Total monthly cost: $0. See /stack for the full breakdown.`,
  },
  {
    id: "stack-principles",
    category: "approach",
    title: "Engineering principles behind the $0 stack",
    content: `The stack composition demonstrates Mazhar's engineering principles: (1) Best-of-tier for each job — Groq for fast LLM, Cohere for rerank, Pinecone for vectors, Gemini for embeddings. Each is independently the best in its category and they compose cleanly. (2) Graceful degradation — if Cohere is missing the API falls back to pure vector retrieval. If any key is missing the feature degrades but the site never breaks. (3) Cost discipline — even if traffic pushed a tier, the next step is $20-50/month, still cheaper than one hour of a human analyst. (4) Show, don't tell — exposing the cost trade-offs publicly is itself a signal of engineering judgement.`,
  },

  // ── Availability and what he's looking for ─────────────────────────────────
  {
    id: "looking-for",
    category: "current",
    title: "What Mazhar is looking for next",
    content: `Mazhar is open to: Senior AI / LLM / ML Engineering Architect roles, Principal-track or hands-on tech lead positions, consulting engagements on RAG / NL-to-SQL / document AI, remote or hybrid (Abu Dhabi / Dubai), or relocation for the right opportunity. He is NOT looking for: pure research/academic roles, junior or mid-level IC positions, crypto / Web3 / NFT projects, or sales engineering / pre-sales. Notice period: 30 days. Visa status: UAE residency, transferable. Languages: English (fluent), Urdu (native), Arabic (working).`,
  },
  {
    id: "recruiter-pitch",
    category: "current",
    title: "Elevator pitch for recruiters",
    content: `30-second pitch: AI Solutions Architect with 15+ years building production software, last 3 years deep on LLMs, RAG, and agentic systems. Mazhar ships — every project he describes has metrics and is running in front of real users at a UAE government statistics authority (SCAD). Strengths: production AI (not demos), full-stack foundation, enterprise context (security, reliability, Arabic), and measurement discipline (he doesn't ship until the numbers say it's ready). Best contact: email Mazhar1783@outlook.com or LinkedIn. See /for-recruiters for a structured summary.`,
  },

  // ── Beefed-up case study details ───────────────────────────────────────────
  {
    id: "case-rag-timeline",
    category: "project",
    title: "How the RAG document intelligence system was built (timeline)",
    content: `The RAG document intelligence system at SCAD was built in 5 phases over 3 months. Phase 1 (Weeks 1-2): discovery — interviewed 12 analysts across 4 departments and discovered 60% of queries were semantic, not keyword-based. Phase 2 (Weeks 3-6): three prototypes; the first two failed; v3 combined hybrid retrieval + reranking and crossed 85% accuracy. Phase 3 (Weeks 7-8): built a 200-question gold-standard evaluation harness with domain experts. Phase 4 (Weeks 9-12): production hardening — citations, Arabic, permissions, observability. Phase 5 (Month 4+): launched soft to 20 analysts, then org-wide. Cost dropped 65% over 6 months through prompt and context optimization.`,
  },
  {
    id: "case-rag-decisions",
    category: "project",
    title: "Key architecture decisions in the RAG system",
    content: `Four critical decisions in the RAG system: (1) Hybrid retrieval (BM25 + vector) over pure semantic — pure vector missed exact terms like numbers and acronyms; RRF fusion lifted NDCG@5 by 14 points. (2) Semantic chunking over fixed-token chunking — splitting on section boundaries improved accuracy by ~20% before touching the model. (3) Cross-encoder reranking with Cohere rerank-v3 — reduced GPT-4 context window costs by 65% while improving precision. (4) Citation-by-default in the prompt — structured [SOURCE:doc_id,page_n] tagging turned the system from "helpful" to "trustworthy."`,
  },
  {
    id: "case-nl-sql-decisions",
    category: "project",
    title: "Key architecture decisions in the NL-to-SQL platform",
    content: `Key decisions in the conversational analytics platform: (1) Schema-aware context injection over fine-tuning — dynamic schema injection means the system updates when the database does, with zero retraining. (2) Read-only DB user with row-level security — defence in depth means even a prompt-injected model cannot mutate data or cross tenants. (3) Execution-aware repair loop — when generated SQL fails, the error goes back to the model with schema context for a corrected attempt; this lifted accuracy by 13 points (from 72% to 85%).`,
  },
  {
    id: "case-vision-decisions",
    category: "project",
    title: "Key architecture decisions in the Vision AI pipeline",
    content: `Key decisions in the Vision AI pipeline: (1) Azure Document Intelligence + GPT-4 Vision (not just one) — ADI handles structured forms cheaply; GPT-4V handles unstructured chaos; routing by document type uses each model where it's strongest. (2) Per-field confidence scores — without per-field confidence the only options are "trust everything" or "review everything"; confidence-gated review is what makes 80% automation safe. (3) Strict JSON schema output — downstream systems break on shape changes; schema-enforced output prevents silent extraction errors from corrupting the data warehouse.`,
  },
  {
    id: "lessons-production-ai",
    category: "approach",
    title: "Lessons learned from shipping production AI",
    content: `Lessons Mazhar took from shipping production AI systems: (1) Evaluation infrastructure pays for itself within a month — build it first, not last. (2) Users prefer accurate uncertainty over confident hallucination — teach the model to say "I don't know." (3) Chunking strategy and prompt design move the needle 10x more than picking the latest model. (4) The repair loop (errors fed back to the model) is more powerful than picking a bigger model. (5) Schema design matters more than prompt design — bad column names break the model long before bad prompts do. (6) Two models with clear routing beat one expensive model trying to do everything. (7) Confidence scoring is the unsung hero of human-in-loop AI. (8) Arabic handwriting is still hard — reviewer UX matters more than chasing the last 5% accuracy.`,
  },

  // ── Stakeholder quotes ─────────────────────────────────────────────────────
  {
    id: "testimonial-rag",
    category: "experience",
    title: "Stakeholder quote about the RAG system",
    content: `Senior Director of Digital Transformation at SCAD said: "Mazhar's RAG system gave us a year of analyst productivity back in three months. The numbers speak for themselves — and the architecture is clean enough that we extended it to two more departments without his help."`,
  },
  {
    id: "testimonial-nlsql",
    category: "experience",
    title: "Stakeholder quote about the analytics platform",
    content: `Head of Analytics at SCAD said: "He didn't ship until the numbers said it was ready. The platform changed how 200 people work — and the team that maintains it after Mazhar's involvement hasn't had to call him once in eight months." This demonstrates Mazhar's ability to build systems that survive his departure.`,
  },
  {
    id: "testimonial-vision",
    category: "experience",
    title: "Stakeholder quote about the Vision AI pipeline",
    content: `Operations Lead of the Census Programme at SCAD said: "The pipeline saves the team two thousand hours every single month. But the bigger win is the confidence dashboard — we can now point at any number in our reports and trace it back to the source document."`,
  },
];

// ── Shared index/embedding config (used by the app AND the seed script) ──────
export const CORPUS_NAMESPACE = "cv-knowledge";
export const PINECONE_INDEX_NAME = "portfolio-cv";
export const EMBEDDING_MODEL = "models/gemini-embedding-001"; // Gemini free tier
export const EMBEDDING_DIMENSIONS = 3072;
