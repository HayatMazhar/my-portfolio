import { describe, expect, it } from "vitest";
import { recommendPublishingSlot } from "./linkedin-scheduling";
import type { LinkedInPostRow } from "./admin-types";

function measuredPost(
  postedAt: number,
  impressions: number,
  reactions: number,
): LinkedInPostRow {
  return {
    id: String(postedAt),
    topic: "Test",
    template: "lesson",
    tone: "professional",
    body: "Body",
    hook: "Hook",
    status: "posted",
    scheduled_at: null,
    posted_at: postedAt,
    linkedin_post_urn: "urn:li:share:1",
    linkedin_url: null,
    error_message: null,
    metrics: {
      impressions,
      reactions,
      comments: 0,
      reposts: 0,
      clicks: 0,
      recorded_at: postedAt,
    },
    created_at: postedAt,
    updated_at: postedAt,
  };
}

describe("recommendPublishingSlot", () => {
  it("uses Tuesday at 09:00 UAE before enough data exists", () => {
    const result = recommendPublishingSlot([]);
    expect(result.weekday).toBe(2);
    expect(result.hour).toBe(9);
    expect(result.basedOnPosts).toBe(0);
  });

  it("selects the measured hour with the highest engagement rate", () => {
    // Monday 08:00 UAE and Wednesday 10:00 UAE.
    const monday = Date.UTC(2026, 8, 7, 4);
    const wednesday = Date.UTC(2026, 8, 9, 6);
    const result = recommendPublishingSlot([
      measuredPost(monday, 1000, 20),
      measuredPost(wednesday, 1000, 90),
    ]);
    expect(result.weekday).toBe(3);
    expect(result.hour).toBe(10);
  });
});
