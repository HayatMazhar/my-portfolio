/**
 * Groq retired Llama 3.3 70B and Llama 3.1 8B for free/developer tiers on
 * 16 Aug 2026. Gemma 2 9B was already gone. These IDs are Groq's documented
 * replacements: https://console.groq.com/docs/deprecations
 */

export const GROQ_CHAT_MODEL = "openai/gpt-oss-120b";
export const GROQ_FAST_MODEL = "openai/gpt-oss-20b";
export const GROQ_PREVIEW_MODEL = "qwen/qwen3.6-27b";

export const GROQ_DEMO_MODELS = [
  { id: GROQ_CHAT_MODEL, label: "GPT-OSS 120B", hint: "best quality" },
  { id: GROQ_FAST_MODEL, label: "GPT-OSS 20B", hint: "fastest" },
  { id: GROQ_PREVIEW_MODEL, label: "Qwen 3.6 27B", hint: "preview" },
] as const;

export const GROQ_ALLOWED_MODELS: readonly string[] = GROQ_DEMO_MODELS.map(
  (m) => m.id,
);
