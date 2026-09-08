import type { PostTemplate } from "@/lib/admin-types";

export type PostTopicCategory =
  | "experience"
  | "project"
  | "skill"
  | "career";

export interface PostTopicSuggestion {
  id: string;
  category: PostTopicCategory;
  label: string;
  topic: string;
  suggestedTemplate: PostTemplate;
  cvAnchor: string;
}

export const POST_TOPIC_CATEGORIES: {
  id: PostTopicCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "experience",
    label: "From your experience",
    description: "Roles at SCAD, MoHRE, and earlier — real wins and lessons",
  },
  {
    id: "project",
    label: "From your projects",
    description: "Shipped systems with metrics recruiters care about",
  },
  {
    id: "skill",
    label: "Skills & architecture",
    description: "RAG, NL-to-SQL, prompt engineering, cloud AI",
  },
  {
    id: "career",
    label: "Career & POV",
    description: "15+ years shipping, government AI, what you believe",
  },
];

/** Curated angles grounded in Mazhar's CV — click to pre-fill the generator. */
export const POST_TOPIC_SUGGESTIONS: PostTopicSuggestion[] = [
  {
    id: "scad-rag-100k",
    category: "experience",
    label: "SCAD · 100K doc RAG",
    topic:
      "How we cut document research from hours to seconds with enterprise RAG at SCAD",
    suggestedTemplate: "case_study",
    cvAnchor: "SCAD RAG 100K documents Azure Cognitive Search",
  },
  {
    id: "scad-chatbot-18k",
    category: "experience",
    label: "SCAD · 18K queries/mo",
    topic:
      "What 18K monthly chatbot queries taught me about first-contact resolution in government AI",
    suggestedTemplate: "lesson",
    cvAnchor: "SCAD chatbot 18K monthly queries 90% resolution",
  },
  {
    id: "scad-nl-to-sql",
    category: "experience",
    label: "SCAD · NL-to-SQL",
    topic:
      "Letting 200 non-technical staff query 8 databases in plain English — without writing SQL",
    suggestedTemplate: "story",
    cvAnchor: "NL-to-SQL conversational analytics 15K queries",
  },
  {
    id: "scad-prompt-costs",
    category: "experience",
    label: "SCAD · cut GPT-4 costs 38%",
    topic:
      "How a prompt engineering framework cut GPT-4 API costs by 38% while improving quality",
    suggestedTemplate: "lesson",
    cvAnchor: "prompt engineering framework cost reduction SCAD",
  },
  {
    id: "mohre-tasheel",
    category: "experience",
    label: "MoHRE · Tasheel scale",
    topic:
      "Leading 50+ labor services apps for 2M+ users — lessons from MoHRE modernization",
    suggestedTemplate: "story",
    cvAnchor: "MoHRE Tasheel 2M users microservices",
  },
  {
    id: "mohre-microservices",
    category: "experience",
    label: "MoHRE · legacy → microservices",
    topic:
      "Migrating legacy government systems to microservices without breaking 30+ integrations",
    suggestedTemplate: "lesson",
    cvAnchor: "MoHRE microservices 45% performance OAuth APIs",
  },
  {
    id: "proj-rag-intelligence",
    category: "project",
    label: "Enterprise RAG system",
    topic:
      "Building enterprise RAG for 100K+ government documents — hybrid search, re-ranking, and what actually moved accuracy",
    suggestedTemplate: "case_study",
    cvAnchor: "Enterprise RAG Document Intelligence System Pinecone",
  },
  {
    id: "proj-vision-ai",
    category: "project",
    label: "Vision AI pipeline",
    topic:
      "From 15 minutes to 30 seconds per document — GPT-4 Vision in a production pipeline",
    suggestedTemplate: "case_study",
    cvAnchor: "Document Processing Vision AI pipeline Form Recognizer",
  },
  {
    id: "proj-portfolio-rag",
    category: "project",
    label: "This portfolio's RAG",
    topic:
      "Why I built a portfolio that runs RAG on itself — and what it proves to recruiters",
    suggestedTemplate: "story",
    cvAnchor: "portfolio site RAG demo Pinecone Groq",
  },
  {
    id: "skill-rag-production",
    category: "skill",
    label: "RAG in production",
    topic:
      "RAG prototypes are easy — here's what separates production RAG from demo-ware",
    suggestedTemplate: "hot_take",
    cvAnchor: "RAG production lessons hybrid retrieval re-ranking",
  },
  {
    id: "skill-vector-db",
    category: "skill",
    label: "Vector DB choices",
    topic:
      "Pinecone vs self-hosted pgvector for enterprise RAG — how I decide in government environments",
    suggestedTemplate: "hot_take",
    cvAnchor: "Pinecone vector search Azure Cognitive Search",
  },
  {
    id: "skill-azure-openai",
    category: "skill",
    label: "Azure OpenAI at scale",
    topic:
      "Shipping GPT-4 in UAE government environments — security, latency, and cost trade-offs",
    suggestedTemplate: "lesson",
    cvAnchor: "Azure OpenAI enterprise government UAE",
  },
  {
    id: "skill-vibe-coding",
    category: "skill",
    label: "Vibe coding & AI dev",
    topic:
      "What 'vibe coding' actually means when you've shipped 20+ production AI systems",
    suggestedTemplate: "hot_take",
    cvAnchor: "vibe coding AI development production systems",
  },
  {
    id: "career-15-years",
    category: "career",
    label: "15+ years shipping",
    topic:
      "From .NET enterprise apps to production LLM systems — what 15 years taught me about AI adoption",
    suggestedTemplate: "story",
    cvAnchor: "15 years experience career arc enterprise AI",
  },
  {
    id: "career-gov-ai",
    category: "career",
    label: "Government AI reality",
    topic:
      "Building AI in Abu Dhabi government — constraints that actually make you a better architect",
    suggestedTemplate: "lesson",
    cvAnchor: "Abu Dhabi government SCAD enterprise AI constraints",
  },
  {
    id: "career-hiring",
    category: "career",
    label: "Open to opportunities",
    topic:
      "What kind of AI architect roles I'm most excited about right now (and what I'm not)",
    suggestedTemplate: "hiring_signal",
    cvAnchor: "looking for next role AI Solutions Architect Abu Dhabi",
  },
  {
    id: "career-recruiter-pitch",
    category: "career",
    label: "For recruiters",
    topic:
      "If you're hiring for production RAG or enterprise LLM — here's what I bring in the first 90 days",
    suggestedTemplate: "hiring_signal",
    cvAnchor: "elevator pitch recruiters production AI",
  },
  {
    id: "career-lessons-shipping",
    category: "career",
    label: "Lessons from shipping AI",
    topic:
      "Three mistakes I see teams make when moving from AI prototype to production",
    suggestedTemplate: "lesson",
    cvAnchor: "lessons learned shipping production AI",
  },
];

export function getTopicSuggestion(id: string): PostTopicSuggestion | undefined {
  return POST_TOPIC_SUGGESTIONS.find((t) => t.id === id);
}

export function getTopicsByCategory(
  category: PostTopicCategory,
): PostTopicSuggestion[] {
  return POST_TOPIC_SUGGESTIONS.filter((t) => t.category === category);
}

export function pickRandomTopicSuggestion(): PostTopicSuggestion {
  const index = Math.floor(Math.random() * POST_TOPIC_SUGGESTIONS.length);
  return POST_TOPIC_SUGGESTIONS[index]!;
}
