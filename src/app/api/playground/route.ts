import Groq from "groq-sdk";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an AI assistant embedded in Mazhar Hayat's portfolio playground.

The user has pasted their OWN document (could be a contract, JD, paper, meeting notes, anything). Their question follows.

Answer ONLY using the document. If the answer isn't in the document, say so honestly.
Be concise (3-6 sentences unless detail is requested).
If relevant, cite which part of the document supports your answer.

This is a demo of Mazhar's RAG / document-AI skills. Do not break character or discuss Mazhar — focus on the user's document.`;

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let doc = "";
  let question = "";
  try {
    const body = await req.json();
    doc = String(body.doc ?? "").trim();
    question = String(body.question ?? "").trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!doc || !question) {
    return new Response(
      JSON.stringify({ error: "Both document and question are required." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (doc.length > 20000) {
    return new Response(
      JSON.stringify({
        error: "Document too long (max 20,000 characters).",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const groq = new Groq({ apiKey: groqKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_CHAT_MODEL,
          temperature: 0.2,
          max_tokens: 600,
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `DOCUMENT:\n\n${doc}\n\n---\n\nQUESTION: ${question}`,
            },
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
