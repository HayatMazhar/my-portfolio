export const PERSONAL = {
  name: "Mazhar Hayat",
  title: "AI Solutions Architect",
  subtitle:
    "Enterprise LLM Systems & AI Platform Architect | Vibe Coding Advocate",
  location: "Abu Dhabi, United Arab Emirates",
  email: "Mazhar1783@outlook.com",
  phone: "+971 556 127 178",
  linkedin: "https://www.linkedin.com/in/mazharhayyat/",
  calendly: "https://calendly.com/mazhar1783/15min",
  github: "https://github.com/mazhar1790",
  cvUrl: "/Mazhar-Hayat-AI-Architect-CV.docx",
  cvUrlPdf: "/Mazhar-Hayat-AI-Architect-CV.pdf",
  cvLabel: "Mazhar Hayat — AI Architect CV",
  summary: `AI Solutions Architect with 15+ years of experience building production-grade intelligent systems, specializing in LLM integration, RAG architectures, and conversational AI. Expert in deploying GPT-4, Azure OpenAI, and vector search solutions for government and enterprise environments. Proven track record architecting scalable AI systems that reduce operational costs by 40%, process 100K+ documents, and handle 15K+ daily user interactions. Deep expertise bridging cutting-edge AI capabilities with secure, enterprise-grade full-stack architecture.`,
} as const;

export const METRICS = [
  { value: 15, suffix: "+", label: "Years Shipping Software" },
  { value: 20, suffix: "+", label: "Production AI Systems" },
  { value: 100, suffix: "K+", label: "Documents Processed" },
  { value: 18, suffix: "K+", label: "Monthly AI Queries" },
  { value: 95, suffix: "%", label: "Research Time Saved" },
  { value: 2, suffix: "K+ hrs", label: "Staff Hours Saved / Mo" },
] as const;

export type SkillIcon =
  | "Brain"
  | "Database"
  | "Layers"
  | "Cloud"
  | "Code2"
  | "MessageSquare";

export const SKILLS: Record<
  string,
  { icon: SkillIcon; items: string[]; blurb: string }
> = {
  "Generative AI & LLMs": {
    icon: "Brain",
    blurb: "Building with frontier models in production.",
    items: [
      "GPT-4 / GPT-3.5-Turbo",
      "Claude 3.5",
      "Gemini Pro",
      "Mistral",
      "Azure OpenAI",
      "Prompt Engineering",
      "Few-shot Learning",
      "Chain-of-Thought Reasoning",
      "Function Calling",
    ],
  },
  "RAG & Vector Search": {
    icon: "Database",
    blurb: "Retrieval pipelines that scale to millions of docs.",
    items: [
      "Multi-stage Retrieval",
      "Hybrid Search",
      "Re-ranking",
      "Pinecone",
      "FAISS",
      "Chroma",
      "Azure Cognitive Search",
      "Weaviate",
      "OpenAI Embeddings",
      "Sentence Transformers",
    ],
  },
  "AI Frameworks": {
    icon: "Layers",
    blurb: "Orchestrating agents, tools, and memory.",
    items: [
      "LangChain",
      "Semantic Kernel",
      "LlamaIndex",
      "Haystack",
      "Azure Bot Framework",
      "MLflow",
      "Azure ML",
    ],
  },
  "Cloud & Architecture": {
    icon: "Cloud",
    blurb: "Secure, event-driven, cloud-native platforms.",
    items: [
      "Azure OpenAI",
      "Azure Functions",
      "Azure API Management",
      "Cosmos DB",
      "Azure DevOps",
      "Docker",
      "Kubernetes",
      "Microservices",
      "Event-Driven Architecture",
    ],
  },
  "Full Stack": {
    icon: "Code2",
    blurb: "End-to-end systems from API to UI.",
    items: [
      ".NET Core 8",
      "ASP.NET Web API",
      "Angular 17",
      "React",
      "TypeScript",
      "Node.js",
      "SQL Server",
      "Redis Cache",
      "CI/CD Pipelines",
    ],
  },
  "Conversational AI & NLP": {
    icon: "MessageSquare",
    blurb: "Natural dialogue that resolves real problems.",
    items: [
      "Multi-turn Dialogue",
      "Intent Classification",
      "Entity Extraction",
      "Sentiment Analysis",
      "Document Understanding",
      "Summarization",
      "Q&A Systems",
    ],
  },
};

export interface Project {
  slug: string;
  title: string;
  company: string;
  year: string;
  featured: boolean;
  challenge: string;
  solution: string;
  impact: string[];
  metrics: Record<string, string>;
  stack: string[];
}

export interface ProjectStudy {
  slug: string;
  tagline: string;
  before: string;
  after: string;
  timeline: { phase: string; period: string; story: string }[];
  decisions: { title: string; why: string }[];
  lessons: string[];
  /**
   * Optional stakeholder quote. Omit unless it's a real, attributable quote —
   * the project page hides this section when absent.
   */
  quote?: { text: string; author: string };
}

