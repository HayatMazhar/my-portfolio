/**
 * Server-side URL guards for the /fit JD ingest feature.
 *
 * Kept in their own module (no `mammoth`/`unpdf` imports) so the SSRF-critical
 * logic can be unit-tested cheaply. These use `node:net` and are server-only —
 * do NOT import this from client components (see the client-safe copy of
 * `looksLikeSingleUrl` in `JdComposer.tsx`).
 */
import net from "node:net";

/** Returns a normalised http(s) URL if `text` is a single bare URL, else null. */
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

/**
 * True if `ip` is a private, loopback, link-local, or otherwise non-public
 * address. Non-IP input returns `true` (fail-closed) — callers should resolve
 * hostnames to an IP first.
 */
export function isPrivateIp(ip: string): boolean {
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
    if (mapped) return isPrivateIp(mapped[1]!);
    return false;
  }
  return true;
}
