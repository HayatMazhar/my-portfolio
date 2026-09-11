import type { LinkedInPostRow } from "./admin-types";
import {
  evaluatePostQuality,
  resolveLengthSpec,
} from "./linkedin-style-guide";

export interface PreflightIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  relatedPostId?: string;
}

export interface PreflightResult {
  ready: boolean;
  score: number;
  issues: PreflightIssue[];
}

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4),
  );
}

export function contentSimilarity(a: string, b: string): number {
  const left = significantWords(a);
  const right = significantWords(b);
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const word of left) {
    if (right.has(word)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

export function runPostPreflight(input: {
  post: LinkedInPostRow;
  otherPosts: LinkedInPostRow[];
  organizationConfigured: boolean;
}): PreflightResult {
  const { post } = input;
  const issues: PreflightIssue[] = [];
  const body = post.body.trim();

  if (!body) {
    issues.push({
      code: "empty",
      severity: "error",
      message: "Post body is empty.",
    });
  } else if (body.length > 3000) {
    issues.push({
      code: "too-long",
      severity: "error",
      message: `LinkedIn posts are limited to 3,000 characters; this draft has ${body.length}.`,
    });
  } else if (body.length < 80) {
    issues.push({
      code: "too-thin",
      severity: "warning",
      message: "The post is very short and may not deliver a complete idea.",
    });
  }

  if (
    post.publish_target === "organization" &&
    !input.organizationConfigured
  ) {
    issues.push({
      code: "organization-missing",
      severity: "error",
      message: "Company publishing is selected, but no organization URN is configured.",
    });
  }

  if (post.media_kind === "document" && !post.carousel_slides?.length) {
    issues.push({
      code: "document-missing",
      severity: "error",
      message: "Document publishing is selected, but carousel slides are missing.",
    });
  }

  if (
    post.generation_mode === "trend" &&
    !(post.sources?.length ?? 0)
  ) {
    issues.push({
      code: "source-missing",
      severity: "warning",
      message: "This trend post has no saved source to verify before publishing.",
    });
  }

  const duplicate = input.otherPosts
    .filter((candidate) => candidate.id !== post.id && candidate.body.trim())
    .map((candidate) => ({
      post: candidate,
      similarity: contentSimilarity(body, candidate.body),
    }))
    .sort((a, b) => b.similarity - a.similarity)[0];
  if (duplicate && duplicate.similarity >= 0.62) {
    issues.push({
      code: "duplicate",
      severity: "warning",
      message: `This draft is ${Math.round(duplicate.similarity * 100)}% similar to “${duplicate.post.topic.slice(0, 80)}”.`,
      relatedPostId: duplicate.post.id,
    });
  }

  const quality = evaluatePostQuality(
    body,
    resolveLengthSpec(
      post.length ?? "medium",
      post.target_word_count ?? undefined,
    ),
  );
  if (quality.score < 65) {
    issues.push({
      code: "quality",
      severity: "warning",
      message: `Writing quality is ${quality.score}/100. Review authenticity, specificity, and rhythm.`,
    });
  }

  return {
    ready: !issues.some((issue) => issue.severity === "error"),
    score: quality.score,
    issues,
  };
}
