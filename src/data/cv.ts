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
  quote: { text: string; author: string };
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
    comingSoon: true,
  },
  {
    slug: "prompt-engineering-patterns",
    title: "Prompt engineering patterns I actually use in production",
    summary:
      "Few-shot, chain-of-thought, function calling, and system-prompt hygiene — with real examples from the systems I've shipped and the cost/quality trade-offs of each.",
    date: "2025-09",
    readMin: 9,
    tags: ["GPT-4", "Prompt Engineering", "Azure OpenAI"],
    comingSoon: true,
  },
  {
    slug: "nl-to-sql-accuracy",
    title: "Getting NL-to-SQL to 85%+ accuracy without fine-tuning",
    summary:
      "How schema injection, intent classification, execution-aware repair loops, and a good evaluation harness got our conversational analytics platform to production-grade accuracy.",
    date: "2025-07",
    readMin: 10,
    tags: ["Semantic Kernel", "SQL", "GPT-4", "NLP"],
    comingSoon: true,
  },
  {
    slug: "ai-cost-optimisation",
    title: "Cutting GPT-4 API costs 38% without hurting quality",
    summary:
      "The prompt engineering framework we built at SCAD — caching, token budgeting, model routing, and eval-driven iteration — that saved tens of thousands annually.",
    date: "2025-05",
    readMin: 7,
    tags: ["Cost Optimisation", "GPT-4", "LLMOps"],
    comingSoon: true,
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
