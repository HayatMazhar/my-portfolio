import "server-only";

import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const CACHE_DIR = path.join(process.cwd(), ".data", "generated-media");

interface CloudflareImageResponse {
  success?: boolean;
  result?: {
    image?: string;
  };
  errors?: Array<{ message?: string }>;
}

export interface GeneratedArtwork {
  dataUri: string;
  source: "cache" | "cloudflare";
}

function config(): {
  accountId: string;
  token: string;
  model: string;
} | null {
  if (process.env.IMAGE_PROVIDER?.trim().toLowerCase() !== "cloudflare") {
    return null;
  }
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !token) return null;
  return {
    accountId,
    token,
    model: process.env.IMAGE_MODEL?.trim() || DEFAULT_MODEL,
  };
}

function cachePath(prompt: string, model: string): string {
  const digest = createHash("sha256")
    .update(`${model}\n${prompt}`)
    .digest("hex")
    .slice(0, 24);
  return path.join(CACHE_DIR, `${digest}.jpg`);
}

function asDataUri(bytes: Uint8Array): string {
  return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
}

/**
 * Generate text-free artwork and cache it by prompt. A card preview is
 * requested repeatedly by Next/Image and the browser; without this cache every
 * request would spend another Workers AI allocation.
 */
export async function getCreativeArtwork(
  prompt: string,
  options: { refresh?: boolean } = {},
): Promise<GeneratedArtwork | null> {
  const current = config();
  if (!current || !prompt.trim()) return null;

  const file = cachePath(prompt, current.model);
  if (!options.refresh) {
    try {
      return { dataUri: asDataUri(await readFile(file)), source: "cache" };
    } catch {
      // A cache miss is expected on the first render.
    }
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    current.accountId,
  )}/ai/run/${current.model}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${current.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt.slice(0, 2048),
      steps: 8,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const payload = (await response.json().catch(() => null)) as
    | CloudflareImageResponse
    | null;
  const image = payload?.result?.image;
  if (!response.ok || !image) {
    const detail =
      payload?.errors?.map((error) => error.message).filter(Boolean).join("; ") ||
      `HTTP ${response.status}`;
    throw new Error(`Cloudflare image generation failed: ${detail}`);
  }

  const bytes = Buffer.from(image, "base64");
  if (bytes.length < 1_000) {
    throw new Error("Cloudflare returned an invalid image.");
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, bytes);
  return { dataUri: asDataUri(bytes), source: "cloudflare" };
}