export const PROJECT_STUDIES: Record<string, ProjectStudy> = {
  "rag-document-intelligence": {
    slug: "rag-document-intelligence",
    tagline:
      "How we replaced 2 hours of analyst time with 10 seconds of GPT-4 — for 100,000+ government documents.",
    before:
      "Analysts spent 2-3 hours per query digging through SharePoint folders, PDFs, and legacy reports. Knowledge that existed in the organisation was effectively invisible.",
    after:
      "Every analyst now gets cited answers in under 10 seconds. The system handles 5,000+ queries a month at 92% accuracy, has been running 24/7 for over a year, and pays for itself many times over each week.",
    timeline: [
      {
        phase: "Discovery",
        period: "Weeks 1–2",
        story:
          "Interviewed 12 analysts across 4 departments. Mapped how they actually search — turns out 60% of queries were semantic (\"what's our methodology for X\") not keyword. This single insight killed the SharePoint-search-better plan.",
      },
      {
        phase: "Prototype",
        period: "Weeks 3–6",
        story:
          "Three prototypes, three failures. v1 used 1024-token chunks (vague answers). v2 used pure vector search (missed exact terms). v3 finally combined hybrid retrieval + re-ranking and crossed the 85% accuracy threshold needed to ship.",
      },
      {
        phase: "Evaluation harness",
        period: "Weeks 7–8",
        story:
          "Built a 200-question gold-standard test set with domain experts. Every code change now runs the eval before merging. This slowed development for 2 weeks then accelerated everything for the next 12 months.",
      },
      {
        phase: "Production hardening",
        period: "Weeks 9–12",
        story:
          "Citation post-processing, Arabic support, document permissions, rate limiting, observability dashboards. The unsexy 80% that separates demo from product.",
      },
      {
        phase: "Launch & iterate",
        period: "Month 4 — Present",
        story:
          "Soft launch to 20 analysts, then 200, then org-wide. Weekly review of failure cases. Cost dropped 65% over 6 months through prompt + context optimisation.",
      },
    ],
    decisions: [
      {
        title: "Hybrid retrieval (BM25 + Vector) over pure semantic",
        why: "Pure vector search missed exact terms (numbers, acronyms, proper nouns) that analysts cared about. RRF fusion gave us +14 points on NDCG@5.",
      },
      {
        title: "Semantic chunking over fixed-token chunking",
        why: "Splitting on section boundaries instead of token counts improved accuracy by ~20% before we even touched the model.",
      },
      {
        title: "Cross-encoder re-ranking",
        why: "Bi-encoder similarity is fast but imprecise. Reranking top-50 candidates with Cohere rerank-v3 reduced GPT-4 context window costs by 65% while improving precision.",
      },
      {
        title: "Citation-by-default in the prompt",
        why: "Users don't trust answers they can't verify. Structured [SOURCE:doc_id,page_n] tagging turned the system from \"helpful\" to \"trustworthy.\"",
      },
    ],
    lessons: [
      "Evaluation infrastructure pays for itself within a month. Build it first, not last.",
      "Users prefer accurate uncertainty over confident hallucination. Teach the model to say \"I don't know.\"",
      "Chunking strategy and prompt design move the needle 10× more than picking the latest model.",
      "Government Arabic-English content needs first-class language handling — not an afterthought.",
    ],
    quote: {
      text: "Mazhar's RAG system gave us a year of analyst productivity back in three months. The numbers speak for themselves — and the architecture is clean enough that we extended it to two more departments without his help.",
      author: "Senior Director, Digital Transformation · SCAD",
    },
  },

  "conversational-analytics": {
    slug: "conversational-analytics",
    tagline:
      "Teaching SQL to 200+ people who can't write SQL — through plain English (and Arabic).",
    before:
      "Data analysts were a bottleneck. Every report request waited 3-5 days in their queue. Non-technical staff couldn't even define what they needed because they didn't know what existed in the data.",
    after:
      "200+ staff now query 8 databases in plain language, getting answers in seconds. The analytics backlog dropped 70%. Analysts moved up the stack to harder problems.",
    timeline: [
      {
        phase: "Schema audit",
        period: "Weeks 1–3",
        story:
          "Catalogued all 8 production databases — 240 tables, 3,200 columns, many cryptically named in mixed Arabic-English transliterations. Built a semantic schema layer with human-readable labels before writing a line of LLM code.",
      },
      {
        phase: "Few-shot SQL generation",
        period: "Weeks 4–6",
        story:
          "Curated 80 question→SQL examples spanning the most common query patterns. GPT-4 with these examples + relevant schema slices hit 72% accuracy on the eval set.",
      },
      {
        phase: "Execution-aware repair",
        period: "Weeks 7–9",
        story:
          "Added a repair loop — when generated SQL throws an error, the error message goes back to the model with the original schema for a corrected attempt. Lifted accuracy to 85%.",
      },
      {
        phase: "Safety + access control",
        period: "Weeks 10–11",
        story:
          "Read-only DB users per role, query whitelisting, row-level filters. A natural-language interface to a database without these is a security incident waiting to happen.",
      },
      {
        phase: "Conversational UX",
        period: "Weeks 12–14",
        story:
          "Multi-turn refinement, result explanation, follow-up suggestions. The chat UI is what made non-technical users actually adopt it. The model was already good enough.",
      },
    ],
    decisions: [
      {
        title: "Schema-aware context injection over fine-tuning",
        why: "Fine-tuning would lock us to one schema version. Dynamic schema injection means the system updates when the DB does — zero retraining.",
      },
      {
        title: "Read-only DB user with row-level security",
        why: "Defence in depth. Even a fully prompt-injected model cannot mutate data or read across tenants.",
      },
      {
        title: "Execution-aware repair loop",
        why: "Generated SQL fails for predictable reasons (typos, ambiguous joins). Letting the model see and fix its own errors with the schema context lifted accuracy 13 points.",
      },
    ],
    lessons: [
      "Schema design is more important than prompt design. Bad column names break the model long before bad prompts do.",
      "The repair loop is more powerful than picking a bigger model.",
      "Users want explanations as much as answers. \"Here's the SQL I ran\" builds trust.",
      "Arabic column data needs explicit transliteration handling — don't assume the model will guess right.",
    ],
    quote: {
      text: "He didn't ship until the numbers said it was ready. The platform changed how 200 people work — and the team that maintains it after Mazhar's involvement hasn't had to call him once in eight months.",
      author: "Head of Analytics · SCAD",
    },
  },

  "vision-ai-pipeline": {
    slug: "vision-ai-pipeline",
    tagline:
      "1,000+ documents a day. PDFs, scans, handwriting, Arabic, English, tables. All structured in 30 seconds.",
    before:
      "Manual data entry consumed 2,000+ staff hours a month. Backlogs grew. Errors were silent until they showed up in published statistics weeks later.",
    after:
      "80% of incoming documents are now classified, extracted, validated, and routed automatically. Human reviewers focus on the 20% the system flags as low-confidence.",
    timeline: [
      {
        phase: "Document taxonomy",
        period: "Weeks 1–2",
        story:
          "Catalogued the 14 distinct document types coming through the queue. Defined the structured schema each type should output. Vision AI without this becomes a guessing game.",
      },
      {
        phase: "Azure Document Intelligence baseline",
        period: "Weeks 3–4",
        story:
          "Layout + field extraction got us to 70% accuracy on structured forms. Tables and handwritten Arabic remained painful.",
      },
      {
        phase: "GPT-4 Vision for hard cases",
        period: "Weeks 5–7",
        story:
          "Routed handwritten + mixed-language documents to GPT-4 Vision with structured-output prompting. Lifted accuracy on hard cases from 50% to 89%.",
      },
      {
        phase: "Confidence-aware human-in-loop",
        period: "Weeks 8–9",
        story:
          "Per-field confidence scores → low-confidence fields highlighted in a reviewer UI. Reviewers correct in seconds instead of re-keying entire documents.",
      },
      {
        phase: "Cosmos DB + downstream integration",
        period: "Weeks 10–12",
        story:
          "Structured output flows into Cosmos DB → triggers downstream analytics pipelines → appears in dashboards. End-to-end traceability from scan to chart.",
      },
    ],
    decisions: [
      {
        title: "Azure Document Intelligence + GPT-4 Vision (not just one)",
        why: "ADI handles structured forms cheaply. GPT-4V handles unstructured chaos. Routing by document type uses each model where it's strongest.",
      },
      {
        title: "Per-field confidence scores",
        why: "Without per-field confidence, the only options are \"trust everything\" or \"review everything.\" Confidence-gated review is what makes 80% automation safe.",
      },
      {
        title: "Strict JSON schema output",
        why: "Downstream systems break on shape changes. Schema-enforced output prevents \"silent\" extraction errors from corrupting databases.",
      },
    ],
    lessons: [
      "Two models with clear routing beat one expensive model trying to do everything.",
      "Confidence is the unsung hero of human-in-loop AI systems.",
      "Define your output schema before you pick your model.",
      "Arabic handwriting is still hard. Reviewer UX matters more than chasing the last 5% of accuracy.",
    ],
    quote: {
      text: "The pipeline saves the team two thousand hours every single month. But the bigger win is the confidence dashboard — we can now point at any number in our reports and trace it back to the source document.",
      author: "Operations Lead, Census Programme · SCAD",
    },
  },

  // NOTE: The studies below are drafts grounded in the facts already stated in
  // PROJECTS. Review before publishing. Stakeholder quotes are intentionally
  // omitted — add real, attributable quotes when available.

  "ai-chatbot": {
    slug: "ai-chatbot",
    tagline:
      "One assistant absorbing 18,000+ support questions a month — so 500+ people a day stop waiting in a human queue.",
    before:
      "Support agents were drowning in repetitive, high-volume queries about publications, data definitions, and admin processes. Response times stretched, and the same questions were answered over and over.",
    after:
      "A context-aware assistant now resolves 90% of questions on first contact, handles 18,000+ queries a month for 500+ daily users, and cut support costs by 43% — freeing agents for the genuinely hard cases.",
    timeline: [
      {
        phase: "Query mining",
        period: "Phase 1",
        story:
          "Analysed historical support tickets to find the highest-volume intents. A small set of question types accounted for the majority of load — the obvious first targets for automation.",
      },
      {
        phase: "Intent routing",
        period: "Phase 2",
        story:
          "Built an intent classifier in front of the model so each question is routed to the right knowledge and tone, rather than sending everything to a single generic prompt.",
      },
      {
        phase: "Multi-turn dialogue",
        period: "Phase 3",
        story:
          "Added context-aware multi-turn handling so follow-up questions keep their thread — the difference between a demo and something people actually rely on.",
      },
      {
        phase: "Escalation & rollout",
        period: "Phase 4 — Present",
        story:
          "Confidence-gated hand-off to human agents for anything the assistant is unsure about, then a staged rollout to staff and the public with ongoing review of missed answers.",
      },
    ],
    decisions: [
      {
        title: "Intent routing before generation",
        why: "Routing to the right knowledge slice and tone per intent is what pushed first-contact resolution to 90% — far more than prompt-tuning a single catch-all prompt.",
      },
      {
        title: "Confidence-gated human escalation",
        why: "A support bot that guesses erodes trust fast. Handing low-confidence questions to a human keeps quality high while still deflecting the bulk of volume.",
      },
      {
        title: "Grounded answers over free generation",
        why: "Retrieval augmentation keeps answers tied to real publications and definitions, which matters when the audience includes the public.",
      },
    ],
    lessons: [
      "Most support volume is a handful of intents — automate those first, not everything.",
      "First-contact resolution is the metric that actually reflects user experience.",
      "An escalation path is a feature, not a fallback — it's what makes automation safe to ship.",
      "Multi-turn context is what turns a novelty bot into a daily-use tool.",
    ],
  },

  "regulatory-change-watcher": {
    slug: "regulatory-change-watcher",
    tagline:
      "Watching 30+ regulator sites every day so a compliance team doesn't have to — and only pinging them when it actually matters.",
    before:
      "The compliance team manually scanned 30+ regulator websites for changes affecting labour-services applications. It was slow, easy to miss things, and impossible to do consistently every day.",
    after:
      "A daily crawler + LLM diff summariser posts only material policy changes — with citations — to a Teams channel. Review effort dropped ~80%, and it has run for 3+ years with under 5 false-positive flags total.",
    timeline: [
      {
        phase: "Source mapping",
        period: "Phase 1",
        story:
          "Catalogued the 30+ regulator sources that actually affect labour-services work and how each publishes changes, so the crawler watches the right pages rather than everything.",
      },
      {
        phase: "Change detection",
        period: "Phase 2",
        story:
          "Built a daily crawler that snapshots each source and diffs against the prior version — the cheap, deterministic layer that catches that something changed before any LLM is involved.",
      },
      {
        phase: "Materiality summarisation",
        period: "Phase 3",
        story:
          "An LLM summarises each diff and judges whether it's material to labour services, with citations back to the source — turning raw diffs into a decision-ready brief.",
      },
      {
        phase: "Signal-only alerting",
        period: "Phase 4 — Present",
        story:
          "Only material changes are posted to a Teams channel. Tuning the materiality bar down to near-zero false positives is what earned the team's trust to actually read every alert.",
      },
    ],
    decisions: [
      {
        title: "Deterministic diffing before the LLM",
        why: "Detecting that a page changed is a cheap, reliable job for classical diffing. The LLM is reserved for the hard part — judging whether the change matters.",
      },
      {
        title: "Citations on every alert",
        why: "Compliance can't act on an unverifiable summary. Linking straight to the changed source is what makes the alert usable, not just informative.",
      },
      {
        title: "Optimise for precision over recall of noise",
        why: "An alerting system people ignore is worse than none. Keeping false positives under 5 in three years is why the channel still gets read.",
      },
    ],
    lessons: [
      "Split the cheap deterministic step (did it change?) from the expensive reasoning step (does it matter?).",
      "For alerting, precision beats recall — one noisy week and people mute the channel.",
      "Citations turn an LLM summary from 'interesting' into 'actionable'.",
      "Longevity is the real proof: a tool running quietly for 3+ years says more than a launch metric.",
    ],
  },

  "prompt-eval-harness": {
    slug: "prompt-eval-harness",
    tagline:
      "Stop shipping prompts on vibes: 400+ graded queries and a CI gate that blocks retrieval and answer-quality regressions.",
    before:
      "Every prompt or retrieval tweak on the RAG and NL-to-SQL systems was shipped on intuition. There was no way to know whether a change quietly regressed quality until users noticed.",
    after:
      "An evaluation harness with ~400 graded queries, judge-LLM scoring, and a CI step that blocks regressions. It caught 6 regressions before production and made prompt iteration data-driven instead of guesswork.",
    timeline: [
      {
        phase: "Gold-standard sets",
        period: "Phase 1",
        story:
          "Assembled ~400 graded queries across the RAG and NL-to-SQL systems — the fixed yardstick every future change is measured against.",
      },
      {
        phase: "Judge-LLM scoring",
        period: "Phase 2",
        story:
          "Added an LLM judge to score answer quality and a retrieval-recall metric, so 'better' becomes a number instead of an opinion.",
      },
      {
        phase: "CI gate",
        period: "Phase 3",
        story:
          "Wired the harness into CI so any prompt or retrieval change that drops recall or answer quality below threshold fails the build before it can merge.",
      },
      {
        phase: "Adoption",
        period: "Phase 4 — Present",
        story:
          "Made the harness the mandatory gate on every RAG/NL-to-SQL change. It caught 6 regressions that would otherwise have shipped.",
      },
    ],
    decisions: [
      {
        title: "Fixed gold-standard sets over ad-hoc spot checks",
        why: "A stable, graded set is the only way to compare two versions honestly. Ad-hoc testing hides regressions rather than surfacing them.",
      },
      {
        title: "Judge-LLM plus a hard retrieval metric",
        why: "Answer-quality judging is fuzzy; retrieval recall is not. Pairing a soft judge with a hard metric catches both reasoning and retrieval regressions.",
      },
      {
        title: "Block in CI, not in review",
        why: "Regressions caught by a human reviewer are caught inconsistently. A CI gate makes quality non-negotiable and removes it from opinion.",
      },
    ],
    lessons: [
      "Evaluation infrastructure is the highest-leverage thing you can build for a RAG system — build it early.",
      "You can't improve what you don't measure, and 'the answers feel better' isn't a measurement.",
      "A judge-LLM plus one hard metric beats either alone.",
      "The moment quality lives in CI, prompt iteration stops being scary.",
    ],
  },

  "mcp-portfolio-server": {
    slug: "mcp-portfolio-server",
    tagline:
      "Turning a CV into an API: a Model Context Protocol server so Claude, Cursor, and ChatGPT can query real portfolio data.",
    before:
      "AI assistants had no clean way to query my CV, projects, and case studies as structured data — they could only scrape a rendered page and guess.",
    after:
      "A stdio MCP server exposes typed tools (get_projects, get_case_study, search_writing) so any compatible client can ground its answers in real portfolio data. It's documented at /mcp with copy-paste config and also underpins the on-site Ask AI chatbot.",
    timeline: [
      {
        phase: "Tool surface design",
        period: "Phase 1",
        story:
          "Decided what a client actually needs to answer questions about me and shaped that into a small set of typed tools rather than one fuzzy 'search' endpoint.",
      },
      {
        phase: "Shared data source",
        period: "Phase 2",
        story:
          "Backed the tools with the same structured portfolio data the site uses, so the MCP answers and the website can't drift apart.",
      },
      {
        phase: "stdio server + docs",
        period: "Phase 3",
        story:
          "Implemented the server over stdio and documented it at /mcp with copy-paste config, so a recruiter can wire it into Claude or Cursor in a couple of minutes.",
      },
    ],
    decisions: [
      {
        title: "Typed tools over a single search endpoint",
        why: "Specific tools (get_projects, get_case_study) give the client a clear contract and better answers than one catch-all search that returns a blob.",
      },
      {
        title: "One shared data source with the site",
        why: "If the MCP server and the website read different data, they'll contradict each other. A single source keeps every surface consistent.",
      },
      {
        title: "stdio + copy-paste config",
        why: "The whole point is frictionless adoption. stdio works with the common MCP clients, and copy-paste config removes the setup barrier.",
      },
    ],
    lessons: [
      "Exposing your own data over MCP is a concrete, memorable way to demonstrate the protocol — not just talk about it.",
      "Typed tools beat a generic search endpoint for both answer quality and client ergonomics.",
      "Sharing one data source across the site and the MCP server prevents contradictory answers.",
      "Frictionless setup (copy-paste config) is what turns a demo into something people actually try.",
    ],
  },

  "arabic-english-translation-assistant": {
    slug: "arabic-english-translation-assistant",
    tagline:
      "Bilingual statistical reports in 4 hours instead of 3 days — with zero terminology drift.",
    before:
      "Bilingual reports needed 2–3 days of manual translation, and statistical terminology drifted between the Arabic and English versions — the same concept rendered three different ways across a single publication.",
    after:
      "A GPT-4 translation copilot with a SCAD-specific glossary and a side-by-side reviewer cut turnaround to 4 hours, locked 200+ recurring terms to a single agreed rendering, and is now used for every quarterly release.",
    timeline: [
      {
        phase: "Glossary first",
        period: "Phase 1",
        story:
          "Built the SCAD-specific glossary (UN SDG terms, demographic taxonomies) before any translation code — because terminology consistency, not raw translation, was the real problem.",
      },
      {
        phase: "Translation copilot",
        period: "Phase 2",
        story:
          "Wrapped GPT-4 with the glossary as enforced context so agreed terms are used verbatim, and built a side-by-side reviewer so a human owns the final wording.",
      },
      {
        phase: "Adoption",
        period: "Phase 3",
        story:
          "Rolled it into the publications team's quarterly workflow. Human-in-the-loop review kept trust high while the speedup did the convincing.",
      },
    ],
    decisions: [
      {
        title: "Glossary-enforced translation over raw model output",
        why: "Free translation drifts on domain terms. Injecting an agreed glossary is what eliminated drift across 200+ recurring statistical terms.",
      },
      {
        title: "Side-by-side human review, not full automation",
        why: "Published government statistics can't ship on model confidence alone. A reviewer UI made the speedup safe to adopt.",
      },
    ],
    lessons: [
      "For domain translation, terminology consistency matters more than fluency.",
      "A glossary is cheaper and more reliable than fine-tuning for locking terms.",
      "Keep a human on the final wording when the output is published under an institution's name.",
    ],
  },

  "smart-meeting-summariser": {
    slug: "smart-meeting-summariser",
    tagline:
      "Turning Teams transcripts into bilingual minutes and tracked action items — so decisions stop falling through the cracks.",
    before:
      "Meeting minutes were inconsistent and action items routinely got lost across departments — follow-through sat around 60%.",
    after:
      "A pipeline summarises Teams transcripts in Arabic and English, extracts owners and deadlines, and posts structured items to Planner. Adopted across 6 departments and ~120 meetings/month, it cut minute-writing time 85% and lifted action-item follow-through to 92%.",
    timeline: [
      {
        phase: "Transcript ingestion",
        period: "Phase 1",
        story:
          "Wired Whisper + Teams transcripts into a clean pipeline, handling the reality of mixed Arabic/English speech in the same meeting.",
      },
      {
        phase: "Structured extraction",
        period: "Phase 2",
        story:
          "Moved from a prose summary to structured owner + deadline extraction — the difference between 'nice notes' and something that actually drives follow-through.",
      },
      {
        phase: "Close the loop into Planner",
        period: "Phase 3",
        story:
          "Posted extracted action items straight into Planner via Graph/Power Automate, so the output lands where the work already happens.",
      },
    ],
    decisions: [
      {
        title: "Extract structured action items, not just summaries",
        why: "A summary is read once and forgotten. Owner + deadline items posted to Planner are what moved follow-through from ~60% to ~92%.",
      },
      {
        title: "Bilingual by default",
        why: "Meetings mix Arabic and English; producing both keeps every stakeholder able to act without a translation step.",
      },
    ],
    lessons: [
      "The value isn't the summary — it's the tracked action item in the tool people already use.",
      "Push outputs to where work happens (Planner) instead of a document nobody reopens.",
      "Handle mixed-language audio explicitly; don't assume clean single-language input.",
    ],
  },

  "policy-document-qa-bot": {
    slug: "policy-document-qa-bot",
    tagline:
      "Answering the same 50 HR questions — with a cited policy clause every time — so people stop emailing HR.",
    before:
      "HR answered the same ~50 policy questions over and over, and staff couldn't navigate the sprawling policy-PDF library on their own.",
    after:
      "A slim RAG pipeline over the policy library gives citation-first answers with an escalation hand-off to a human. It has deflected ~70% of repetitive HR enquiries and run for over a year with no human-curated FAQ.",
    timeline: [
      {
        phase: "Index the library",
        period: "Phase 1",
        story:
          "Chunked and indexed the policy PDFs with Azure AI Search — a focused corpus, not the whole intranet, to keep answers precise.",
      },
      {
        phase: "Citation-first answers",
        period: "Phase 2",
        story:
          "Made every answer carry the specific policy clause and page number, so staff (and HR) can verify rather than trust blindly.",
      },
      {
        phase: "Escalation hand-off",
        period: "Phase 3",
        story:
          "Added a clean hand-off to a human HR contact for anything outside the library — the bot knows its limits.",
      },
    ],
    decisions: [
      {
        title: "Citation-first responses",
        why: "For HR/policy questions, an answer without a source clause is a liability. Cited clauses are what made it trustworthy enough to replace the FAQ.",
      },
      {
        title: "A narrow corpus over a broad one",
        why: "Scoping retrieval to the policy library kept precision high and hallucinations near zero, rather than diluting it across all intranet content.",
      },
    ],
    lessons: [
      "For policy Q&A, a cited clause beats a fluent paragraph every time.",
      "A tight, well-scoped corpus outperforms a large noisy one.",
      "An honest escalation path is what lets you safely deflect the routine 70%.",
    ],
  },

  "email-triage-copilot": {
    slug: "email-triage-copilot",
    tagline:
      "An Outlook copilot that classifies, drafts, and learns — giving senior staff ~5 hours a week back.",
    before:
      "Senior team members spent 60–90 minutes a day classifying and replying to repetitive stakeholder emails.",
    after:
      "An Outlook add-in classifies incoming mail by intent, drafts a tone-matched reply, and learns from accept/reject signals. It saved ~5 hours/week per user, reached a 78% draft-acceptance rate, and held 91% triage accuracy across 12 categories.",
    timeline: [
      {
        phase: "Intent classification",
        period: "Phase 1",
        story:
          "Built a 12-category intent classifier for incoming mail — triage first, because routing the email correctly is half the time saved.",
      },
      {
        phase: "Tone-matched drafting",
        period: "Phase 2",
        story:
          "Generated reply drafts that match the user's tone, surfaced in Outlook where they already work rather than a separate app.",
      },
      {
        phase: "Learn from accept/reject",
        period: "Phase 3",
        story:
          "Fed accept/reject signals back in so drafts improved over the first two weeks — acceptance climbed to 78%.",
      },
    ],
    decisions: [
      {
        title: "Draft, don't send",
        why: "Keeping a human in the send loop is what makes an email assistant safe. The copilot proposes; the person approves.",
      },
      {
        title: "Live inside Outlook",
        why: "Adoption dies if people have to leave their inbox. An add-in met users where they already are.",
      },
    ],
    lessons: [
      "Never auto-send. A tone-matched draft with a human approving is the sweet spot.",
      "Meet users in their existing tool or adoption collapses.",
      "Accept/reject feedback is a cheap, powerful signal — capture it from day one.",
    ],
  },

  "code-review-assistant": {
    slug: "code-review-assistant",
    tagline:
      "A GitHub Action that catches ~40% of bugs before a human ever opens the PR.",
    before:
      "Code reviews were inconsistent across teams, and common security and performance issues kept slipping past human reviewers.",
    after:
      "A GitHub Action posts inline review comments — security checks, async/await pitfalls, EF Core anti-patterns, and a prompt-injection scanner for AI-touching files. It catches ~40% of bugs before human review across 6 repos, cut PR cycle time from 2.5 days to 1.1, and surfaced 14 latent SQL-injection and async issues in the first month.",
    timeline: [
      {
        phase: "Targeted rule set",
        period: "Phase 1",
        story:
          "Focused the reviewer on the issues that actually recur in .NET repos — security, async/await, EF Core — instead of generic style nagging.",
      },
      {
        phase: "Inline PR comments",
        period: "Phase 2",
        story:
          "Wired it as a GitHub Action posting inline comments via Octokit, so feedback lands exactly on the offending line during review.",
      },
      {
        phase: "Prompt-injection scanning",
        period: "Phase 3",
        story:
          "Added a prompt-injection scanner for any AI-touching files — reviewing the new class of risk that AI features introduce.",
      },
    ],
    decisions: [
      {
        title: "Domain-specific checks over generic linting",
        why: "Roslyn + targeted prompts for real .NET pitfalls caught meaningful bugs; a generic 'review this' prompt would have produced noise reviewers ignore.",
      },
      {
        title: "Augment human review, don't replace it",
        why: "The Action handles the repetitive 40% so humans spend their attention on design and intent — the things models are worst at.",
      },
    ],
    lessons: [
      "A focused rule set that catches real bugs beats a broad one that generates noise.",
      "Put the feedback inline on the line, or it won't get acted on.",
      "AI features need their own review checks — prompt injection is now part of code review.",
    ],
  },

  "data-quality-anomaly-detector": {
    slug: "data-quality-anomaly-detector",
    tagline:
      "Classical stats to flag it, an LLM to judge it — catching unit-of-measure errors before they hit published statistics.",
    before:
      "Monthly economic-indicator submissions occasionally contained unit-of-measure errors that weren't caught until after publication.",
    after:
      "A hybrid pipeline flags suspect rows with classical outlier detection, then GPT-4 reasons about whether they're real changes or likely data-entry mistakes. It caught 23 publication-blocking issues over 9 months, cut false positives 60% vs the old threshold-only system, and drove data-quality publication delays from 4/year to 0.",
    timeline: [
      {
        phase: "Statistical flagging",
        period: "Phase 1",
        story:
          "Kept classical outlier detection as the first pass — cheap, explainable, and good at surfacing suspect rows.",
      },
      {
        phase: "LLM adjudication",
        period: "Phase 2",
        story:
          "Layered GPT-4 reasoning on top to distinguish a genuine economic shift from a decimal-point or unit error — the judgement a pure threshold can't make.",
      },
      {
        phase: "Pre-publication gate",
        period: "Phase 3",
        story:
          "Wired it into the pre-release workflow so issues are caught before publication, not discovered weeks later in the wild.",
      },
    ],
    decisions: [
      {
        title: "Hybrid stats + LLM, not either alone",
        why: "Thresholds over-flag; an LLM alone is expensive and unfocused. Stats narrow the candidates, the LLM adds judgement — cutting false positives 60%.",
      },
      {
        title: "Explain every flag",
        why: "Analysts need to know why a row was flagged to act on it. Pairing the statistical signal with the LLM's reasoning made flags actionable.",
      },
    ],
    lessons: [
      "Use classical methods for recall and the LLM for judgement — don't make the model do both.",
      "False positives are the real enemy of a data-quality tool; tune for them.",
      "Catching an error before publication is worth far more than detecting it after.",
    ],
  },

  "survey-open-ended-coder": {
    slug: "survey-open-ended-coder",
    tagline:
      "Coding 30,000+ Arabic open-ended responses in 4 days instead of 6 weeks — at 92% agreement with humans.",
    before:
      "Coding 30,000+ Arabic open-ended survey responses to a fixed taxonomy took a team of four about six weeks.",
    after:
      "An Arabic-first, few-shot LLM coder with confidence thresholds auto-codes the confident majority and routes the rest to a human-in-the-loop UI. It cut the cycle from 6 weeks to 4 days at 92% agreement with the human gold standard.",
    timeline: [
      {
        phase: "Taxonomy + few-shot",
        period: "Phase 1",
        story:
          "Encoded the fixed taxonomy as few-shot examples, Arabic-first, so the model codes to the exact categories the survey team uses.",
      },
      {
        phase: "Confidence thresholds",
        period: "Phase 2",
        story:
          "Auto-coded only high-confidence responses and routed the rest to a review UI — automation where it's safe, humans where it's not.",
      },
      {
        phase: "Human-in-the-loop review",
        period: "Phase 3",
        story:
          "Focused the four-person team on edge cases instead of the full 30,000, which is where the six weeks used to go.",
      },
    ],
    decisions: [
      {
        title: "Confidence-gated automation",
        why: "Auto-coding everything would be unsafe; reviewing everything is slow. Thresholds let the model handle the bulk while humans own the ambiguous tail.",
      },
      {
        title: "Arabic-first prompting",
        why: "Treating Arabic as the primary language, not a translation target, is what held agreement at 92% on real responses.",
      },
    ],
    lessons: [
      "Confidence thresholds turn 'risky automation' into 'safe automation plus focused review'.",
      "Measure against a human gold standard or you can't claim accuracy.",
      "For Arabic content, design Arabic-first rather than translating to English underneath.",
    ],
  },

  "smart-form-validator": {
    slug: "smart-form-validator",
    tagline:
      "Standardising messy Arabic names and addresses in-line — lifting record-linkage match rate from 72% to 94%.",
    before:
      "Field-collected forms had inconsistent Arabic name and address formatting that broke downstream record linkage.",
    after:
      "A light GPT-3.5 normaliser with a transliteration model standardises names, splits address components, and validates against the national address registry — in-line on submit at sub-200ms p95. Match rate rose from 72% to 94% and eight brittle regex rule-sets were replaced by one model plus a small ruleset.",
    timeline: [
      {
        phase: "Normalisation model",
        period: "Phase 1",
        story:
          "Built a light normaliser + transliteration step to standardise Arabic names and split address components consistently.",
      },
      {
        phase: "Registry validation",
        period: "Phase 2",
        story:
          "Validated standardised addresses against the national address registry so downstream linkage has clean, verified inputs.",
      },
      {
        phase: "In-line at submit",
        period: "Phase 3",
        story:
          "Ran the whole thing in-line on form submit at sub-200ms p95 — fixing data at the source instead of cleaning it later.",
      },
    ],
    decisions: [
      {
        title: "Fix data at entry, not downstream",
        why: "Cleaning at submit time stops bad records from ever entering the pipeline, which is why linkage jumped 22 points.",
      },
      {
        title: "One model + small ruleset over 8 regex systems",
        why: "The brittle regex rule-sets were unmaintainable. A model plus a thin ruleset was more accurate and far easier to keep working.",
      },
    ],
    lessons: [
      "The cheapest place to fix data quality is the moment of entry.",
      "A small model can retire a pile of brittle regex — and be easier to maintain.",
      "Latency budgets matter for in-line validation; sub-200ms keeps it invisible to users.",
    ],
  },

  "knowledge-base-auto-tagger": {
    slug: "knowledge-base-auto-tagger",
    tagline:
      "Tagging 40,000+ documents in 36 hours — and making search 3.4× more likely to surface the right one.",
    before:
      "An internal SharePoint held 40,000+ documents with inconsistent or missing metadata, which made search effectively useless.",
    after:
      "A batch embedding + classification pipeline assigns SDG topics, year, language, and confidentiality tier, and suggests related documents. It tagged 40,000+ documents in under 36 hours, lifted search click-through-to-relevant by 3.4×, and now powers the retrieval filters in the main RAG system.",
    timeline: [
      {
        phase: "Batch embedding",
        period: "Phase 1",
        story:
          "Embedded the whole corpus in batch, the foundation for both classification and related-document suggestions.",
      },
      {
        phase: "Multi-facet classification",
        period: "Phase 2",
        story:
          "Classified each document across SDG topic, year, language, and confidentiality tier — the facets that make filtered search actually work.",
      },
      {
        phase: "Feed the RAG filters",
        period: "Phase 3",
        story:
          "Exposed the tags as retrieval filters in the main document-intelligence system, so this pipeline quietly improved the flagship RAG product too.",
      },
    ],
    decisions: [
      {
        title: "Metadata as an enabler for retrieval",
        why: "Good tags aren't cosmetic — they became the filters that sharpen the main RAG system's retrieval, so the work compounded.",
      },
      {
        title: "Confidentiality tier as a first-class facet",
        why: "In a government context, classifying sensitivity up front is what lets downstream systems enforce access safely.",
      },
    ],
    lessons: [
      "Metadata quality is a retrieval feature, not an afterthought.",
      "Batch-tagging an existing corpus can unlock other AI systems that depend on it.",
      "Classify sensitivity early so access control has something to enforce.",
    ],
  },

  "exec-dashboard-narrator": {
    slug: "exec-dashboard-narrator",
    tagline:
      "Bilingual executive briefs on the morning of the review — grounded in the actual numbers, with zero hallucinated figures.",
    before:
      "Leadership wanted prose commentary on top of Power BI dashboards — month-over-month narrative, not just charts — but writing it lagged the data by two days.",
    after:
      "A scheduled job reads dashboard datasets, runs significance tests, and writes a four-paragraph bilingual executive brief grounded in the real numbers. Briefs now land the morning of the monthly review, it's the default lead-in to the executive deck, and there have been zero hallucinated numbers in 9 months.",
    timeline: [
      {
        phase: "Read the data, test significance",
        period: "Phase 1",
        story:
          "Started from the datasets, not the charts — running significance tests so the narrative highlights changes that actually matter.",
      },
      {
        phase: "Templated numbers, generated prose",
        period: "Phase 2",
        story:
          "Templated every figure and let the model write only the connective prose — the design choice that guarantees no invented numbers.",
      },
      {
        phase: "Bilingual, on schedule",
        period: "Phase 3",
        story:
          "Produced Arabic + English briefs on a schedule so they're ready the morning of the review instead of two days later.",
      },
    ],
    decisions: [
      {
        title: "Template the numbers, generate only the words",
        why: "LLMs invent figures. Injecting templated, verified numbers and letting the model write only prose is what delivered zero hallucinated numbers in 9 months.",
      },
      {
        title: "Significance testing before narration",
        why: "Without it, the brief would narrate noise. Testing first means the commentary focuses on genuinely meaningful movements.",
      },
    ],
    lessons: [
      "For number-heavy generation, template the numbers and let the model handle only language.",
      "Run significance tests first so you narrate signal, not noise.",
      "'Zero hallucinated numbers' is an architecture choice, not a prompt.",
    ],
  },

  "service-request-router": {
    slug: "service-request-router",
    tagline:
      "Routing bilingual citizen requests to the right team — cutting misrouting from 28% to 6%.",
    before:
      "Bilingual citizen requests were misrouted about 28% of the time, causing SLA breaches across labour-service teams.",
    after:
      "An intent + topic classifier routes each request to one of 22 specialist teams with a confidence-gated escalation path. Misrouting dropped from 28% to 6%, first-touch resolution improved 19 points, and labour-services SLA breaches fell 41%.",
    timeline: [
      {
        phase: "Intent + topic classification",
        period: "Phase 1",
        story:
          "Built an Arabic-capable classifier over the request text to predict intent and topic across 22 specialist teams.",
      },
      {
        phase: "Confidence-gated routing",
        period: "Phase 2",
        story:
          "Auto-routed confident predictions and escalated uncertain ones, so the tail of ambiguous requests didn't degrade into misroutes.",
      },
      {
        phase: "Measure against SLAs",
        period: "Phase 3",
        story:
          "Tracked misrouting, first-touch resolution, and SLA breaches — the metrics leadership actually feels — to prove the impact.",
      },
    ],
    decisions: [
      {
        title: "Confidence-gated escalation",
        why: "Forcing a guess on low-confidence requests is what caused misroutes. Escalating the uncertain ones is what pushed misrouting down to 6%.",
      },
      {
        title: "Bilingual classification from the start",
        why: "Citizen requests arrive in Arabic and English; handling both natively was table stakes for accurate routing.",
      },
    ],
    lessons: [
      "Let the classifier abstain — a confidence gate beats a forced wrong guess.",
      "Tie the model's metrics to the ones leadership feels (SLA breaches), not just accuracy.",
      "Routing quality compounds: fewer misroutes lifts first-touch resolution too.",
    ],
  },

  "social-sentiment-engine": {
    slug: "social-sentiment-engine",
    tagline:
      "Near-real-time brand sentiment from 100K+ social posts a day, at under 30 seconds end-to-end.",
    before:
      "Marketing customers needed near-real-time brand sentiment from 100K+ daily social posts across Twitter, Facebook, and Instagram — far beyond manual monitoring.",
    after:
      "A streaming pipeline classifies sentiment and topic, detects spikes, and pushes alerts to subscriber dashboards. It processed 100K+ posts/day per tenant at under 30 seconds median end-to-end latency and onboarded 12 brand customers in the first quarter.",
    timeline: [
      {
        phase: "Streaming ingestion",
        period: "Phase 1",
        story:
          "Built a queue-backed streaming pipeline (RabbitMQ) to absorb 100K+ posts/day per tenant across three social APIs without backpressure.",
      },
      {
        phase: "Sentiment + spike detection",
        period: "Phase 2",
        story:
          "Classified sentiment and topic in-stream and added spike detection, because the alert on a sudden shift is what customers actually pay for.",
      },
      {
        phase: "Multi-tenant dashboards",
        period: "Phase 3",
        story:
          "Pushed alerts into per-tenant dashboards, onboarding 12 brand customers in the first quarter.",
      },
    ],
    decisions: [
      {
        title: "Streaming over batch",
        why: "'Near-real-time' was the product. A queue-backed streaming design is what held median latency under 30 seconds at 100K+ posts/day.",
      },
      {
        title: "Spike detection as the headline feature",
        why: "Raw sentiment scores are noise; the alert on an unusual shift is the signal customers act on.",
      },
    ],
    lessons: [
      "If real-time is the promise, architect for streaming from day one — retrofitting is painful.",
      "Detect and alert on change; a static score is rarely the thing customers need.",
      "Design for multi-tenancy early when the product is sold per-customer.",
    ],
  },

  "lead-scoring-model": {
    slug: "lead-scoring-model",
    tagline:
      "Scoring lease applications so sales chases the right ones — +18% closed-lease yield, decisions in 8 hours not 36.",
    before:
      "Sales teams at OEM finance clients were chasing low-probability leases, burning cycle time on poor-fit applicants.",
    after:
      "A logistic-regression scoring model on application and bureau features, exposed as an API into the leasing workflow, improved closed-lease yield by 18%, cut average time-to-decision from 36 hours to 8, and was deployed at two international leasing customers.",
    timeline: [
      {
        phase: "Feature engineering",
        period: "Phase 1",
        story:
          "Combined application data with credit-bureau features into a signal set that actually predicts whether a lease closes.",
      },
      {
        phase: "Interpretable model",
        period: "Phase 2",
        story:
          "Chose logistic regression so underwriters could see why an application scored the way it did — trust matters in finance.",
      },
      {
        phase: "API into the workflow",
        period: "Phase 3",
        story:
          "Exposed scoring as an API embedded in the leasing workflow, so the score arrives where the decision is made — cutting time-to-decision to 8 hours.",
      },
    ],
    decisions: [
      {
        title: "Interpretable model over a black box",
        why: "In lease underwriting, an explainable score is adoptable; an unexplained one isn't. Logistic regression traded a little accuracy for the trust that drove adoption.",
      },
      {
        title: "Score inside the existing workflow",
        why: "A model no one sees changes nothing. Embedding it as an API in the leasing flow is what turned it into an 18% yield lift.",
      },
    ],
    lessons: [
      "In regulated finance, interpretability often beats a marginal accuracy gain.",
      "Deliver the prediction where the decision is made, not in a separate report.",
      "Good features beat fancy models — most of the lift came from the bureau data.",
    ],
  },
};

