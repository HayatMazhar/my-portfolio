import { extractFromUpload, extractFromUrl } from "@/lib/fit-ingest";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  // Each call can trigger an outbound fetch, so keep it tighter than chat.
  const limited = rateLimit(req, "fit-ingest", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const type = req.headers.get("content-type") ?? "";

  try {
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return jsonError("Choose a PDF, DOCX, or text file.");
      }
      const result = await extractFromUpload(file);
      return Response.json(result);
    }

    let body: { url?: string } = {};
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid request body");
    }
    const url = String(body.url ?? "").trim();
    if (!url) return jsonError("A URL or file is required.");
    const result = await extractFromUrl(url);
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not read that source.";
    return jsonError(msg, 422);
  }
}
