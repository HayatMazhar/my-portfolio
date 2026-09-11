import { describe, expect, it } from "vitest";
import { buildCardLayout } from "./linkedin-card";

const base = { topic: "RAG in production", body: "" };

describe("buildCardLayout", () => {
  it("uses the question layout when the hook asks something", () => {
    const layout = buildCardLayout({
      ...base,
      hook: "Why does your RAG pipeline get slower every week?",
      body: "Most teams never measure retrieval latency.",
    });
    expect(layout.template).toBe("question");
  });

  it("pulls the figure out for the stat layout", () => {
    const layout = buildCardLayout({
      ...base,
      hook: "We cut document research by 95% in six weeks",
      body: "The index was the bottleneck, not the model.",
    });
    expect(layout.template).toBe("stat");
    expect(layout.stat).toBe("95%");
    expect(layout.headline).not.toContain("95%");
  });

  it("collects bullets for the checklist layout", () => {
    const layout = buildCardLayout({
      ...base,
      hook: "Four things that broke our first RAG rollout",
      body: [
        "Here is what we learned.",
        "- Chunk size was wrong",
        "- No reranking step",
        "- Embeddings drifted",
        "- Nobody measured recall",
      ].join("\n"),
    });
    expect(layout.template).toBe("checklist");
    expect(layout.points).toEqual([
      "Chunk size was wrong",
      "No reranking step",
      "Embeddings drifted",
      "Nobody measured recall",
    ]);
  });

  it("splits before and after for the comparison layout", () => {
    const layout = buildCardLayout({
      ...base,
      hook: "Our retrieval stack looks nothing like it did",
      body:
        "Previously we embedded whole documents and hoped. Now we chunk by section and rerank the top fifty.",
    });
    expect(layout.template).toBe("comparison");
    expect(layout.left?.body).toContain("Previously");
    expect(layout.right?.body).toContain("Now");
  });

  it("falls back to a statement when nothing else fits", () => {
    const layout = buildCardLayout({
      ...base,
      hook: "Retrieval quality is a data problem",
      body: "Teams keep reaching for a bigger model.",
    });
    expect(layout.template).toBe("statement");
    expect(layout.headline).toBe("Retrieval quality is a data problem");
  });

  it("prefers the media title over the hook", () => {
    const layout = buildCardLayout({
      ...base,
      mediaTitle: "The index is the product",
      hook: "Something else entirely",
      body: "Body copy.",
    });
    expect(layout.headline).toBe("The index is the product");
  });

  it("drops hashtags and clips long headlines", () => {
    const layout = buildCardLayout({
      ...base,
      hook: `${"word ".repeat(60)}#AI #RAG`,
      body: "Body copy.",
    });
    expect(layout.headline).not.toContain("#AI");
    expect(layout.headline.length).toBeLessThanOrEqual(151);
    expect(layout.headline.endsWith("…")).toBe(true);
  });

  it("degrades an impossible override instead of rendering an empty card", () => {
    const layout = buildCardLayout(
      { ...base, hook: "No numbers here at all", body: "Plain prose." },
      "stat",
    );
    expect(layout.template).toBe("statement");
  });
});