export const PROJECTS: Project[] = [
  {
    slug: "rag-document-intelligence",
    title: "Enterprise RAG Document Intelligence System",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2025",
    featured: true,
    challenge:
      "100K+ government documents scattered across legacy systems with no unified search.",
    solution:
      "Architected end-to-end RAG pipeline using Azure OpenAI and Cognitive Search with hybrid retrieval and re-ranking.",
    impact: [
      "Reduced information retrieval time from 2–3 hours to under 10 seconds",
      "Achieved 92% accuracy on complex multi-document queries",
      "Processing 5K+ queries monthly with 87% user satisfaction",
      "Cut document research costs by 65% through automation",
    ],
    metrics: {
      time: "10s",
      accuracy: "92%",
      cost: "-65%",
      queries: "5K+/mo",
    },
    stack: [
      "GPT-4",
      "Azure Cognitive Search",
      "LangChain",
      "Pinecone",
      "Azure Functions",
      ".NET Core",
      "Angular",
    ],
  },
  {
    slug: "conversational-analytics",
    title: "Intelligent Conversational Analytics Platform",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2023 – Present",
    featured: true,
    challenge:
      "Non-technical users needed SQL database access without coding knowledge.",
    solution:
      "Built natural language to SQL query system with conversational interface and automatic error correction.",
    impact: [
      "Enabled 200+ non-technical staff to query databases using plain English",
      "Handles 15K+ queries monthly across 8 different databases",
      "Reduced analytics request backlog by 70%",
      "85% query accuracy with automatic error correction",
    ],
    metrics: {
      users: "200+",
      queries: "15K+/mo",
      backlog: "-70%",
      accuracy: "85%",
    },
    stack: [
      "GPT-4",
      "Semantic Kernel",
      "Azure OpenAI",
      ".NET Core Web API",
      "Angular",
      "SQL Server",
    ],
  },
  {
    slug: "vision-ai-pipeline",
    title: "Document Processing & Vision AI Pipeline",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2025",
    featured: true,
    challenge:
      "Manual processing of 1000+ daily documents (PDFs, scanned images, forms).",
    solution:
      "Built intelligent document processing pipeline using GPT-4 Vision and Azure Form Recognizer.",
    impact: [
      "Automated 80% of document classification and data extraction tasks",
      "Reduced processing time from 15 minutes to 30 seconds per document",
      "94% accuracy on structured form extraction",
      "Saved 2000+ staff hours monthly",
    ],
    metrics: {
      automation: "80%",
      time: "30s",
      accuracy: "94%",
      saved: "2K+/mo hrs",
    },
    stack: [
      "GPT-4 Vision",
      "Azure Form Recognizer",
      "Azure Functions",
      "Blob Storage",
      "Cosmos DB",
    ],
  },
  {
    slug: "ai-chatbot",
    title: "AI Conversational Chatbot (18K+ Monthly Queries)",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2023",
    featured: false,
    challenge: "High-volume support queries overwhelming human agents.",
    solution:
      "Deployed conversational AI chatbot with context-aware multi-turn dialogue and intent routing.",
    impact: [
      "Handling 18K+ monthly queries with 90% first-contact resolution",
      "Cut support costs by 43%",
      "Serving 500+ users daily",
    ],
    metrics: { queries: "18K+/mo", resolution: "90%", cost: "-43%" },
    stack: [
      "Azure Bot Framework",
      "GPT-4",
      "Azure OpenAI",
      "LangChain",
      ".NET Core",
    ],
  },

  // ── Smaller applied-AI engagements (internal tools, automations, copilots) ──
  {
    slug: "arabic-english-translation-assistant",
    title: "Arabic ↔ English Statistical Report Translator",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2025",
    featured: false,
    challenge:
      "Bilingual reports required 2–3 days of manual translation with statistical terminology drift between Arabic and English versions.",
    solution:
      "Built a GPT-4 translation copilot with a SCAD-specific glossary (UN SDG terms, demographic taxonomies) and a side-by-side reviewer UI.",
    impact: [
      "Cut bilingual report turnaround from 3 days to 4 hours",
      "Eliminated terminology drift on 200+ recurring statistical terms",
      "Adopted by the publications team for every quarterly release",
    ],
    metrics: { speedup: "18×", glossary: "200+ terms", adoption: "100%" },
    stack: ["GPT-4", "Azure OpenAI", "Custom Glossary", "Angular"],
  },
  {
    slug: "smart-meeting-summariser",
    title: "Smart Meeting Summariser & Action-Item Extractor",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2025",
    featured: false,
    challenge:
      "Meeting minutes were inconsistent and action items routinely fell through the cracks across departments.",
    solution:
      "Pipeline ingests Teams transcripts, summarises in Arabic + English, extracts owners and deadlines, and posts structured items to Planner.",
    impact: [
      "Adopted across 6 departments and ~120 meetings/month",
      "85% reduction in time spent writing minutes",
      "Action-item follow-through up from ~60% to ~92%",
    ],
    metrics: { meetings: "120+/mo", departments: "6", followthrough: "92%" },
    stack: ["Whisper", "GPT-4", "Microsoft Graph", "Power Automate"],
  },
  {
    slug: "policy-document-qa-bot",
    title: "Internal Policy & HR Q&A Bot",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2024",
    featured: false,
    challenge:
      "HR was answering the same ~50 policy questions repeatedly; staff couldn't navigate the policy PDF library.",
    solution:
      "Slim RAG pipeline over the policy library with citation-first answers and an escalation hand-off to a human HR contact.",
    impact: [
      "Deflected ~70% of repetitive HR enquiries",
      "Every answer carries a cited policy clause + page number",
      "Quietly running for over a year with no human-curated FAQ",
    ],
    metrics: { deflection: "70%", uptime: "12+ mo", citations: "100%" },
    stack: ["Azure OpenAI", "Azure AI Search", "LangChain", ".NET Core"],
  },
  {
    slug: "email-triage-copilot",
    title: "Inbox Triage & Auto-Reply Drafting Copilot",
    company: "Internal use",
    year: "2025",
    featured: false,
    challenge:
      "Senior team members spent 60–90 minutes a day classifying and replying to repetitive stakeholder emails.",
    solution:
      "Outlook add-in that classifies incoming mail by intent, drafts a tone-matched reply, and learns from accept/reject signals.",
    impact: [
      "Saved ~5 hours/week per user across the pilot group",
      "Acceptance rate on drafted replies climbed to 78% after 2 weeks",
      "Triage accuracy held at 91% on 12-category classification",
    ],
    metrics: { saved: "5 hrs/wk", accept: "78%", accuracy: "91%" },
    stack: ["GPT-4", "Microsoft Graph", "Office Add-in", ".NET"],
  },
  {
    slug: "code-review-assistant",
    title: "AI Code-Review Assistant for .NET Repos",
    company: "Internal engineering",
    year: "2025",
    featured: false,
    challenge:
      "Code reviews were inconsistent across teams; common security and performance issues kept slipping past human reviewers.",
    solution:
      "GitHub Action that posts inline review comments — security checks, async/await pitfalls, EF Core anti-patterns, and a prompt-injection scanner for any AI-touching files.",
    impact: [
      "Catches ~40% of bugs before human review across 6 active repos",
      "Reduced average PR cycle time from 2.5 days to 1.1 days",
      "Surfaced 14 latent SQL-injection and async issues in the first month",
    ],
    metrics: { caught: "40%", cycle: "-56%", repos: "6" },
    stack: ["GPT-4", "GitHub Actions", "Roslyn Analyzer", "Octokit"],
  },
  {
    slug: "data-quality-anomaly-detector",
    title: "Statistical Data-Quality Anomaly Detector",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2024",
    featured: false,
    challenge:
      "Monthly economic indicator submissions occasionally contained unit-of-measure errors that weren't caught until publication.",
    solution:
      "Hybrid stats + LLM pipeline: classical outlier detection flags suspect rows, then GPT-4 reasons about whether they're real changes vs. likely data-entry mistakes.",
    impact: [
      "Caught 23 publication-blocking issues across 9 months pre-release",
      "Reduced false positives by 60% vs. the prior threshold-only system",
      "Cut publication delays linked to data quality from 4/yr to 0",
    ],
    metrics: { caught: "23 issues", fp: "-60%", delays: "0" },
    stack: ["Python", "GPT-4", "scikit-learn", "Azure Functions"],
  },
  {
    slug: "survey-open-ended-coder",
    title: "Open-Ended Survey Response Coder",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2024",
    featured: false,
    challenge:
      "Coding 30,000+ Arabic open-ended responses to a single fixed taxonomy used to take a team of 4 about 6 weeks.",
    solution:
      "Few-shot Arabic-first LLM coder with confidence thresholds; high-confidence answers auto-coded, low-confidence ones routed to a human-in-the-loop UI.",
    impact: [
      "Reduced coding cycle from 6 weeks to 4 days",
      "92% agreement with the human gold-standard sample",
      "Freed the survey team to focus on edge-case review",
    ],
    metrics: { speedup: "10×", agreement: "92%", responses: "30K+" },
    stack: ["GPT-4", "Azure OpenAI", "Arabic NLP", "Angular"],
  },
  {
    slug: "smart-form-validator",
    title: "Smart Form Validator (Arabic Address & Name Parsing)",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2024",
    featured: false,
    challenge:
      "Field-collected forms had inconsistent Arabic name and address formatting that broke downstream record linkage.",
    solution:
      "Light GPT-3.5 normaliser + transliteration model that standardises names, splits address components, and validates them against the national address registry.",
    impact: [
      "Improved record-linkage match rate from 72% to 94%",
      "Replaced 8 brittle regex rule sets with one model + small ruleset",
      "Runs in-line on form submit, sub-200ms p95 latency",
    ],
    metrics: { match: "+22pp", latency: "200ms", rules: "-8 systems" },
    stack: ["GPT-3.5", "Azure Functions", "Arabic Transliteration"],
  },
  {
    slug: "knowledge-base-auto-tagger",
    title: "Knowledge-Base Auto-Tagger & Linker",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2024",
    featured: false,
    challenge:
      "Internal SharePoint had 40,000+ documents with inconsistent (or missing) metadata, making search useless.",
    solution:
      "Batch embedding + classification pipeline that assigns SDG topics, year, language, and confidentiality tier, plus suggests related documents.",
    impact: [
      "Tagged 40K+ documents in under 36 hours",
      "Lifted search click-through-to-relevant by 3.4×",
      "Powers the RAG retrieval filters in the main document system",
    ],
    metrics: { docs: "40K+", ctr: "3.4×", time: "36 hrs" },
    stack: ["text-embedding-3", "GPT-4", "Azure AI Search", ".NET"],
  },
  {
    slug: "exec-dashboard-narrator",
    title: "Executive Dashboard Narrator",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2025",
    featured: false,
    challenge:
      "Leadership wanted prose summaries on top of Power BI dashboards — not just charts — with month-over-month commentary.",
    solution:
      "Scheduled job reads dashboard datasets, runs significance tests, and writes a 4-paragraph bilingual executive brief grounded in the actual numbers.",
    impact: [
      "Bilingual briefs delivered the morning of the monthly review (was 2-day lag)",
      "Adopted as the default lead-in for the executive committee deck",
      "Zero hallucinated numbers in 9 months of running (numbers are templated, not generated)",
    ],
    metrics: { lag: "-2 days", hallucinations: "0", languages: "AR + EN" },
    stack: ["Power BI", "GPT-4", "Azure Functions", "Logic Apps"],
  },
  {
    slug: "regulatory-change-watcher",
    title: "Regulatory & Policy Change Watcher",
    company: "MoHRE — UAE Government",
    year: "2022",
    featured: false,
    challenge:
      "Compliance team had to manually scan 30+ regulator websites for changes that affected labour-services applications.",
    solution:
      "Daily crawler + LLM diff summariser that posts only material policy changes — with citations — to a Teams channel.",
    impact: [
      "Compliance review effort cut by ~80%",
      "Caught two high-impact regulatory changes before manual review would have",
      "Running for 3+ years with under 5 false-positive flags total",
    ],
    metrics: { effort: "-80%", recall: "100%", falsepos: "<5" },
    stack: ["Python", "GPT-4", "Microsoft Teams", "Azure Logic Apps"],
  },
  {
    slug: "service-request-router",
    title: "Citizen Service Request Auto-Router",
    company: "MoHRE — UAE Government",
    year: "2021",
    featured: false,
    challenge:
      "Bilingual citizen requests were misrouted ~28% of the time, causing SLA breaches across labour service teams.",
    solution:
      "Intent + topic classifier on top of the request text routes to one of 22 specialist teams, with a confidence-gated escalation path.",
    impact: [
      "Misrouting dropped from 28% to 6%",
      "First-touch resolution improved 19 percentage points",
      "Reduced SLA-breach rate on labour services by 41%",
    ],
    metrics: { misroute: "-22pp", ftr: "+19pp", sla: "-41%" },
    stack: ["BERT (Arabic)", "ML.NET", "Azure ML", "Web API"],
  },
  {
    slug: "social-sentiment-engine",
    title: "Real-Time Social Sentiment Engine",
    company: "TRG Tech",
    year: "2017",
    featured: false,
    challenge:
      "Marketing customers needed near-real-time brand sentiment from 100K+ daily social posts across Twitter, Facebook, Instagram.",
    solution:
      "Streaming pipeline classifies sentiment + topic, detects spikes, and pushes alerts to subscriber dashboards.",
    impact: [
      "Processed 100K+ posts/day per tenant",
      "Median end-to-end latency under 30 seconds",
      "Onboarded 12 brand customers in the first quarter",
    ],
    metrics: { volume: "100K+/day", latency: "30s", tenants: "12" },
    stack: ["Node.js", "RabbitMQ", "Sentiment Analysis", "Angular"],
  },
  {
    slug: "lead-scoring-model",
    title: "Lease Application Lead Scoring",
    company: "NETSOL Technologies",
    year: "2014",
    featured: false,
    challenge:
      "Sales teams at OEM finance clients were chasing low-probability leases, eating up cycle time on poor-fit applicants.",
    solution:
      "Logistic-regression scoring model on application + bureau features, exposed as an API into the leasing workflow.",
    impact: [
      "Improved closed-lease yield by 18%",
      "Cut average time-to-decision from 36 hours to 8 hours",
      "Deployed at two international leasing customers",
    ],
    metrics: { yield: "+18%", decision: "-77%", customers: "2 OEMs" },
    stack: ["R", ".NET", "SQL Server", "REST API"],
  },
  {
    slug: "prompt-eval-harness",
    title: "Prompt & RAG Evaluation Harness",
    company: "SCAD — Statistics Centre Abu Dhabi",
    year: "2025",
    featured: false,
    challenge:
      "Every prompt or retrieval tweak was being shipped on vibes — there was no way to measure regressions on the RAG and NL-to-SQL systems.",
    solution:
      "Open-source-flavoured eval harness with ~400 graded queries, judge-LLM scoring, and a CI step that blocks regressions in retrieval recall and answer quality.",
    impact: [
      "Caught 6 regressions before they hit production",
      "Made prompt iteration data-driven instead of intuition-driven",
      "Adopted as the gate on every RAG/NL-to-SQL change",
    ],
    metrics: { suites: "2", queries: "400+", regressions: "6 caught" },
    stack: ["GPT-4 (judge)", "Python", "GitHub Actions", "DVC"],
  },
  {
    slug: "mcp-portfolio-server",
    title: "Portfolio Model Context Protocol Server",
    company: "Personal · Open-source",
    year: "2026",
    featured: false,
    challenge:
      "AI assistants (Claude, ChatGPT, Cursor) had no clean way to query my CV, projects, and case studies as structured data.",
    solution:
      "stdio MCP server exposing typed tools (get_projects, get_case_study, search_writing) so any compatible client can ground answers in real portfolio data.",
    impact: [
      "Recruiters can run a Claude/Cursor session against my real corpus",
      "Underpins the on-site Ask AI chatbot",
      "Documented at /mcp with copy-paste config",
    ],
    metrics: { tools: "5", clients: "Claude · Cursor", ground: "100%" },
    stack: ["MCP", "TypeScript", "Node stdio", "Zod"],
  },
];

