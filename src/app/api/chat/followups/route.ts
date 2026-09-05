import Groq from "groq-sdk";
import { CV_CONTEXT } from "@/data/cv";
import { GROQ_FAST_MODEL } from "@/lib/groq-models";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClientMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "followups", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

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
      reasoning_effort: "low",
      max_completion_tokens: 700,
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
    const parsed: unknown = match ? JSON.parse(match[0]) : [];
    const followups = Array.isArray(parsed)
      ? parsed.filter((q): q is string => typeof q === "string")
      : [];
    return Response.json({ followups: followups.slice(0, 3) });
  } catch (err) {
    console.error("followups failed", err);
    return Response.json({ followups: [] });
  }
}
