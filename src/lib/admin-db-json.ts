import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import type {
  ContentSeries,
  EngagementCommentRow,
  EngagementCommentStatus,
  EngagementPollState,
  LinkedInAuthRow,
  LinkedInPostRow,
  PostAudience,
  PostGenerationMode,
  PostLength,
  PostMediaKind,
  PostSource,
  PostStatus,
  PostTemplate,
  PostVariant,
  PublishTarget,
} from "@/lib/admin-types";

export type {
  EngagementCommentRow,
  EngagementCommentStatus,
  EngagementPollState,
  ContentSeries,
  LinkedInAuthRow,
  LinkedInPostRow,
  PostAudience,
  PostGenerationMode,
  PostLength,
  PostStatus,
  PostTemplate,
} from "@/lib/admin-types";

interface AdminStore {
  settings: Record<string, string>;
  posts: LinkedInPostRow[];
  linkedinAuth: LinkedInAuthRow | null;
  engagementComments: EngagementCommentRow[];
  engagementPoll: EngagementPollState;
  contentSeries: ContentSeries[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "admin-store.json");

const emptyPollState = (): EngagementPollState => ({
  last_poll_at: null,
  last_poll_error: null,
  last_new_count: 0,
});

const emptyStore = (): AdminStore => ({
  settings: {},
  posts: [],
  linkedinAuth: null,
  engagementComments: [],
  engagementPoll: emptyPollState(),
  contentSeries: [],
});

function normalizeStore(store: AdminStore): AdminStore {
  store.settings ??= {};
  store.posts ??= [];
  store.engagementComments ??= [];
  store.engagementPoll ??= emptyPollState();
  store.contentSeries ??= [];
  return store;
}

let writeChain: Promise<void> = Promise.resolve();

function withStore<T>(fn: (store: AdminStore) => T | Promise<T>): Promise<T> {
  return (async () => {
    await mkdir(DATA_DIR, { recursive: true });
    let store: AdminStore;
    try {
      const raw = await readFile(STORE_PATH, "utf8");
      store = normalizeStore(JSON.parse(raw) as AdminStore);
    } catch {
      store = emptyStore();
    }
    const result = await fn(store);
    return result;
  })();
}

async function persist(store: AdminStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function mutateStore(mutator: (store: AdminStore) => void): Promise<void> {
  const task = writeChain.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    let store: AdminStore;
    try {
      const raw = await readFile(STORE_PATH, "utf8");
      store = normalizeStore(JSON.parse(raw) as AdminStore);
    } catch {
      store = emptyStore();
    }
    mutator(store);
    await persist(store);
  });
  writeChain = task.catch(() => {});
  return task;
}

export async function listPosts(status?: PostStatus): Promise<LinkedInPostRow[]> {
  return withStore((store) => {
    const posts = [...store.posts].sort((a, b) => b.updated_at - a.updated_at);
    return status ? posts.filter((p) => p.status === status) : posts;
  });
}

export async function getPost(id: string): Promise<LinkedInPostRow | null> {
  return withStore((store) => store.posts.find((p) => p.id === id) ?? null);
}

export async function createPost(input: {
  id: string;
  topic: string;
  template: PostTemplate;
  tone: string;
  body?: string;
  hook?: string | null;
  status?: PostStatus;
  generationMode?: PostGenerationMode;
  length?: PostLength;
  targetWordCount?: number | null;
  audience?: PostAudience;
  variants?: PostVariant[];
  alternativeHooks?: string[];
  sources?: PostSource[];
  seriesId?: string | null;
  scheduledAt?: number | null;
  publishTarget?: PublishTarget;
  mediaKind?: PostMediaKind;
  mediaTitle?: string | null;
}): Promise<LinkedInPostRow> {
  const now = Date.now();
  const post: LinkedInPostRow = {
    id: input.id,
    topic: input.topic,
    template: input.template,
    tone: input.tone,
    body: input.body ?? "",
    hook: input.hook ?? null,
    status: input.status ?? "draft",
    scheduled_at: input.scheduledAt ?? null,
    posted_at: null,
    linkedin_post_urn: null,
    linkedin_url: null,
    error_message: null,
    generation_mode: input.generationMode ?? "cv",
    length: input.length ?? "medium",
    target_word_count: input.targetWordCount ?? null,
    audience: input.audience ?? "general",
    variants: input.variants ?? [],
    alternative_hooks: input.alternativeHooks ?? [],
    sources: input.sources ?? [],
    metrics: null,
    series_id: input.seriesId ?? null,
    carousel_slides: [],
    publish_target: input.publishTarget ?? "member",
    media_kind: input.mediaKind ?? "none",
    media_title: input.mediaTitle ?? null,
    revisions: [],
    first_comment: null,
    hashtags: [],
    first_comment_posted_at: null,
    created_at: now,
    updated_at: now,
  };
  await mutateStore((store) => {
    store.posts.unshift(post);
  });
  return post;
}

