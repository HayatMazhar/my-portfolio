import Groq from "groq-sdk";
import { CV_CONTEXT } from "@/data/cv";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "chat", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    return new Response(
      "AI is not configured. Set GROQ_API_KEY to enable the chat.",
      { status: 500 },
    );
  }

  let payload: { messages?: ClientMessage[] } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const messages = (payload.messages ?? [])
    .filter(
      (m): m is ClientMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-20);

  if (messages.length === 0) {
    return new Response("No messages provided.", { status: 400 });
  }

  const groq = new Groq({ apiKey: groqKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_CHAT_MODEL,
          max_tokens: 1024,
          stream: true,
          messages: [
            { role: "system", content: CV_CONTEXT },
            ...messages,
          ],
        });

        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected AI error.";
        controller.enqueue(encoder.encode(`\n\n[error] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Transfer-Encoding": "chunked",
    },
  });
}
