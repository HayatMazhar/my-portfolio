import "server-only";

import { EXPERIENCE, METRICS, PERSONAL, PROJECTS, SKILLS } from "@/data/cv";
import { RAG_CORPUS } from "@/data/rag-corpus";

function normalize(text: string): string {
  return text.toLowerCase();
}

function scoreChunk(text: string, query: string): number {
  const hay = normalize(text);
  const terms = normalize(query)
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length > 2);
  return terms.reduce((score, term) => (hay.includes(term) ? score + 1 : score), 0);
}

function pickRelevantCorpus(query: string, limit = 8): string {
  return RAG_CORPUS.map((chunk) => ({
    chunk,
    score:
      scoreChunk(`${chunk.title} ${chunk.content} ${chunk.category}`, query) +
      (chunk.category === "experience" || chunk.category === "projects" ? 0.5 : 0),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => `[${item.chunk.category}] ${item.chunk.title}: ${item.chunk.content.slice(0, 320)}`)
    .join("\n\n");
}

function pickRelevantProjects(query: string, limit = 4): string {
  return PROJECTS.filter((project) => scoreChunk(
    `${project.title} ${project.company} ${project.challenge} ${project.solution} ${project.impact.join(" ")}`,
    query,
  ) > 0)
    .slice(0, limit)
    .map(
      (p) =>
        `- ${p.title} (${p.company}): Challenge: ${p.challenge.slice(0, 140)} | Impact: ${p.impact.slice(0, 2).join("; ")} | Stack: ${p.stack.slice(0, 6).join(", ")}`,
    )
    .join("\n");
}

function pickRelevantExperience(query: string, limit = 2): string {
  return EXPERIENCE.filter((role) =>
    scoreChunk(
      `${role.role} ${role.company} ${role.highlights.join(" ")} ${role.stack.join(" ")}`,
      query,
    ) > 0,
  )
    .slice(0, limit)
    .map(
      (role) =>
        `${role.role} @ ${role.company} (${role.period}):\n${role.highlights
          .slice(0, 4)
          .map((h) => `  • ${h}`)
          .join("\n")}\n  Stack: ${role.stack.slice(0, 8).join(", ")}`,
    )
    .join("\n\n");
}

const BASELINE_CORPUS = RAG_CORPUS.slice(0, 10)
  .map((c) => `[${c.category}] ${c.title}: ${c.content.slice(0, 260)}`)
  .join("\n\n");

const BASELINE_PROJECTS = PROJECTS.filter((p) => p.featured)
  .slice(0, 5)
  .map((p) => `- ${p.title}: ${p.impact[0] ?? p.challenge.slice(0, 120)}`)
  .join("\n");

const METRICS_SNIPPET = METRICS.map((m) => `${m.value}${m.suffix} ${m.label}`).join(
  " · ",
);

const SKILLS_SNIPPET = Object.entries(SKILLS)
  .slice(0, 4)
  .map(([name, group]) => `${name}: ${group.items.slice(0, 5).join(", ")}`)
  .join("\n");

export function buildCvContext(input: {
  topic: string;
  cvAnchor?: string;
  extraContext?: string;
}): string {
  const query = [input.topic, input.cvAnchor, input.extraContext]
    .filter(Boolean)
    .join(" ");

  const relevantCorpus = pickRelevantCorpus(query);
  const relevantProjects = pickRelevantProjects(query);
  const relevantExperience = pickRelevantExperience(query);

  return [
    `AUTHOR: ${PERSONAL.name} — ${PERSONAL.title}`,
    `LOCATION: ${PERSONAL.location}`,
    `SUMMARY: ${PERSONAL.summary.slice(0, 500)}`,
    `KEY METRICS: ${METRICS_SNIPPET}`,
    "",
    "RELEVANT ROLES:",
    relevantExperience || EXPERIENCE.slice(0, 2)
      .map(
        (role) =>
          `${role.role} @ ${role.company}: ${role.highlights[0] ?? ""}`,
      )
      .join("\n"),
    "",
    "RELEVANT PROJECTS:",
    relevantProjects || BASELINE_PROJECTS,
    "",
    "SKILL CLUSTERS:",
    SKILLS_SNIPPET,
    "",
    "KNOWLEDGE BASE (most relevant chunks):",
    relevantCorpus || BASELINE_CORPUS,
  ].join("\n");
}
