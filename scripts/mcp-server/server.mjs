#!/usr/bin/env node
/**
 * Mazhar Hayat — CV MCP Server
 * ----------------------------------------------------------------------
 * A Model Context Protocol server that exposes my CV, projects, and the
 * live portfolio RAG corpus as tools any MCP-compatible AI agent can use.
 *
 * Why this exists:
 *   Most candidates put their CV on a website. I put mine in a protocol
 *   AI agents can query directly. If you're running an MCP-aware agent
 *   (Claude Desktop, Cursor, Cline, etc.), point it at this server and
 *   ask it questions about my experience. It will return structured,
 *   grounded answers — no hallucination, citations included.
 *
 * Run locally:
 *   npm install && node server.mjs
 *
 * Wire into Claude Desktop (claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "mazhar-cv": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/server.mjs"]
 *       }
 *     }
 *   }
 *
 * Tools exposed:
 *   - get_profile()         → name, title, location, contact, availability
 *   - list_projects()       → all projects with slugs + one-line summaries
 *   - get_project(slug)     → full case study for one project
 *   - list_skills()         → categorised skills with proof links
 *   - search_cv(query)      → keyword search across the entire corpus
 *   - check_fit(jd)         → opens the live /fit analyser URL with JD pre-filled
 *
 * Resources exposed:
 *   - cv://summary          → plain-text bio
 *   - cv://corpus           → full RAG corpus as JSON
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ── Static data (mirror of the website's /data/cv.ts highlights) ──────────
const PROFILE = {
  name: "Mazhar Hayat",
  title: "AI Solutions Architect",
  location: "Abu Dhabi, United Arab Emirates",
  email: "Mazhar1783@outlook.com",
  linkedin: "https://www.linkedin.com/in/mazharhayyat/",
  portfolio: "https://mazharhayat.live",
  yearsOfExperience: 15,
  availability: "Available from June 2026 for senior IC, principal, or hands-on tech-lead roles. Remote, hybrid (UAE), or relocation.",
  bookCall: "https://calendly.com/mazhar1783/15min",
};

const PROJECTS = [
  {
    slug: "rag-document-intelligence",
    title: "Enterprise RAG Document Intelligence",
    company: "Statistics Centre — Abu Dhabi",
    year: "2025",
    impact: "92% accuracy · 100K+ docs · sub-2s p95 · 65% cost cut · 24/7 uptime",
    summary: "Production RAG pipeline over 100K+ government documents. Hybrid retrieval, cross-encoder reranking, citation-by-default prompting.",
    stack: ["Azure OpenAI", "Pinecone", "LangChain", "Cohere rerank", "GPT-4"],
  },
  {
    slug: "conversational-analytics",
    title: "Conversational Analytics — NL-to-SQL",
    company: "Statistics Centre — Abu Dhabi",
    year: "2024",
    impact: "85%+ SQL accuracy · 200+ analysts · 8 databases · Arabic/English",
    summary: "Natural-language to SQL across 8 government databases. Schema injection, execution-aware repair loops, multilingual.",
    stack: ["Semantic Kernel", "GPT-4", ".NET 8", "SQL Server"],
  },
  {
    slug: "vision-ai-pipeline",
    title: "Vision AI Document Pipeline",
    company: "Statistics Centre — Abu Dhabi",
    year: "2024",
    impact: "2,000+ staff-hours/month saved · confidence-gated HITL",
    summary: "Document Intelligence + GPT-4 Vision pipeline. Type-aware routing to cheapest extractor that works.",
    stack: ["Azure Form Recognizer", "GPT-4 Vision", "Tesseract", "Cosmos DB"],
  },
  {
    slug: "tasheel-platform",
    title: "Tasheel — Labour Services Platform",
    company: "Ministry of Human Resources & Emiratisation",
    year: "2018-2022",
    impact: "50+ services · 2M+ annual users · government-scale uptime",
    summary: "Led full-stack development of UAE's flagship labour services platform. 50+ services for 2M+ annual users.",
    stack: [".NET", "Angular", "Azure", "Oracle"],
  },
];

const SKILLS = {
  "Generative AI & LLMs": ["GPT-4", "Claude 3.5", "Gemini Pro", "Azure OpenAI", "Prompt Engineering", "Function Calling"],
  "RAG & Vector Search": ["Pinecone", "FAISS", "Hybrid Search", "Cohere Rerank", "Multi-stage Retrieval"],
  "AI Frameworks": ["LangChain", "Semantic Kernel", "LlamaIndex"],
  "Cloud & Architecture": ["Azure OpenAI", "Cosmos DB", "Kubernetes", "Microservices", "Event-Driven"],
  "Full Stack": [".NET Core 8", "ASP.NET Web API", "Angular 17", "React", "TypeScript", "SQL Server"],
};

const CORPUS = [
  { id: "bio", category: "About", text: "Mazhar Hayat is an AI Solutions Architect with 15+ years of experience building production-grade intelligent systems. Based in Abu Dhabi, UAE. Specialises in LLM integration, RAG architectures, and conversational AI for government and enterprise environments." },
  { id: "rag-flagship", category: "Project · RAG", text: "Built and shipped an enterprise RAG document-intelligence system at SCAD. Indexes 100K+ government documents. 92% accuracy on a 50-question gold set. Sub-2s p95 latency. 65% cost reduction vs initial baseline. In production for 8 months, hasn't needed Mazhar in 3." },
  { id: "nl-sql", category: "Project · NL-to-SQL", text: "Natural-language to SQL platform across 8 government databases. 200+ analysts use it daily. 85%+ accuracy achieved through execution-aware repair loops — when the generated SQL errors, the LLM sees the error and iterates. Supports Arabic and English queries." },
  { id: "vision", category: "Project · Vision AI", text: "Document intelligence pipeline using Azure Form Recognizer + GPT-4 Vision + Tesseract OCR. Type-aware routing to the cheapest extractor that works. Confidence-gated human-in-loop for low-confidence extractions. Saves 2,000+ staff-hours per month." },
  { id: "philosophy", category: "Approach", text: "Believes evals are the new unit tests. Cite-or-refuse prompting. Confidence-gated UI. Cost-aware model routing. The boring stuff that turns demos into systems." },
  { id: "hiring", category: "Availability", text: "Open from June 2026 for senior IC, principal, or hands-on tech-lead AI roles. Remote, hybrid (UAE), or relocation for the right role. Looking for organisations that ship and measure AI quality." },
];

// ── MCP server setup ──────────────────────────────────────────────────────
const server = new Server(
  { name: "mazhar-cv", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_profile",
      description: "Get Mazhar Hayat's profile summary — name, title, location, contact, current availability, and a link to book a call.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "list_projects",
      description: "List all flagship projects in Mazhar's portfolio with slug, title, year, company, and one-line summary.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_project",
      description: "Get the full case study for one project. Use slug from list_projects.",
      inputSchema: {
        type: "object",
        properties: { slug: { type: "string", description: "Project slug, e.g. rag-document-intelligence" } },
        required: ["slug"],
      },
    },
    {
      name: "list_skills",
      description: "List skills grouped by category — Gen AI, RAG, frameworks, cloud, full-stack.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "search_cv",
      description: "Keyword search across Mazhar's CV corpus. Returns ranked relevant chunks. Use for specific questions like 'Has he used Pinecone?' or 'Arabic NLP experience'.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
        required: ["query"],
      },
    },
    {
      name: "check_fit",
      description: "Return the URL of the live AI Fit Analyser so the user (or recruiter) can paste a job description and get a structured fit report grounded against Mazhar's CV.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  switch (name) {
    case "get_profile":
      return text(JSON.stringify(PROFILE, null, 2));

    case "list_projects":
      return text(JSON.stringify(PROJECTS.map((p) => ({
        slug: p.slug,
        title: p.title,
        company: p.company,
        year: p.year,
        impact: p.impact,
      })), null, 2));

    case "get_project": {
      const slug = String(args.slug || "");
      const project = PROJECTS.find((p) => p.slug === slug);
      if (!project) {
        return text(`No project found with slug "${slug}". Use list_projects to see available slugs.`, true);
      }
      return text(JSON.stringify(project, null, 2));
    }

    case "list_skills":
      return text(JSON.stringify(SKILLS, null, 2));

    case "search_cv": {
      const query = String(args.query || "").toLowerCase();
      if (!query) return text("Provide a `query` argument.", true);
      // Simple keyword scoring — for real semantic search, agents should hit
      // the /api/rag-demo endpoint on the portfolio.
      const scored = CORPUS.map((c) => {
        const haystack = (c.text + " " + c.category).toLowerCase();
        let score = 0;
        for (const term of query.split(/\s+/).filter(Boolean)) {
          if (haystack.includes(term)) score += 1;
        }
        return { ...c, score };
      })
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      if (!scored.length) {
        return text(`No matches for "${query}". The live semantic RAG endpoint is at ${PROFILE.portfolio}/api/rag-demo — POST { query }.`);
      }
      return text(JSON.stringify(scored, null, 2));
    }

    case "check_fit":
      return text(JSON.stringify({
        url: `${PROFILE.portfolio}/fit`,
        instructions: "Paste a job description in the textarea. Returns a structured JSON fit report with strengths, gaps, tailored pitch, and suggested next step. Grounded against the full CV.",
        api: `${PROFILE.portfolio}/api/fit (POST { jd: string })`,
      }, null, 2));

    default:
      return text(`Unknown tool: ${name}`, true);
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "cv://summary",
      name: "Mazhar Hayat — short bio",
      description: "Plain-text bio paragraph.",
      mimeType: "text/plain",
    },
    {
      uri: "cv://corpus",
      name: "Full CV RAG corpus",
      description: "The same chunks indexed in Pinecone for the live portfolio RAG demo.",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const uri = req.params.uri;
  if (uri === "cv://summary") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `${PROFILE.name} — ${PROFILE.title} based in ${PROFILE.location}. ${PROFILE.yearsOfExperience}+ years shipping production software. Currently ${PROFILE.availability} Contact: ${PROFILE.email} · ${PROFILE.linkedin}`,
      }],
    };
  }
  if (uri === "cv://corpus") {
    return {
      contents: [{ uri, mimeType: "application/json", text: JSON.stringify(CORPUS, null, 2) }],
    };
  }
  throw new Error(`Unknown resource: ${uri}`);
});

function text(content, isError = false) {
  return {
    content: [{ type: "text", text: content }],
    isError,
  };
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[mazhar-cv-mcp] ready · stdio transport · 6 tools · 2 resources");
