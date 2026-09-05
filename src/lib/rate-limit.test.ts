import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit, getClientIp } from "./rate-limit";

function reqFrom(ip: string): Request {
  return new Request("https://example.com/api/test", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

describe("getClientIp", () => {
  it("takes the first entry of x-forwarded-for", () => {
    const req = new Request("https://x.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://x.com", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("returns 'unknown' when no ip headers are present", () => {
    expect(getClientIp(new Request("https://x.com"))).toBe("unknown");
  });
});

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then returns 429", () => {
    const opts = { limit: 3, windowMs: 60_000 };
    // Unique key per test so buckets from other tests never interfere.
    const key = "test-allow-then-block";
    const ip = "203.0.113.10";

    expect(rateLimit(reqFrom(ip), key, opts)).toBeNull();
    expect(rateLimit(reqFrom(ip), key, opts)).toBeNull();
    expect(rateLimit(reqFrom(ip), key, opts)).toBeNull();

    const blocked = rateLimit(reqFrom(ip), key, opts);
    expect(blocked).toBeInstanceOf(Response);
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get("Retry-After")).toBeTruthy();
    expect(blocked!.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(blocked!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("tracks different IPs independently", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const key = "test-per-ip";

    expect(rateLimit(reqFrom("198.51.100.1"), key, opts)).toBeNull();
    // Same IP again is blocked...
    expect(rateLimit(reqFrom("198.51.100.1"), key, opts)).not.toBeNull();
    // ...but a different IP still gets its own allowance.
    expect(rateLimit(reqFrom("198.51.100.2"), key, opts)).toBeNull();
  });

  it("resets after the window elapses", () => {
    const opts = { limit: 1, windowMs: 1_000 };
    const key = "test-window-reset";
    const ip = "203.0.113.20";

    expect(rateLimit(reqFrom(ip), key, opts)).toBeNull();
    expect(rateLimit(reqFrom(ip), key, opts)).not.toBeNull();

    vi.advanceTimersByTime(1_001);

    expect(rateLimit(reqFrom(ip), key, opts)).toBeNull();
  });

  it("keys are namespaced by route", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const ip = "203.0.113.30";

    expect(rateLimit(reqFrom(ip), "route-a", opts)).toBeNull();
    // Same IP, different route → separate bucket.
    expect(rateLimit(reqFrom(ip), "route-b", opts)).toBeNull();
  });
});
