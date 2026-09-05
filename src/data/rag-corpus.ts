/**
 * Structured knowledge chunks about Mazhar Hayat.
 * Each chunk is a discrete, retrievable unit — embedded once, queried at runtime.
 *
 * The corpus DATA now lives in `rag-corpus.data.mjs` so the plain-Node seed
 * script (`scripts/seed-pinecone.mjs`) and this typed app module share ONE
 * source of truth and can never drift. Edit chunks in `rag-corpus.data.mjs`.
 */
import {
  RAG_CORPUS_DATA,
  CORPUS_NAMESPACE,
  PINECONE_INDEX_NAME,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./rag-corpus.data.mjs";

export interface KnowledgeChunk {
  id: string;
  category: string;
  title: string;
  content: string;
}

export const RAG_CORPUS: KnowledgeChunk[] = RAG_CORPUS_DATA;

export {
  CORPUS_NAMESPACE,
  PINECONE_INDEX_NAME,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};
