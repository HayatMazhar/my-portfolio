import Groq from "groq-sdk";
import { RAG_CORPUS } from "@/data/rag-corpus";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compact CV context built from the corpus — no embedding needed for this use case
// since we ALWAYS send the full CV summary (it's only ~6K tokens, easily fits).
const CV_CONTEXT = RAG_CORPUS.map(
  (c) => `[${c.category.toUpperCase()} · ${c.title}]\n${c.content}`,
).join("\n\n");

const SYSTEM_PROMPT = `You are an honest, sharp AI hiring-fit analyst working on behalf of Mazhar Hayat (an AI Solutions Architect with 15+ years experience).

A recruiter or hiring manager pastes a JOB DESCRIPTION below. Your job is to produce a structured, honest fit report.

CRITICAL RULES:
- Be HONEST. Acknowledge gaps directly. Recruiters trust honesty more than oversell.
- Cite SPECIFIC evidence from Mazhar's CV — projects, metrics, technologies.
- If a requirement is missing or weak, say so plainly.
- Keep it concise. Recruiters scan, they don't read.

Output STRICT JSON (no markdown, no preamble) matching this shape:
{
  "overallFit": "strong" | "good" | "partial" | "weak",
  "fitScore": <integer 0-100>,
  "headline": "<one-sentence summary, max 20 words>",
  "strengths": [
    { "requirement": "<from the JD>", "evidence": "<specific project/metric from CV>" }
  ],
  "gaps": [
    { "requirement": "<from the JD>", "honestNote": "<acknowledged gap or compensating strength>" }
  ],
  "tailoredPitch": "<3-4 sentence pitch tailored to this JD — what to say in the first call>",
  "suggestedNextStep": "<concrete action, e.g. 'Book a 15-min call to discuss X'>"
}

Return ONLY the JSON. No code fences. No commentary.`;

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let jd = "";
  try {
    const body = await req.json();
    jd = String(body.jd ?? "").trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!jd) {
    return new Response(
      JSON.stringify({ error: "Job description is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (jd.length > 8000) {
    return new Response(
      JSON.stringify({
        error: "Job description too long (max 8,000 characters).",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const groq = new Groq({ apiKey: groqKey });

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `MAZHAR'S CV CONTEXT (for grounding):\n\n${CV_CONTEXT}\n\n---\n\nJOB DESCRIPTION:\n\n${jd}\n\n---\n\nProduce the JSON fit report.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({
          error: "AI returned malformed JSON. Please try again.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
