/**
 * One-time script to embed the CV corpus and upsert into Pinecone.
 * Uses Google Gemini gemini-embedding-001 (free tier, 3072 dimensions).
 *
 * The corpus + index config are imported from `src/data/rag-corpus.data.mjs`,
 * the SAME module the live app uses — so the seed and the RAG demo can never
 * drift out of sync.
 *
 * Usage:
 *   node scripts/seed-pinecone.mjs
 *
 * Required env vars (in .env.local):
 *   PINECONE_API_KEY=...
 *   GEMINI_API_KEY=...
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import {
  RAG_CORPUS_DATA,
  CORPUS_NAMESPACE,
  PINECONE_INDEX_NAME,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "../src/data/rag-corpus.data.mjs";

// ── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = val;
  }
  console.log("✓ Loaded .env.local");
} catch {
  console.log("⚠ No .env.local found, using existing process.env");
}

// ── Corpus + config (single source of truth, shared with the app) ────────────
const CORPUS = RAG_CORPUS_DATA;
const INDEX_NAME = PINECONE_INDEX_NAME;
const NAMESPACE = CORPUS_NAMESPACE;
const DIMENSIONS = EMBEDDING_DIMENSIONS; // gemini-embedding-001 → 3072d

async function embedWithGemini(genAI, text) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pineconeKey = process.env.PINECONE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!pineconeKey) { console.error("❌ Missing PINECONE_API_KEY"); process.exit(1); }
  if (!geminiKey) { console.error("❌ Missing GEMINI_API_KEY"); process.exit(1); }

  const pc = new Pinecone({ apiKey: pineconeKey });
  const genAI = new GoogleGenerativeAI(geminiKey);

  // ── Delete old index if dimensions differ, recreate ───────────────────────
  const indexes = await pc.listIndexes();
  const existing = indexes.indexes?.find((i) => i.name === INDEX_NAME);

  if (existing) {
    const existingDim = existing.dimension;
    if (existingDim !== DIMENSIONS) {
      console.log(`Deleting old index (${existingDim}d) to recreate with ${DIMENSIONS}d...`);
      await pc.deleteIndex(INDEX_NAME);
      await sleep(5000);
    } else {
      console.log(`✓ Index '${INDEX_NAME}' exists with correct dimensions (${DIMENSIONS}d)`);
    }
  }

  // Re-check after potential deletion
  const indexes2 = await pc.listIndexes();
  const stillExists = indexes2.indexes?.some((i) => i.name === INDEX_NAME);

  if (!stillExists) {
    console.log(`Creating Pinecone index '${INDEX_NAME}' (${DIMENSIONS}d, cosine)...`);
    await pc.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSIONS,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    });
    console.log("Waiting for index to be ready...");
    for (let attempt = 0; attempt < 12; attempt++) {
      await sleep(10000);
      try {
        const desc = await pc.describeIndex(INDEX_NAME);
        if (desc.status?.ready) {
          console.log("  ✓ Index is ready");
          break;
        }
        console.log(`  ... still initializing (${attempt + 1}/12)`);
      } catch {
        console.log(`  ... waiting (${attempt + 1}/12)`);
      }
    }
  }

  const index = pc.index(INDEX_NAME);

  // ── Embed all chunks ──────────────────────────────────────────────────────
  console.log(`\nEmbedding ${CORPUS.length} chunks with Gemini ${EMBEDDING_MODEL}...`);
  const vectors = [];

  for (const chunk of CORPUS) {
    const text = `${chunk.title}\n\n${chunk.content}`;
    const embedding = await embedWithGemini(genAI, text);
    vectors.push({
      id: chunk.id,
      values: embedding,
      metadata: {
        category: chunk.category,
        title: chunk.title,
        content: chunk.content,
      },
    });
    console.log(`  ✓ ${chunk.id} (${embedding.length}d)`);
    await sleep(200); // Gentle rate limiting
  }

  // ── Upsert (Pinecone v7: { records: [...] }) ─────────────────────────────
  const BATCH_SIZE = 50;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await index.namespace(NAMESPACE).upsert({ records: batch });
    console.log(`  Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)`);
  }
  console.log(`\n✅ Done! ${vectors.length} vectors upserted to '${INDEX_NAME}' / '${NAMESPACE}'`);
  console.log(`\nAdd these to Netlify environment variables:`);
  console.log(`  PINECONE_API_KEY=<your pinecone key>`);
  console.log(`  GEMINI_API_KEY=<your gemini key>`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