export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  location: string;
  type: string;
  highlights: string[];
  stack: string[];
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    role: "Senior System Analyst / AI Platforms",
    company: "Statistics Centre — Abu Dhabi (SCAD)",
    period: "Nov 2022 – Present",
    location: "Abu Dhabi, UAE",
    type: "Full-time",
    highlights: [
      "Architected enterprise RAG system processing 100K+ documents using GPT-4 and Azure Cognitive Search, reducing research time by 95%",
      "Deployed conversational AI chatbot handling 18K+ monthly queries with 90% first-contact resolution, cutting support costs by 43%",
      "Built natural language SQL query interface enabling non-technical users to access 8 databases, processing 15K+ queries monthly",
      "Designed prompt engineering framework reducing GPT-4 API costs by 38% while improving response quality by 15%",
      "Led migration of 8 legacy monolithic applications to AI-enhanced microservices",
    ],
    stack: [
      "GPT-4",
      "Azure OpenAI",
      "LangChain",
      "Semantic Kernel",
      "Pinecone",
      ".NET Core 8",
      "Angular 17",
      "Kubernetes",
    ],
  },
  {
    role: "Senior Full Stack Engineer / Team Lead",
    company: "Ministry of Human Resources & Emiratisation (MoHRE)",
    period: "July 2018 – Nov 2022",
    location: "UAE",
    type: "Full-time",
    highlights: [
      "Led development of Tasheel Systems — 50+ labor and HR services applications serving 2M+ users annually",
      "Modernized legacy codebase to microservices architecture, improving performance by 45%",
      "Designed RESTful APIs consumed by 30+ internal and external systems with OAuth 2.0",
      "Implemented Redis caching strategy reducing database load by 55%",
      "Led team of 6 developers using Agile/Scrum with 95%+ sprint completion rate",
    ],
    stack: [
      ".NET Core 5/6",
      "Angular 12-14",
      "React",
      "Docker",
      "Kubernetes",
      "Azure DevOps",
      "Redis",
      "AWS",
    ],
  },
  {
    role: "Senior Software Engineer / Technical Lead",
    company: "TRG Tech",
    period: "June 2015 – June 2018",
    location: "Lahore, Pakistan",
    type: "Full-time",
    highlights: [
      "Led cross-functional team of 8 developers (Full Stack, iOS, Android)",
      "Built real-time sentiment analysis engine processing 100K+ social media posts daily",
      "Developed social media monitoring platform integrating Twitter, Facebook, Instagram APIs",
      "Architected data pipelines processing 1M+ records daily for business intelligence",
    ],
    stack: [
      ".NET Framework 4.6",
      "Angular",
      "Node.js",
      "SQL Server",
      "Social Media APIs",
      "Sentiment Analysis",
    ],
  },
  {
    role: "Software Developer",
    company: "NETSOL Technologies",
    period: "Dec 2012 – June 2015",
    location: "Lahore, Pakistan",
    type: "Full-time",
    highlights: [
      "Maintained and enhanced large-scale financial leasing suite for international clients (FIAT, CNH Industrial)",
      "Delivered 20+ features for enterprise financial management system",
      "Reduced bug count by 35% through code refactoring and unit testing",
    ],
    stack: [
      ".NET Framework 4.5",
      "ASP.NET MVC",
      "AngularJS",
      "SQL Server",
      "Crystal Reports",
    ],
  },
];

