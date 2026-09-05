import Groq from "groq-sdk";
import { CV_CONTEXT } from "@/data/cv";
import { GROQ_FAST_MODEL } from "@/lib/groq-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return Response.json({ followups: [] });

  let payload: { messages?: ClientMessage[] } = {};
  try {
    payload = await req.json();
  } catch {
    return Response.json({ followups: [] });
  }

  const messages = (payload.messages ?? [])
    .filter(
      (m): m is ClientMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-6);

  if (messages.length === 0) return Response.json({ followups: [] });

  try {
    const groq = new Groq({ apiKey: groqKey });

    const result = await groq.chat.completions.create({
      model: GROQ_FAST_MODEL,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `${CV_CONTEXT}\n\nYou generate short follow-up questions a visitor might want to ask next. Return ONLY a JSON array of exactly 3 short strings (max 8 words each). No explanation, no markdown, just valid JSON like: ["question 1", "question 2", "question 3"]`,
        },
        ...messages,
        {
          role: "user",
          content:
            "Generate 3 natural follow-up questions based on our conversation.",
        },
      ],
    });

    const raw = result.choices[0]?.message?.content?.trim() ?? "[]";
    const match = raw.match(/\[.*\]/s);
    const followups: string[] = match ? JSON.parse(match[0]) : [];
    return Response.json({ followups: followups.slice(0, 3) });
  } catch {
    return Response.json({ followups: [] });
  }
}
