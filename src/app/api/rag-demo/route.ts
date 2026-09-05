import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CohereClient } from "cohere-ai";
import Groq from "groq-sdk";
import { CORPUS_NAMESPACE, PINECONE_INDEX_NAME } from "@/data/rag-corpus";
import { GROQ_ALLOWED_MODELS, GROQ_CHAT_MODEL } from "@/lib/groq-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TOP_K = 5;
const RETRIEVE_MULTIPLIER = 2; // when reranking, retrieve 2x more to rerank from

interface RetrievedChunk {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
}

export async function POST(req: Request) {
  const pineconeKey = process.env.PINECONE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!pineconeKey || !geminiKey || !groqKey) {
    const missing = !pineconeKey
      ? "PINECONE_API_KEY"
      : !geminiKey
        ? "GEMINI_API_KEY"
        : "GROQ_API_KEY";
    return new Response(JSON.stringify({ error: `RAG demo requires ${missing}.` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let query = "";
  let topK = DEFAULT_TOP_K;
  let useRerank = true;
  let model = GROQ_CHAT_MODEL;
  try {
    const body = await req.json();
    query = (body.query ?? "").trim();
    if (typeof body.topK === "number") {
      topK = Math.max(1, Math.min(10, Math.round(body.topK)));
    }
    if (typeof body.rerank === "boolean") {
      useRerank = body.rerank;
    }
    if (typeof body.model === "string") {
      if (GROQ_ALLOWED_MODELS.includes(body.model)) model = body.model;
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!query) {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const pc = new Pinecone({ apiKey: pineconeKey });
  const groq = new Groq({ apiKey: groqKey });
  const cohereKey = process.env.COHERE_API_KEY;

  // ── 1. Embed query with Gemini ─────────────────────────────────────────────
  const embModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
  const embResult = await embModel.embedContent(query);
  const queryVector = embResult.embedding.values;

  // ── 2. Retrieve from Pinecone ──────────────────────────────────────────────
  const index = pc.index(PINECONE_INDEX_NAME);
  const willRerank = useRerank && !!cohereKey;
  const retrieveCount = willRerank ? Math.min(20, topK * RETRIEVE_MULTIPLIER) : topK;

  const queryResult = await (index.namespace(CORPUS_NAMESPACE).query as (opts: {
    vector: number[];
    topK: number;
    includeMetadata: boolean;
  }) => Promise<{ matches?: Array<{ id: string; score?: number; metadata?: Record<string, unknown> }> }>)({
    vector: queryVector,
    topK: retrieveCount,
    includeMetadata: true,
  });

  let chunks: RetrievedChunk[] = (queryResult.matches ?? [])
    .filter((m) => (m.score ?? 0) > 0.2)
    .map((m) => ({
      id: m.id,
      title: String(m.metadata?.title ?? m.id),
      content: String(m.metadata?.content ?? ""),
      category: String(m.metadata?.category ?? ""),
      score: m.score ?? 0,
    }));

  // ── 3. Cohere rerank (if enabled + key available) ──────────────────────────
  const rerankScores: Record<string, number> = {};
  if (willRerank && chunks.length > 1) {
    try {
      const cohere = new CohereClient({ token: cohereKey });
      const rerankResult = await cohere.rerank({
        model: "rerank-v3.5",
        query,
        documents: chunks.map((c) => `${c.title}\n${c.content}`),
        topN: topK,
      });

      for (const r of rerankResult.results) {
        const chunk = chunks[r.index];
        if (chunk) rerankScores[chunk.id] = r.relevanceScore;
      }

      chunks = rerankResult.results
        .map((r) => ({ ...chunks[r.index]!, score: r.relevanceScore }))
        .filter(Boolean)
        .slice(0, topK);
    } catch {
      chunks = chunks.slice(0, topK);
    }
  } else {
    chunks = chunks.slice(0, topK);
  }

  if (chunks.length === 0) {
    return new Response(
      JSON.stringify({
        answer: "I couldn't find relevant information about that in Mazhar's CV. Try asking about his projects, skills, experience, or background.",
        chunks: [],
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 4. Stream answer with Groq ───────────────────────────────────────────
  const contextBlock = chunks
    .map((c, i) => `[SOURCE ${i + 1}: ${c.title}]\n${c.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are an AI assistant embedded in Mazhar Hayat's portfolio website. Answer questions about Mazhar using ONLY the provided source chunks. Be specific, cite sources by number (e.g. [1], [2]), and be concise (2-4 sentences unless detail is requested). Never make up information not in the sources.`;

  const userPrompt = `Sources:\n${contextBlock}\n\nQuestion: ${query}\n\nAnswer using the sources above and cite them by number:`;

  const encoder = new TextEncoder();
  const reranked = willRerank && Object.keys(rerankScores).length > 0;
  const t0 = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          max_tokens: 512,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }

        const sourcesPayload = chunks.map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          score: c.score,
          reranked,
        }));
        const meta = {
          chunks: sourcesPayload,
          stats: {
            latencyMs: Date.now() - t0,
            topK,
            retrieved: retrieveCount,
            reranked,
            model,
          },
        };
        controller.enqueue(
          encoder.encode(`\n\n__SOURCES__${JSON.stringify(meta)}`),
        );
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