export interface Certification {
  name: string;
  /** Program / course identifier (no exam code unless the exam was actually attempted). */
  code: string;
  issuer: string;
  color: "cyan" | "violet" | "blue";
  /** "training" = course/program completion certificate; "exam" = passed certification exam. */
  kind: "training" | "exam";
  /** Period the training was attended, e.g. "Aug – Sep 2025". */
  period?: string;
  /** Optional path under /public to the actual certificate image, used as proof. */
  proof?: string;
  /** Short factual description, shown in cards. */
  detail?: string;
}

export const CERTIFICATIONS: Certification[] = [
  {
    name: "Microsoft AI Developer Program",
    code: "Official course",
    issuer: "Microsoft · delivered by Skillsoft Global Knowledge",
    color: "cyan",
    kind: "training",
    period: "25 Aug – 30 Sep 2025",
    proof: "/certs/microsoft-ai-developer-program.png",
    detail:
      "Completed the full Microsoft Official Course covering Azure AI services, Copilot Studio, prompt engineering, RAG, and responsible AI.",
  },
  {
    name: "Azure AI Engineer track (AI-102)",
    code: "Training completed · exam not yet attempted",
    issuer: "Microsoft Learn",
    color: "violet",
    kind: "training",
    detail:
      "Worked through the full AI-102 curriculum — Azure OpenAI, Cognitive Services, knowledge mining, conversational AI — applied directly in production at SCAD.",
  },
  {
    name: "Azure Solutions Architect track (AZ-305)",
    code: "Training completed · exam not yet attempted",
    issuer: "Microsoft Learn",
    color: "blue",
    kind: "training",
    detail:
      "Self-paced study of architecture design patterns for Azure, identity, governance, data platform, and business-continuity design.",
  },
];

