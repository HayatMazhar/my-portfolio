import Groq from "groq-sdk";
import { PROJECTS, PROJECT_STUDIES } from "@/data/cv";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildContext(slug: string): string | null {
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return null;
  const study = PROJECT_STUDIES[slug];

  const parts: string[] = [];
  parts.push(`PROJECT: ${project.title}`);
  parts.push(`COMPANY: ${project.company}`);
  parts.push(`YEAR: ${project.year}`);
  parts.push(`\nCHALLENGE: ${project.challenge}`);
  parts.push(`\nSOLUTION / APPROACH: ${project.solution}`);
  parts.push(`\nIMPACT:\n${project.impact.map((i) => `- ${i}`).join("\n")}`);
  parts.push(
    `\nMETRICS:\n${Object.entries(project.metrics).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`,
  );
  parts.push(`\nTECH STACK: ${project.stack.join(", ")}`);

  if (study) {
    parts.push(`\nTAGLINE: ${study.tagline}`);
    parts.push(`\nBEFORE: ${study.before}`);
    parts.push(`\nAFTER: ${study.after}`);
    parts.push(
      `\nTIMELINE:\n${study.timeline.map((t) => `- ${t.phase} (${t.period}): ${t.story}`).join("\n")}`,
    );
    parts.push(
      `\nKEY ARCHITECTURE DECISIONS:\n${study.decisions.map((d) => `- ${d.title}: ${d.why}`).join("\n")}`,
    );
    parts.push(
      `\nLESSONS LEARNED:\n${study.lessons.map((l) => `- ${l}`).join("\n")}`,
    );
    parts.push(`\nSTAKEHOLDER QUOTE: "${study.quote.text}" — ${study.quote.author}`);
  }

  return parts.join("\n");
}

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let slug = "";
  let question = "";
  try {
    const body = await req.json();
    slug = String(body.slug ?? "").trim();
    question = String(body.question ?? "").trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!slug || !question) {
    return new Response(
      JSON.stringify({ error: "slug and question are required." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const context = buildContext(slug);
  if (!context) {
    return new Response(
      JSON.stringify({ error: "Project not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const systemPrompt = `You are an AI assistant embedded in Mazhar Hayat's portfolio. The user is currently viewing a specific project case study and asking a question about it.

Answer using ONLY the project context below. If the user asks something not covered, say so honestly and suggest they ask the main portfolio chat or email Mazhar at Mazhar1783@outlook.com.

Be concise (2-5 sentences). Cite specific metrics or decisions when relevant. Stay in character as Mazhar's portfolio AI.

PROJECT CONTEXT:
${context}`;

  const groq = new Groq({ apiKey: groqKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_CHAT_MODEL,
          temperature: 0.4,
          max_tokens: 500,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
        });

        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        controller.enqueue(encoder.encode(`\n\n[error] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
