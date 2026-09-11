import { describe, expect, it } from "vitest";
import {
  contentSimilarity,
  runPostPreflight,
} from "./linkedin-preflight";
import type { LinkedInPostRow } from "./admin-types";

function post(patch: Partial<LinkedInPostRow> = {}): LinkedInPostRow {
  return {
    id: "one",
    topic: "Reliable AI systems",
    template: "lesson",
    tone: "professional",
    body: "A production AI system failed at 2pm.\n\nThe parser accepted malformed data, so I tightened the boundary checks and measured the result again.",
    hook: "A production AI system failed at 2pm.",
    status: "draft",
    scheduled_at: null,
    posted_at: null,
    linkedin_post_urn: null,
    linkedin_url: null,
    error_message: null,
    generation_mode: "cv",
    length: "short",
    publish_target: "member",
    media_kind: "none",
    created_at: 1,
    updated_at: 1,
    ...patch,
  };
}

describe("contentSimilarity", () => {
  it("ignores punctuation and common short words", () => {
    expect(
      contentSimilarity(
        "The production parser failed on malformed input.",
        "Production parser failed: malformed input!",
      ),
    ).toBeGreaterThan(0.75);
  });
});

describe("runPostPreflight", () => {
  it("blocks missing document slides and organization configuration", () => {
    const result = runPostPreflight({
      post: post({
        publish_target: "organization",
        media_kind: "document",
        carousel_slides: [],
      }),
      otherPosts: [],
      organizationConfigured: false,
    });
    expect(result.ready).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["organization-missing", "document-missing"]),
    );
  });

  it("warns when a substantially similar post already exists", () => {
    const current = post();
    const result = runPostPreflight({
      post: current,
      otherPosts: [
        post({
          id: "two",
          topic: "Earlier parser post",
          body: `${current.body}\n\nOne extra sentence.`,
        }),
      ],
      organizationConfigured: true,
    });
    expect(result.issues.some((issue) => issue.code === "duplicate")).toBe(true);
  });
});