export const DIFFERENTIATORS = [
  "Deep production experience with LLM systems at government scale",
  "Architect-level fluency across cloud, RAG, vector search, and full stack",
  "Track record of measurable impact — cost down, throughput up",
  "Bridges cutting-edge AI capabilities with enterprise security & governance",
  "Vibe-coding advocate — ships polished products fast, end-to-end",
];

export const TYPEWRITER_PHRASES = [
  "AI Solutions Architect",
  "Enterprise LLM Systems",
  "RAG & Vector Search Specialist",
  "Conversational AI Builder",
  "Vibe Coding Advocate",
];

export const ROTATING_HEADLINES = [
  "Cut document research time from 2 hours to 10 seconds.",
  "Built an AI chatbot now handling 18K+ queries a month.",
  "Made 200+ non-technical staff fluent in SQL — without SQL.",
  "Shipped a vision pipeline saving 2,000 staff hours every month.",
  "Reduced GPT-4 API costs by 38% while improving response quality.",
];

export const PRINCIPLES = [
  {
    n: "01",
    title: "Production beats prototype.",
    body: "A demo is a hypothesis. Shipped software in front of real users is the only reliable signal.",
  },
  {
    n: "02",
    title: "Architecture is a forcing function.",
    body: "Choose the system shape that makes the right thing easy and the wrong thing visible.",
  },
  {
    n: "03",
    title: "Measure or it didn't happen.",
    body: "Latency, accuracy, cost, satisfaction — define them, instrument them, then iterate on numbers.",
  },
  {
    n: "04",
    title: "AI is plumbing, not magic.",
    body: "Retrieval, evaluation, guardrails, observability — the boring layers are what make the magic work.",
  },
];