export async function updatePost(
  id: string,
  patch: Partial<
    Pick<
      LinkedInPostRow,
      | "topic"
      | "template"
      | "tone"
      | "body"
      | "hook"
      | "status"
      | "scheduled_at"
      | "posted_at"
      | "linkedin_post_urn"
      | "linkedin_url"
      | "error_message"
      | "generation_mode"
      | "length"
      | "target_word_count"
      | "audience"
      | "variants"
      | "alternative_hooks"
      | "sources"
      | "metrics"
      | "series_id"
      | "carousel_slides"
      | "publish_target"
      | "media_kind"
      | "media_title"
      | "card_copy"
      | "first_comment"
      | "hashtags"
      | "first_comment_posted_at"
    >
  >,
): Promise<LinkedInPostRow | null> {
  let updated: LinkedInPostRow | null = null;
  await mutateStore((store) => {
    const idx = store.posts.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const current = store.posts[idx]!;
    const contentChanged =
      (patch.body !== undefined && patch.body !== current.body) ||
      (patch.hook !== undefined && patch.hook !== current.hook);
    const revisions = contentChanged && (current.body.trim() || current.hook)
      ? [
          {
            id: randomUUID(),
            body: current.body,
            hook: current.hook,
            created_at: Date.now(),
          },
          ...(current.revisions ?? []),
        ].slice(0, 20)
      : current.revisions;
    updated = {
      ...current,
      ...patch,
      revisions,
      updated_at: Date.now(),
    };
    store.posts[idx] = updated;
  });
  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  let removed = false;
  await mutateStore((store) => {
    const before = store.posts.length;
    store.posts = store.posts.filter((p) => p.id !== id);
    removed = store.posts.length < before;
  });
  return removed;
}

export async function getLinkedInAuth(): Promise<LinkedInAuthRow | null> {
  return withStore((store) =>
    // `scope` was added later; older stored rows won't have it.
    store.linkedinAuth
      ? { ...store.linkedinAuth, scope: store.linkedinAuth.scope ?? null }
      : null,
  );
}

export async function saveLinkedInAuth(auth: LinkedInAuthRow): Promise<void> {
  await mutateStore((store) => {
    store.linkedinAuth = auth;
  });
}

export async function clearLinkedInAuth(): Promise<void> {
  await mutateStore((store) => {
    store.linkedinAuth = null;
  });
}

export async function getPostCounts(): Promise<Record<PostStatus, number>> {
  return withStore((store) => {
    const counts: Record<PostStatus, number> = {
      draft: 0,
      approved: 0,
      scheduled: 0,
      posted: 0,
      failed: 0,
    };
    for (const post of store.posts) {
      if (post.status in counts) counts[post.status] += 1;
    }
    return counts;
  });
}

export async function listDueScheduledPosts(
  now = Date.now(),
): Promise<LinkedInPostRow[]> {
  return withStore((store) =>
    store.posts
      .filter(
        (p) =>
          p.status === "scheduled" &&
          p.scheduled_at != null &&
          p.scheduled_at <= now,
      )
      .sort((a, b) => (a.scheduled_at ?? 0) - (b.scheduled_at ?? 0)),
  );
}

