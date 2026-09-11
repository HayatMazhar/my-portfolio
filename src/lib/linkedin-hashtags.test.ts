import { describe, expect, it } from "vitest";
import { suggestHashtags, withHashtags } from "./linkedin-hashtags";
import { unusedTopicSuggestions } from "./linkedin-idea-bank";
import { POST_TOPIC_SUGGESTIONS } from "./linkedin-post-topics";
import type { LinkedInPostRow } from "./admin-types";

describe("suggestHashtags", () => {
  it("keeps a short unique set and normalizes prefixes", () => {
    const tags = suggestHashtags({
      topic: "Enterprise RAG at SCAD",
      audience: "uae_government",
      template: "case_study",
      extra: ["#rag", "UAE"],
    });
    expect(tags).toContain("RAG");
    expect(tags).toContain("UAE");
    expect(tags.length).toBeLessThanOrEqual(5);
  });
});

describe("withHashtags", () => {
  it("appends only missing tags", () => {
    expect(
      withHashtags("A production parser failed.", ["RAG", "ArtificialIntelligence"]),
    ).toContain("#RAG");
    expect(withHashtags("Done #RAG", ["RAG"])).toBe("Done #RAG");
  });
});

describe("unusedTopicSuggestions", () => {
  it("hides topics already in the queue", () => {
    const suggestion = POST_TOPIC_SUGGESTIONS[0]!;
    const unused = unusedTopicSuggestions([
      {
        id: "1",
        topic: suggestion.topic,
        template: "lesson",
        tone: "professional",
        body: suggestion.cvAnchor,
        hook: null,
        status: "draft",
        scheduled_at: null,
        posted_at: null,
        linkedin_post_urn: null,
        linkedin_url: null,
        error_message: null,
        created_at: 1,
        updated_at: 1,
      } satisfies LinkedInPostRow,
    ]);
    expect(unused.some((item) => item.id === suggestion.id)).toBe(false);
    expect(unused.length).toBeLessThan(POST_TOPIC_SUGGESTIONS.length);
  });
});