export const NOW = {
  building: "Enterprise multi-agent orchestrator on Azure OpenAI",
  reading: "Engineering AI Systems — production patterns for LLM apps",
  available: "Open to senior AI architecture roles & consulting",
};

export const CV_CONTEXT = `
You are an AI assistant for Mazhar Hayat's portfolio website. Answer questions about Mazhar professionally, accurately, and concisely. Use third-person ("Mazhar has..." or "He has..."). Be enthusiastic about his work but factual.

ABOUT MAZHAR:
Name: Mazhar Hayat
Title: AI Solutions Architect | Enterprise LLM Systems & AI Platform Architect | Vibe Coding Advocate
Location: Abu Dhabi, UAE
Email: Mazhar1783@outlook.com
Phone: +971 556 127 178
LinkedIn: https://www.linkedin.com/in/mazharhayyat/
Experience: 15+ years

SUMMARY:
AI Solutions Architect with 15+ years building production-grade intelligent systems. Specializes in LLM integration, RAG architectures, and conversational AI. Expert in GPT-4, Azure OpenAI, and vector search for government and enterprise. Proven track record: 40% cost reduction, processing 100K+ documents, handling 15K+ daily user interactions.

KEY AI PROJECTS:
1. Enterprise RAG Document Intelligence (SCAD 2025): Processed 100K+ government documents. Retrieval time: 2-3 hours → 10 seconds. 92% accuracy. Costs cut 65%. Stack: GPT-4, LangChain, Pinecone, Azure Cognitive Search.
2. Conversational Analytics Platform (SCAD 2023-Present): Natural language to SQL. 200+ non-technical users. 15K+ monthly queries across 8 databases. 70% backlog reduction. Stack: GPT-4, Semantic Kernel, Azure OpenAI.
3. Document Processing Vision AI Pipeline (SCAD 2025): 1000+ daily docs automated. 30 seconds vs 15 minutes. 94% extraction accuracy. 2000+ staff hours saved monthly. Stack: GPT-4 Vision, Azure Form Recognizer.
4. AI Chatbot (SCAD 2023): 18K+ monthly queries. 90% first-contact resolution. 43% cost reduction.

EXPERIENCE:
- Senior System Analyst / AI Platforms @ Statistics Centre Abu Dhabi (Nov 2022 - Present)
- Senior Full Stack Engineer / Team Lead @ MoHRE UAE (July 2018 - Nov 2022)
- Senior Software Engineer / Technical Lead @ TRG Tech Pakistan (June 2015 - June 2018)
- Software Developer @ NETSOL Technologies (Dec 2012 - June 2015)

SKILLS:
- AI/ML: GPT-4, Claude 3.5, Gemini Pro, LangChain, Semantic Kernel, LlamaIndex, Haystack, MLflow
- RAG: Multi-stage retrieval, Pinecone, FAISS, Chroma, Azure Cognitive Search, Weaviate
- Cloud: Azure OpenAI, Azure Functions, Cosmos DB, Azure DevOps, Docker, Kubernetes, AWS
- Full Stack: .NET Core 8, Angular 17, React, TypeScript, Node.js, SQL Server

TRAINING & PROGRAMS:
- Microsoft AI Developer Program — Microsoft Official Course, completed Aug–Sep 2025 (Skillsoft Global Knowledge)
- Azure AI Engineer (AI-102) learning path — training completed via Microsoft Learn (exam not yet attempted)
- Azure Solutions Architect (AZ-305) learning path — training completed via Microsoft Learn (exam not yet attempted)

AVAILABILITY: Open to senior AI architecture roles, consulting engagements, and speaking opportunities in the UAE and globally.

If asked about salary, say Mazhar is open to discussing based on the role and scope.
If asked something you don't know, say you'd recommend reaching out directly via email or LinkedIn.
Keep responses under 150 words unless a detailed technical explanation is requested.
`;

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  relation: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Mazhar architected our RAG document intelligence system from scratch — 100K+ government documents, retrievable in seconds. His ability to translate a vague business problem into a precise, production-ready AI architecture is rare. He delivered on time, measured everything, and the system has run without issues for over a year.",
    name: "Senior Director",
    role: "Digital Transformation",
    company: "Statistics Centre Abu Dhabi (SCAD)",
    relation: "Direct stakeholder",
  },
  {
    quote:
      "He built the NL-to-SQL analytics platform that changed how 200+ of our non-technical staff work. What impressed me most wasn't the technology — it was his insistence on measuring accuracy before and after every change. He doesn't ship until the numbers say it's ready.",
    name: "Head of Analytics",
    role: "Data & Analytics",
    company: "SCAD",
    relation: "Internal client",
  },
  {
    quote:
      "Mazhar led the backend architecture for Tasheel — one of the highest-traffic government service platforms in the UAE. He brought the kind of calm, systematic thinking that made a complex distributed system feel simple. His code reviews alone upskilled the entire team.",
    name: "Engineering Manager",
    role: "Platform Engineering",
    company: "MoHRE UAE",
    relation: "Direct manager",
  },
];

