import { describe, expect, it } from "vitest";
import {
  auditPostBody,
  countWords,
  evaluatePostQuality,
  resolveLengthSpec,
  sanitizeBody,
} from "./linkedin-style-guide";

describe("resolveLengthSpec", () => {
  it("uses the selected preset", () => {
    expect(resolveLengthSpec("short")).toMatchObject({
      minWords: 60,
      maxWords: 110,
    });
  });

  it("clamps custom targets to LinkedIn-safe limits", () => {
    expect(resolveLengthSpec("custom", 10).label).toBe("30 words");
    expect(resolveLengthSpec("custom", 900).label).toBe("500 words");
  });
});

describe("post style audit", () => {
  it("does not count a trailing hashtag block as post words", () => {
    expect(countWords("A short sentence here.\n\n#AI #Engineering")).toBe(4);
  });

  it("flags common AI-writing tells", () => {
    const spec = resolveLengthSpec("short");
    const audit = auditPostBody(
      "In today's ever-evolving landscape, this isn't just a tool, it's a game-changer. Moreover, it helps us leverage robust solutions.",
      spec,
    );
    expect(audit.issues.some((issue) => issue.includes("not just X"))).toBe(true);
    expect(audit.issues.some((issue) => issue.includes("corporate verbs"))).toBe(
      true,
    );
    expect(audit.issues.some((issue) => issue.includes("LinkedIn clichés"))).toBe(
      true,
    );
  });

  it("removes markdown without changing the wording", () => {
    expect(sanitizeBody("## Heading\n\n**Real detail**")).toBe(
      "Heading\n\nReal detail",
    );
  });

  it("scores specific writing above generic copy", () => {
    const spec = resolveLengthSpec("short");
    const specific = evaluatePostQuality(
      "38% failed.\n\nThe TypeScript API broke at 2pm. I rewrote the parser, measured it again, and the error disappeared.\n\nBut the useful lesson was smaller: test the boundary, not the happy path.",
      spec,
    );
    const generic = evaluatePostQuality(
      "In today's ever-evolving landscape, it is important to leverage seamless and cutting-edge solutions. Moreover, this can unlock transformative outcomes for everyone.",
      spec,
    );
    expect(specific.score).toBeGreaterThan(generic.score);
  });
});
