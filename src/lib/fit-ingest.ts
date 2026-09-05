import dns from "node:dns/promises";
import net from "node:net";
import mammoth from "mammoth";
import { extractText } from "unpdf";

export const FIT_JD_MAX_CHARS = 8000;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_REDIRECTS = 3;
// Rendering a JS-heavy posting takes noticeably longer than a plain fetch.
const RENDER_TIMEOUT_MS = 25_000;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google.com",
]);

export function looksLikeSingleUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isPrivateIp(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80")) return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return true;
}

async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That does not look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) links are allowed.");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost")) {
    throw new Error("That host cannot be fetched.");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("That host cannot be fetched.");
    return url;
  }
  const { address } = await dns.lookup(host, { all: false });
  if (isPrivateIp(address)) throw new Error("That host cannot be fetched.");
  return url;
}

function htmlToText(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|header|footer|blockquote)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return text;
}

type JsonLdNode = { "@type"?: unknown; [key: string]: unknown };

function collectJsonLdNodes(value: unknown, out: JsonLdNode[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdNodes(item, out);
    return;
  }
  if (!value || typeof value !== "object") return;
  const node = value as JsonLdNode;
  out.push(node);
  for (const key of ["@graph", "itemListElement", "item", "mainEntity"]) {
    if (key in node) collectJsonLdNodes(node[key], out);
  }
}

function isJobPosting(node: JsonLdNode): boolean {
  const raw = node["@type"];
  const types = Array.isArray(raw) ? raw : [raw];
  return types.some((t) => typeof t === "string" && t.toLowerCase() === "jobposting");
}

/** Many boards ship a schema.org JobPosting block that is cleaner than the page chrome. */
function jobPostingFromJsonLd(html: string): string {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      continue;
    }
    const nodes: JsonLdNode[] = [];
    collectJsonLdNodes(parsed, nodes);
    const posting = nodes.find(isJobPosting);
    if (!posting) continue;

    const org = posting.hiringOrganization;
    const orgName =
      org && typeof org === "object" && typeof (org as JsonLdNode).name === "string"
        ? ((org as JsonLdNode).name as string)
        : "";
    const parts = [
      typeof posting.title === "string" ? posting.title : "",
      orgName,
      typeof posting.description === "string" ? htmlToText(posting.description) : "",
    ].filter(Boolean);
    const joined = parts.join("\n\n").trim();
    if (joined) return joined;
  }
  return "";
}

/**
 * Pages that render their content client-side return an empty shell to a plain
 * fetch, so fall back to a reader proxy that executes the page's JavaScript.
 */
async function renderViaReader(url: URL): Promise<string> {
  if (process.env.FIT_URL_RENDER === "off") return "";
  const endpoint = process.env.FIT_URL_RENDER_ENDPOINT ?? "https://r.jina.ai/";
  const apiKey = process.env.JINA_API_KEY;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS);
  try {
    const res = await fetch(`${endpoint}${url.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: "text/plain",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    });
    if (!res.ok) return "";
    const body = (await res.text()).slice(0, 2 * FIT_JD_MAX_CHARS * 4);
    return stripReaderPreamble(body);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

/** The reader returns markdown; flatten it so the box reads like pasted text. */
function stripReaderPreamble(body: string): string {
  return body
    .replace(/^URL Source:.*$/gim, "")
    .replace(/^Published Time:.*$/gim, "")
    .replace(/^Markdown Content:\s*$/gim, "")
    .replace(/^Title:\s*/im, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)[*_]([^*_\n]+)[*_](?=\s|$)/g, "$1$2")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clip(text: string): { text: string; truncated: boolean } {
  if (text.length <= FIT_JD_MAX_CHARS) return { text, truncated: false };
  return { text: text.slice(0, FIT_JD_MAX_CHARS), truncated: true };
}

function tooThin(text: string): boolean {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length < 80;
}

async function readLimited(res: Response): Promise<ArrayBuffer> {
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) {
    throw new Error("That file is too large (max 4 MB).");
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) {
    throw new Error("That file is too large (max 4 MB).");
  }
  return buf;
}

async function fetchOnce(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent":
          "MazharHayatFitBot/1.0 (+https://mazharhayat.live/fit; recruiter JD ingest)",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Timed out fetching that URL.");
    }
    throw new Error("Could not reach that URL.");
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPublic(start: string): Promise<{ url: URL; res: Response }> {
  let current = await assertPublicHttpsUrl(start);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetchOnce(current);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("The page redirected without a location.");
      const next = new URL(loc, current);
      current = await assertPublicHttpsUrl(next.toString());
      continue;
    }
    if (!res.ok) {
      throw new Error(`Could not fetch that URL (HTTP ${res.status}).`);
    }
    return { url: current, res };
  }
  throw new Error("Too many redirects.");
}

export async function extractFromUrl(rawUrl: string): Promise<{
  text: string;
  source: string;
  truncated: boolean;
  via: "direct" | "rendered";
}> {
  const { url, res } = await fetchPublic(rawUrl);
  const type = (res.headers.get("content-type") ?? "").toLowerCase();
  const buf = await readLimited(res);
  const name = url.pathname.split("/").pop() ?? "";
  let extracted = await extractFromBytes(
    Buffer.from(buf),
    type,
    name || url.hostname,
  );
  let via: "direct" | "rendered" = "direct";

  if (tooThin(extracted)) {
    const rendered = await renderViaReader(url);
    if (!tooThin(rendered)) {
      extracted = rendered;
      via = "rendered";
    }
  }

  if (tooThin(extracted)) {
    throw new Error(
      "That page did not return a readable job description — it either builds the posting in the browser or hides it behind a login. Download it as PDF/DOCX and upload it, or paste the text.",
    );
  }
  const clipped = clip(extracted);
  return { ...clipped, source: url.toString(), via };
}

export async function extractFromBytes(
  buffer: Buffer,
  contentType: string,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase();
  const type = contentType.toLowerCase();

  if (
    type.includes("pdf") ||
    lower.endsWith(".pdf")
  ) {
    const result = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    return String(result.text).replace(/\u0000/g, " ").trim();
  }

  if (
    type.includes("wordprocessingml") ||
    type.includes("msword") ||
    lower.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (lower.endsWith(".doc")) {
    throw new Error(
      "Old .doc files are not supported. Save as .docx or PDF, or paste the text.",
    );
  }

  const asText = buffer.toString("utf8");
  if (
    type.includes("html") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm") ||
    /^\s*</.test(asText)
  ) {
    const structured = jobPostingFromJsonLd(asText);
    if (structured.length >= 200) return structured;
    const plain = htmlToText(asText);
    return structured.length > plain.length ? structured : plain;
  }

  return asText.trim();
}

export async function extractFromUpload(
  file: File,
): Promise<{ text: string; source: string; truncated: boolean }> {
  if (file.size > MAX_BYTES) {
    throw new Error("That file is too large (max 4 MB).");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const extracted = await extractFromBytes(
    buffer,
    file.type || "",
    file.name || "upload",
  );
  if (tooThin(extracted)) {
    throw new Error(
      "Could not read enough text from that file. Try a PDF, DOCX, or paste the JD.",
    );
  }
  const clipped = clip(extracted);
  return { ...clipped, source: file.name || "upload" };
}