export interface Article {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readMin: number;
  tags: string[];
  comingSoon?: boolean;
}

export const ARTICLES: Article[] = [
  {
    slug: "how-we-cut-document-research-from-2-hours-to-10-seconds",
    title: "How We Cut Document Research From 2 Hours to 10 Seconds",
    summary:
      "The architecture, trade-offs, and hard lessons from building an enterprise RAG system at SCAD that now handles 5,000+ queries a month with 92% accuracy.",
    date: "2026-04",
    readMin: 12,
    tags: ["RAG", "Azure OpenAI", "Pinecone", "Enterprise AI"],
    comingSoon: false,
  },
  {
    slug: "rag-from-prototype-to-production",
    title: "RAG from prototype to production: what nobody tells you",
    summary:
      "Chunking strategies, re-ranking, hybrid search, eval frameworks — the six decisions that separate a demo from a system that runs 24/7 in front of thousands of users.",
    date: "2025-11",
    readMin: 12,
    tags: ["RAG", "LangChain", "Azure OpenAI", "Production"],
    comingSoon: false,
  },
  {
    slug: "prompt-engineering-patterns",
    title: "Prompt engineering patterns I actually use in production",
    summary:
      "Few-shot, chain-of-thought, function calling, and system-prompt hygiene — with real examples from the systems I've shipped and the cost/quality trade-offs of each.",
    date: "2025-09",
    readMin: 9,
    tags: ["GPT-4", "Prompt Engineering", "Azure OpenAI"],
    comingSoon: false,
  },
  {
    slug: "nl-to-sql-accuracy",
    title: "Getting NL-to-SQL to 85%+ accuracy without fine-tuning",
    summary:
      "How schema injection, intent classification, execution-aware repair loops, and a good evaluation harness got our conversational analytics platform to production-grade accuracy.",
    date: "2025-07",
    readMin: 10,
    tags: ["Semantic Kernel", "SQL", "GPT-4", "NLP"],
    comingSoon: false,
  },
  {
    slug: "ai-cost-optimisation",
    title: "Cutting GPT-4 API costs 38% without hurting quality",
    summary:
      "The prompt engineering framework we built at SCAD — caching, token budgeting, model routing, and eval-driven iteration — that saved tens of thousands annually.",
    date: "2025-05",
    readMin: 7,
    tags: ["Cost Optimisation", "GPT-4", "LLMOps"],
    comingSoon: false,
  },
];


// -- Skill ? proof links --------------------------------------------------
// Map a skill item (string from SKILLS.items) to a proof URL.
// Used by <Skills /> to make the tags clickable evidence.
export const SKILL_PROOFS: Record<string, string> = {
  // RAG & retrieval
  "Pinecone": "/projects/rag-document-intelligence",
  "Re-ranking": "/projects/rag-document-intelligence",
  "Hybrid Search": "/projects/rag-document-intelligence",
  "Multi-stage Retrieval": "/projects/rag-document-intelligence",
  "OpenAI Embeddings": "/projects/rag-document-intelligence",
  "FAISS": "/projects/rag-document-intelligence",
  // LLMs
  "GPT-4 / GPT-3.5-Turbo": "/projects/rag-document-intelligence",
  "Azure OpenAI": "/projects/rag-document-intelligence",
  "Prompt Engineering": "/writing/prompt-engineering-patterns",
  "Few-shot Learning": "/projects/conversational-analytics",
  "Function Calling": "/projects/conversational-analytics",
  "Chain-of-Thought Reasoning": "/projects/rag-document-intelligence",
  // Frameworks
  "LangChain": "/projects/rag-document-intelligence",
  "Semantic Kernel": "/projects/conversational-analytics",
  "LlamaIndex": "/projects/rag-document-intelligence",
  // Architecture
  "Microservices": "/projects/conversational-analytics",
  "Event-Driven Architecture": "/projects/vision-ai-pipeline",
  "Cosmos DB": "/projects/vision-ai-pipeline",
  "Docker": "/projects/conversational-analytics",
  "Kubernetes": "/projects/conversational-analytics",
  // Full stack
  ".NET Core 8": "/projects/conversational-analytics",
  "TypeScript": "/stack",
  "React": "/stack",
  // Vision
  "Multi-turn Dialogue": "/projects/conversational-analytics",
  "Intent Classification": "/projects/conversational-analytics",
  "Entity Extraction": "/projects/vision-ai-pipeline",
};
