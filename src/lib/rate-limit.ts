/**
 * Lightweight in-memory rate limiter for API routes.
 *
 * Design notes:
 * - Zero-dependency, fixed-window counter keyed by client IP + route.
 * - Best-effort: state lives in the warm serverless/node instance's memory,
 *   so it protects against bursts from a single IP hitting a warm instance
 *   without any external store (fits the $0/month stack). For hard multi-region
 *   guarantees, swap the Map for Upstash Redis behind the same interface.
 * - Fails open: if anything unexpected happens, requests are allowed through.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Prevent unbounded memory growth on long-lived instances.
const MAX_BUCKETS = 10_000;

export interface RateLimitOptions {
  /** Max requests allowed per window. Default 20. */
  limit?: number;
  /** Window size in milliseconds. Default 60_000 (1 minute). */
  windowMs?: number;
}

/** Best-effort extraction of the caller's IP from proxy headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-nf-client-connection-ip") || // Netlify
    "unknown"
  );
}

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
  // If still over the cap after pruning expired entries, clear entirely.
  if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

/**
 * Returns a 429 `Response` when the caller has exceeded the limit for `key`,
 * or `null` when the request is allowed to proceed.
 *
 * @param key A stable identifier for the route, e.g. "chat" or "rag-demo".
 */
export function rateLimit(
  req: Request,
  key: string,
  opts: RateLimitOptions = {},
): Response | null {
  try {
    const limit = opts.limit ?? 20;
    const windowMs = opts.windowMs ?? 60_000;
    const now = Date.now();
    const id = `${key}:${getClientIp(req)}`;

    prune(now);

    const bucket = buckets.get(id);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(id, { count: 1, resetAt: now + windowMs });
      return null;
    }

    if (bucket.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return new Response(
        JSON.stringify({
          error:
            "Rate limit exceeded. Please slow down and try again in a moment.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
          },
        },
      );
    }

    bucket.count += 1;
    return null;
  } catch {
    // Fail open — never let the limiter take down a route.
    return null;
  }
}