export async function getGenerationLearningContext(): Promise<{
  styleExamples: string[];
  performanceInsights: string;
}> {
  return withStore((store) => {
    const approved = store.posts
      .filter(
        (post) =>
          (post.status === "approved" || post.status === "posted") &&
          post.body.trim().length > 0,
      )
      .sort((a, b) => b.updated_at - a.updated_at);

    const styleExamples = approved.slice(0, 3).map((post) => post.body);
    const measured = approved
      .filter((post) => (post.metrics?.impressions ?? 0) > 0)
      .map((post) => {
        const metrics = post.metrics!;
        const engagements =
          metrics.reactions + metrics.comments + metrics.reposts + metrics.clicks;
        return {
          post,
          rate: engagements / metrics.impressions,
        };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);

    const performanceInsights =
      measured.length === 0
        ? ""
        : measured
            .map(
              ({ post, rate }) =>
                `- ${post.template.replace("_", " ")} post about "${post.topic.slice(0, 90)}": ${(rate * 100).toFixed(1)}% recorded engagement`,
            )
            .join("\n");

    return { styleExamples, performanceInsights };
  });
}

export async function listContentSeries(): Promise<ContentSeries[]> {
  return withStore((store) =>
    [...store.contentSeries].sort((a, b) => b.created_at - a.created_at),
  );
}

export async function createContentSeries(
  series: ContentSeries,
): Promise<ContentSeries> {
  await mutateStore((store) => {
    store.contentSeries.unshift(series);
  });
  return series;
}

export async function updateContentSeries(
  id: string,
  patch: Partial<
    Pick<ContentSeries, "recurring" | "enabled" | "next_generation_at" | "post_count">
  >,
): Promise<ContentSeries | null> {
  let updated: ContentSeries | null = null;
  await mutateStore((store) => {
    const index = store.contentSeries.findIndex((series) => series.id === id);
    if (index === -1) return;
    updated = { ...store.contentSeries[index]!, ...patch };
    store.contentSeries[index] = updated;
  });
  return updated;
}

export async function getAppSettingRow(key: string): Promise<string | null> {
  return withStore((store) => store.settings[key] ?? null);
}

export async function setAppSettingRow(key: string, value: string): Promise<void> {
  await mutateStore((store) => {
    store.settings[key] = value;
  });
}

export async function listEngagementComments(
  status?: EngagementCommentStatus,
): Promise<EngagementCommentRow[]> {
  return withStore((store) => {
    const rows = [...store.engagementComments].sort(
      (a, b) => b.commented_at - a.commented_at,
    );
    return status ? rows.filter((row) => row.status === status) : rows;
  });
}

export async function getEngagementComment(
  id: string,
): Promise<EngagementCommentRow | null> {
  return withStore((store) => store.engagementComments.find((row) => row.id === id) ?? null);
}

export async function findEngagementCommentByLinkedInId(
  linkedinCommentId: string,
): Promise<EngagementCommentRow | null> {
  return withStore((store) =>
    store.engagementComments.find((row) => row.linkedin_comment_id === linkedinCommentId) ??
      null,
  );
}

export async function upsertEngagementComment(
  row: EngagementCommentRow,
): Promise<EngagementCommentRow> {
  await mutateStore((store) => {
    const idx = store.engagementComments.findIndex((item) => item.id === row.id);
    if (idx === -1) {
      store.engagementComments.unshift(row);
      return;
    }
    store.engagementComments[idx] = row;
  });
  return row;
}

export async function updateEngagementComment(
  id: string,
  patch: Partial<
    Pick<
      EngagementCommentRow,
      | "status"
      | "suggested_replies"
      | "coaching_note"
      | "approved_reply"
      | "replied_at"
      | "reply_comment_urn"
      | "error_message"
    >
  >,
): Promise<EngagementCommentRow | null> {
  let updated: EngagementCommentRow | null = null;
  await mutateStore((store) => {
    const idx = store.engagementComments.findIndex((row) => row.id === id);
    if (idx === -1) return;
    updated = {
      ...store.engagementComments[idx]!,
      ...patch,
      updated_at: Date.now(),
    };
    store.engagementComments[idx] = updated;
  });
  return updated;
}

export async function getEngagementPollState(): Promise<EngagementPollState> {
  return withStore((store) => ({ ...store.engagementPoll }));
}

export async function setEngagementPollState(
  patch: Partial<EngagementPollState>,
): Promise<void> {
  await mutateStore((store) => {
    store.engagementPoll = { ...store.engagementPoll, ...patch };
  });
}

export async function countEngagementComments(
  status?: EngagementCommentStatus,
): Promise<number> {
  return withStore((store) => {
    const rows = store.engagementComments;
    return status ? rows.filter((row) => row.status === status).length : rows.length;
  });
}

export async function readJsonStoreForMigration(): Promise<{
  settings: Record<string, string>;
  posts: LinkedInPostRow[];
  linkedinAuth: LinkedInAuthRow | null;
  engagementComments: EngagementCommentRow[];
  engagementPoll: EngagementPollState;
  contentSeries: ContentSeries[];
}> {
  return withStore((store) => ({
    settings: { ...store.settings },
    posts: [...store.posts],
    linkedinAuth: store.linkedinAuth,
    engagementComments: [...store.engagementComments],
    engagementPoll: { ...store.engagementPoll },
    contentSeries: [...store.contentSeries],
  }));
}
