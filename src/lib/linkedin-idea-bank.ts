import type { LinkedInPostRow, PostAudience } from "./admin-types";
import {
  POST_TOPIC_SUGGESTIONS,
  type PostTopicSuggestion,
} from "./linkedin-post-topics";

function usedTopics(posts: LinkedInPostRow[]): Set<string> {
  return new Set(
    posts
      .map((post) => post.topic.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function unusedTopicSuggestions(
  posts: LinkedInPostRow[],
): PostTopicSuggestion[] {
  const used = usedTopics(posts);
  return POST_TOPIC_SUGGESTIONS.filter((suggestion) => {
    const topic = suggestion.topic.trim().toLowerCase();
    return (
      !used.has(topic) &&
      !posts.some(
        (post) =>
          post.topic.toLowerCase().includes(suggestion.label.toLowerCase()) ||
          (suggestion.cvAnchor &&
            post.body.toLowerCase().includes(suggestion.cvAnchor.toLowerCase().slice(0, 28))),
      )
    );
  });
}

export function usedTopicIds(posts: LinkedInPostRow[]): string[] {
  const unused = new Set(unusedTopicSuggestions(posts).map((item) => item.id));
  return POST_TOPIC_SUGGESTIONS.filter((item) => !unused.has(item.id)).map(
    (item) => item.id,
  );
}

export interface WeeklyPlanItem {
  dayOffset: number;
  suggestion: PostTopicSuggestion;
  audience: PostAudience;
}

export function buildWeeklyPlan(
  posts: LinkedInPostRow[],
  count = 3,
): WeeklyPlanItem[] {
  const unused = unusedTopicSuggestions(posts);
  const fallback = unused.length
    ? unused
    : POST_TOPIC_SUGGESTIONS.slice(0, count);
  return fallback.slice(0, count).map((suggestion, index) => ({
    dayOffset: index * 2,
    suggestion,
    audience: "engineering_leaders",
  }));
}
