import { describe, expect, it } from "vitest";
import { isPrivateIp, looksLikeSingleUrl } from "./fit-url-guards";

describe("isPrivateIp — IPv4", () => {
  it.each([
    "10.0.0.1",
    "127.0.0.1",
    "0.0.0.0",
    "169.254.1.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
  ])("treats %s as private", (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "172.32.0.1", "172.15.0.1", "203.0.113.5"])(
    "treats %s as public",
    (ip) => {
      expect(isPrivateIp(ip)).toBe(false);
    },
  );
});

describe("isPrivateIp — IPv6", () => {
  it.each(["::1", "::", "fc00::1", "fd12:3456::1", "fe80::1"])(
    "treats %s as private",
    (ip) => {
      expect(isPrivateIp(ip)).toBe(true);
    },
  );

  it("treats a public IPv6 address as public", () => {
    expect(isPrivateIp("2001:4860:4860::8888")).toBe(false);
  });

  it("unwraps IPv4-mapped IPv6 addresses", () => {
    expect(isPrivateIp("::ffff:10.0.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("isPrivateIp — fail-closed", () => {
  it("returns true for non-IP input", () => {
    expect(isPrivateIp("example.com")).toBe(true);
    expect(isPrivateIp("not-an-ip")).toBe(true);
    expect(isPrivateIp("")).toBe(true);
  });
});

describe("looksLikeSingleUrl", () => {
  it("accepts a single http(s) URL and normalises it", () => {
    expect(looksLikeSingleUrl("https://example.com/jobs/1")).toBe(
      "https://example.com/jobs/1",
    );
    expect(looksLikeSingleUrl("  http://example.com  ")).toBe(
      "http://example.com/",
    );
  });

  it("rejects non-URL text", () => {
    expect(looksLikeSingleUrl("just some pasted job description")).toBeNull();
    expect(looksLikeSingleUrl("")).toBeNull();
  });

  it("rejects non-http protocols", () => {
    expect(looksLikeSingleUrl("ftp://example.com/file")).toBeNull();
    expect(looksLikeSingleUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects a URL followed by extra text (not a single URL)", () => {
    expect(looksLikeSingleUrl("https://example.com and more")).toBeNull();
  });
});
