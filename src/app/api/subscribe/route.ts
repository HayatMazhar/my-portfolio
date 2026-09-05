import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const limited = rateLimit(req, "subscribe", { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  let email = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 200) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const buttondownKey = process.env.BUTTONDOWN_API_KEY;

  if (buttondownKey) {
    try {
      const res = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          Authorization: `Token ${buttondownKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_address: email }),
      });
      // Buttondown returns 400 for duplicates; treat as success.
      if (!res.ok && res.status !== 400) {
        const text = await res.text();
        console.error("[subscribe] Buttondown error:", res.status, text);
      }
    } catch (err) {
      console.error("[subscribe] Buttondown exception:", err);
      // Don't fail the user-facing request — log and continue.
    }
  } else {
    console.warn(
      "[subscribe] BUTTONDOWN_API_KEY not set. Email not delivered:",
      email,
    );
  }

  return Response.json({ ok: true });
}
