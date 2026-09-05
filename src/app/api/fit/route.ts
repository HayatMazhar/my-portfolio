import Groq from "groq-sdk";
import { RAG_CORPUS } from "@/data/rag-corpus";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";
import { FIT_JD_MAX_CHARS } from "@/lib/fit-ingest";
import { rateLimit } from "@/lib/rate-limit";

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

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Groq rejects the request when the model's own output is not valid JSON. */
function isJsonValidateFailure(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: number }).status === 400 &&
    JSON.stringify((err as { error?: unknown }).error ?? "").includes(
      "json_validate_failed",
    )
  );
}

function providerErrorStatus(err: unknown): number {
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? (err as { status?: number }).status
      : undefined;
  return status === 429 || status === 413 ? 429 : 502;
}

/** Provider errors carry internal details, so map them to something readable. */
function friendlyProviderError(err: unknown): string {
  const status = providerErrorStatus(err);
  if (status === 429) {
    return "The AI service is rate limited right now. Wait a moment and try again.";
  }
  return "The AI service could not complete the report. Please try again.";
}

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Every field the report UI renders must be present before it is worth showing. */
function isCompleteReport(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  return (
    nonEmpty(report.overallFit) &&
    typeof report.fitScore === "number" &&
    nonEmpty(report.headline) &&
    Array.isArray(report.strengths) &&
    report.strengths.length > 0 &&
    Array.isArray(report.gaps) &&
    nonEmpty(report.tailoredPitch) &&
    nonEmpty(report.suggestedNextStep)
  );
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "fit", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

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
  if (jd.length > FIT_JD_MAX_CHARS) {
    return new Response(
      JSON.stringify({
        error: `Job description too long (max ${FIT_JD_MAX_CHARS.toLocaleString()} characters).`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const groq = new Groq({ apiKey: groqKey });

  // The model occasionally emits malformed JSON (Groq rejects it outright) or
  // stops short of the trailing fields. Both are one-off sampling failures, so
  // a single retry recovers rather than showing the recruiter a broken report.
  for (let attempt = 0; attempt < 2; attempt++) {
    const isLastAttempt = attempt === 1;
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_CHAT_MODEL,
        temperature: 0.3,
        // Reasoning eats the completion budget before any JSON is written, and
        // "low" keeps a full report comfortably under the cap.
        reasoning_effort: "low",
        max_completion_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `MAZHAR'S CV CONTEXT (for grounding):\n\n${CV_CONTEXT}\n\n---\n\nJOB DESCRIPTION:\n\n${jd}\n\n---\n\nProduce the JSON fit report.`,
          },
        ],
      });

      const choice = completion.choices[0];
      let parsed: unknown;
      try {
        parsed = JSON.parse(choice?.message?.content ?? "{}");
      } catch {
        if (!isLastAttempt) continue;
        return jsonError("AI returned malformed JSON. Please try again.", 502);
      }

      // Hitting the token cap still yields parseable JSON, just with the
      // trailing fields dropped — which rendered as an empty pitch card.
      if (choice?.finish_reason === "length" || !isCompleteReport(parsed)) {
        if (!isLastAttempt) continue;
        return jsonError("The report came back incomplete. Please try again.", 502);
      }

      return new Response(JSON.stringify(parsed), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      if (isJsonValidateFailure(err) && !isLastAttempt) continue;
      return jsonError(friendlyProviderError(err), providerErrorStatus(err));
    }
  }

  return jsonError("The report came back incomplete. Please try again.", 502);
}
