import "server-only";

import { randomUUID } from "crypto";
import { readJsonStoreForMigration } from "@/lib/admin-db-json";
import { ensureTursoSchema, getTursoClient } from "@/lib/turso";
import type {
  ContentSeries,
  EngagementCommentRow,
  EngagementCommentStatus,
  EngagementPollState,
  EngagementReplyDraft,
  LinkedInAuthRow,
  LinkedInPostRow,
  PostAudience,
  PostGenerationMode,
  PostLength,
  PostMediaKind,
  PostMetrics,
  PostRevision,
  PostSource,
  PostStatus,
  PostTemplate,
  PostVariant,
  PublishTarget,
  CarouselSlide,
} from "@/lib/admin-types";
import type { CardCopy } from "@/lib/linkedin-card";

function authArgs(auth: LinkedInAuthRow) {
  return {
    access_token: auth.access_token,
    refresh_token: auth.refresh_token,
    expires_at: auth.expires_at,
    member_urn: auth.member_urn,
    updated_at: auth.updated_at,
    scope: auth.scope ?? null,
  };
}

function pollArgs(poll: EngagementPollState) {
  return {
    last_poll_at: poll.last_poll_at,
    last_poll_error: poll.last_poll_error,
    last_new_count: poll.last_new_count,
  };
}

function seriesArgs(series: ContentSeries) {
  return {
    id: series.id,
    name: series.name,
    theme: series.theme,
    audience: series.audience,
    interval_days: series.interval_days,
    post_count: series.post_count,
    recurring: series.recurring ? 1 : 0,
    enabled: series.enabled === false ? 0 : 1,
    next_generation_at: series.next_generation_at ?? null,
    created_at: series.created_at,
  };
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function asNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapPost(row: Record<string, unknown>): LinkedInPostRow {
  return {
    id: String(row.id),
    topic: String(row.topic ?? ""),
    template: String(row.template ?? "story") as PostTemplate,
    tone: String(row.tone ?? "professional"),
    body: String(row.body ?? ""),
    hook: row.hook == null ? null : String(row.hook),
    status: String(row.status ?? "draft") as PostStatus,
    scheduled_at: asNumber(row.scheduled_at),
    posted_at: asNumber(row.posted_at),
    linkedin_post_urn:
      row.linkedin_post_urn == null ? null : String(row.linkedin_post_urn),
    linkedin_url: row.linkedin_url == null ? null : String(row.linkedin_url),
    error_message: row.error_message == null ? null : String(row.error_message),
    generation_mode: (row.generation_mode as PostGenerationMode) || "cv",
    length: (row.length as PostLength) || "medium",
    target_word_count: asNumber(row.target_word_count),
    audience: (row.audience as PostAudience) || "general",
    variants: parseJson<PostVariant[]>(row.variants_json, []),
    alternative_hooks: parseJson<string[]>(row.alternative_hooks_json, []),
    sources: parseJson<PostSource[]>(row.sources_json, []),
    metrics: parseJson<PostMetrics | null>(row.metrics_json, null),
    series_id: row.series_id == null ? null : String(row.series_id),
    carousel_slides: parseJson<CarouselSlide[]>(row.carousel_slides_json, []),
    publish_target: (row.publish_target as PublishTarget) || "member",
    media_kind: (row.media_kind as PostMediaKind) || "none",
    media_title: row.media_title == null ? null : String(row.media_title),
    card_copy: parseJson<CardCopy | null>(row.card_copy_json, null),
    revisions: parseJson<PostRevision[]>(row.revisions_json, []),
    first_comment: row.first_comment == null ? null : String(row.first_comment),
    hashtags: parseJson<string[]>(row.hashtags_json, []),
    first_comment_posted_at: asNumber(row.first_comment_posted_at),
    created_at: asNumber(row.created_at) ?? Date.now(),
    updated_at: asNumber(row.updated_at) ?? Date.now(),
  };
}

function postInsertArgs(post: LinkedInPostRow) {
  return {
    sql: `INSERT INTO posts (
      id, topic, template, tone, body, hook, status, scheduled_at, posted_at,
      linkedin_post_urn, linkedin_url, error_message, generation_mode, length,
      target_word_count, audience, variants_json, alternative_hooks_json,
      sources_json, metrics_json, series_id, carousel_slides_json, publish_target,
      media_kind, media_title, card_copy_json, revisions_json, first_comment,
      hashtags_json, first_comment_posted_at, created_at, updated_at
    ) VALUES (
      :id, :topic, :template, :tone, :body, :hook, :status, :scheduled_at, :posted_at,
      :linkedin_post_urn, :linkedin_url, :error_message, :generation_mode, :length,
      :target_word_count, :audience, :variants_json, :alternative_hooks_json,
      :sources_json, :metrics_json, :series_id, :carousel_slides_json, :publish_target,
      :media_kind, :media_title, :card_copy_json, :revisions_json, :first_comment,
      :hashtags_json, :first_comment_posted_at, :created_at, :updated_at
    )`,
    args: {
      id: post.id,
      topic: post.topic,
      template: post.template,
      tone: post.tone,
      body: post.body,
      hook: post.hook,
      status: post.status,
      scheduled_at: post.scheduled_at,
      posted_at: post.posted_at,
      linkedin_post_urn: post.linkedin_post_urn,
      linkedin_url: post.linkedin_url,
      error_message: post.error_message,
      generation_mode: post.generation_mode ?? "cv",
      length: post.length ?? "medium",
      target_word_count: post.target_word_count ?? null,
      audience: post.audience ?? "general",
      variants_json: JSON.stringify(post.variants ?? []),
      alternative_hooks_json: JSON.stringify(post.alternative_hooks ?? []),
      sources_json: JSON.stringify(post.sources ?? []),
      metrics_json: post.metrics ? JSON.stringify(post.metrics) : null,
      series_id: post.series_id ?? null,
      carousel_slides_json: JSON.stringify(post.carousel_slides ?? []),
      publish_target: post.publish_target ?? "member",
      media_kind: post.media_kind ?? "none",
      media_title: post.media_title ?? null,
      card_copy_json: post.card_copy ? JSON.stringify(post.card_copy) : null,
      revisions_json: JSON.stringify(post.revisions ?? []),
      first_comment: post.first_comment ?? null,
      hashtags_json: JSON.stringify(post.hashtags ?? []),
      first_comment_posted_at: post.first_comment_posted_at ?? null,
      created_at: post.created_at,
      updated_at: post.updated_at,
    },
  };
}

async function migrateFromJsonIfNeeded(): Promise<void> {
  const db = getTursoClient();
  const marker = await db.execute(
    "SELECT value FROM meta WHERE key = 'json_migrated_at'",
  );
  if (marker.rows[0]) return;

  const store = await readJsonStoreForMigration();
  const hasData =
    Object.keys(store.settings).length > 0 ||
    store.posts.length > 0 ||
    store.linkedinAuth != null ||
    store.engagementComments.length > 0 ||
    store.contentSeries.length > 0;

  if (hasData) {
    for (const [key, value] of Object.entries(store.settings)) {
      await db.execute({
        sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (:key, :value)",
        args: { key, value },
      });
    }
    for (const post of store.posts) {
      await db.execute(postInsertArgs(post));
    }
    if (store.linkedinAuth) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO linkedin_auth
          (id, access_token, refresh_token, expires_at, member_urn, updated_at, scope)
          VALUES (1, :access_token, :refresh_token, :expires_at, :member_urn, :updated_at, :scope)`,
        args: authArgs(store.linkedinAuth),
      });
    }
    for (const comment of store.engagementComments) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO engagement_comments (
          id, post_id, post_topic, linkedin_post_urn, linkedin_comment_id,
          linkedin_comment_urn, linkedin_activity_urn, author_urn, author_label,
          comment_text, commented_at, status, suggested_replies_json, coaching_note,
          approved_reply, replied_at, reply_comment_urn, error_message, created_at, updated_at
        ) VALUES (
          :id, :post_id, :post_topic, :linkedin_post_urn, :linkedin_comment_id,
          :linkedin_comment_urn, :linkedin_activity_urn, :author_urn, :author_label,
          :comment_text, :commented_at, :status, :suggested_replies_json, :coaching_note,
          :approved_reply, :replied_at, :reply_comment_urn, :error_message, :created_at, :updated_at
        )`,
        args: commentArgs(comment),
      });
    }
    await db.execute({
      sql: `INSERT OR REPLACE INTO engagement_poll
        (id, last_poll_at, last_poll_error, last_new_count)
        VALUES (1, :last_poll_at, :last_poll_error, :last_new_count)`,
      args: pollArgs(store.engagementPoll),
    });
    for (const series of store.contentSeries) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO content_series
          (id, name, theme, audience, interval_days, post_count, recurring, enabled,
           next_generation_at, created_at)
          VALUES (:id, :name, :theme, :audience, :interval_days, :post_count,
           :recurring, :enabled, :next_generation_at, :created_at)`,
        args: seriesArgs(series),
      });
    }
  }

  await db.execute({
    sql: "INSERT OR REPLACE INTO meta (key, value) VALUES ('json_migrated_at', :value)",
    args: { value: String(Date.now()) },
  });
}

let migrationReady: Promise<void> | null = null;
let migrationStarted = false;

async function ready(): Promise<void> {
  await ensureTursoSchema();
  if (!migrationStarted) {
    migrationStarted = true;
    migrationReady = migrateFromJsonIfNeeded().catch((err) => {
      migrationStarted = false;
      migrationReady = null;
      throw err;
    });
  }
  await migrationReady!;
}

export async function listPosts(status?: PostStatus): Promise<LinkedInPostRow[]> {
  await ready();
  const result = status
    ? await getTursoClient().execute({
        sql: "SELECT * FROM posts WHERE status = :status ORDER BY updated_at DESC",
        args: { status },
      })
    : await getTursoClient().execute(
        "SELECT * FROM posts ORDER BY updated_at DESC",
      );
  return result.rows.map((row) => mapPost(row as Record<string, unknown>));
}

export async function getPost(id: string): Promise<LinkedInPostRow | null> {
  await ready();
  const result = await getTursoClient().execute({
    sql: "SELECT * FROM posts WHERE id = :id",
    args: { id },
  });
  const row = result.rows[0];
  return row ? mapPost(row as Record<string, unknown>) : null;
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
  await ready();
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
  await getTursoClient().execute(postInsertArgs(post));
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
  await ready();
  const existing = await getPost(id);
  if (!existing) return null;
  const contentChanged =
    (patch.body !== undefined && patch.body !== existing.body) ||
    (patch.hook !== undefined && patch.hook !== existing.hook);
  const revisions = contentChanged && (existing.body.trim() || existing.hook)
    ? [
        {
          id: randomUUID(),
          body: existing.body,
          hook: existing.hook,
          created_at: Date.now(),
        },
        ...(existing.revisions ?? []),
      ].slice(0, 20)
    : existing.revisions;
  const updated: LinkedInPostRow = {
    ...existing,
    ...patch,
    revisions,
    updated_at: Date.now(),
  };
  const result = await getTursoClient().execute({
    sql: `UPDATE posts SET
      topic = :topic, template = :template, tone = :tone, body = :body, hook = :hook,
      status = :status, scheduled_at = :scheduled_at, posted_at = :posted_at,
      linkedin_post_urn = :linkedin_post_urn, linkedin_url = :linkedin_url,
      error_message = :error_message, generation_mode = :generation_mode, length = :length,
      target_word_count = :target_word_count, audience = :audience,
      variants_json = :variants_json, alternative_hooks_json = :alternative_hooks_json,
      sources_json = :sources_json, metrics_json = :metrics_json, series_id = :series_id,
      carousel_slides_json = :carousel_slides_json, publish_target = :publish_target,
      media_kind = :media_kind, media_title = :media_title,
      card_copy_json = :card_copy_json,
      revisions_json = :revisions_json, first_comment = :first_comment,
      hashtags_json = :hashtags_json,
      first_comment_posted_at = :first_comment_posted_at, updated_at = :updated_at
      WHERE id = :id`,
    args: {
      id,
      topic: updated.topic,
      template: updated.template,
      tone: updated.tone,
      body: updated.body,
      hook: updated.hook,
      status: updated.status,
      scheduled_at: updated.scheduled_at,
      posted_at: updated.posted_at,
      linkedin_post_urn: updated.linkedin_post_urn,
      linkedin_url: updated.linkedin_url,
      error_message: updated.error_message,
      generation_mode: updated.generation_mode ?? "cv",
      length: updated.length ?? "medium",
      target_word_count: updated.target_word_count ?? null,
      audience: updated.audience ?? "general",
      variants_json: JSON.stringify(updated.variants ?? []),
      alternative_hooks_json: JSON.stringify(updated.alternative_hooks ?? []),
      sources_json: JSON.stringify(updated.sources ?? []),
      metrics_json: updated.metrics ? JSON.stringify(updated.metrics) : null,
      series_id: updated.series_id ?? null,
      carousel_slides_json: JSON.stringify(updated.carousel_slides ?? []),
      publish_target: updated.publish_target ?? "member",
      media_kind: updated.media_kind ?? "none",
      media_title: updated.media_title ?? null,
      card_copy_json: updated.card_copy ? JSON.stringify(updated.card_copy) : null,
      revisions_json: JSON.stringify(updated.revisions ?? []),
      first_comment: updated.first_comment ?? null,
      hashtags_json: JSON.stringify(updated.hashtags ?? []),
      first_comment_posted_at: updated.first_comment_posted_at ?? null,
      updated_at: updated.updated_at,
    },
  });

  // The row was read moments ago, so matching nothing means the write was
  // dropped rather than applied. Failing loudly beats returning content that
  // was never stored.
  if ((result.rowsAffected ?? 0) === 0) {
    throw new Error(`Post ${id} update did not persist (0 rows affected).`);
  }

  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  await ready();
  const result = await getTursoClient().execute({
    sql: "DELETE FROM posts WHERE id = :id",
    args: { id },
  });
  return (result.rowsAffected ?? 0) > 0;
}

export async function getLinkedInAuth(): Promise<LinkedInAuthRow | null> {
  await ready();
  const result = await getTursoClient().execute(
    "SELECT * FROM linkedin_auth WHERE id = 1",
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    access_token: String(row.access_token),
    refresh_token: row.refresh_token == null ? null : String(row.refresh_token),
    expires_at: asNumber(row.expires_at) ?? 0,
    member_urn: String(row.member_urn),
    updated_at: asNumber(row.updated_at) ?? Date.now(),
    scope: row.scope == null ? null : String(row.scope),
  };
}

export async function saveLinkedInAuth(auth: LinkedInAuthRow): Promise<void> {
  await ready();
  await getTursoClient().execute({
    sql: `INSERT OR REPLACE INTO linkedin_auth
      (id, access_token, refresh_token, expires_at, member_urn, updated_at, scope)
      VALUES (1, :access_token, :refresh_token, :expires_at, :member_urn, :updated_at, :scope)`,
    args: authArgs(auth),
  });
}

export async function clearLinkedInAuth(): Promise<void> {
  await ready();
  await getTursoClient().execute("DELETE FROM linkedin_auth WHERE id = 1");
}

export async function getPostCounts(): Promise<Record<PostStatus, number>> {
  await ready();
  const counts: Record<PostStatus, number> = {
    draft: 0,
    approved: 0,
    scheduled: 0,
    posted: 0,
    failed: 0,
  };
  const result = await getTursoClient().execute(
    "SELECT status, COUNT(*) AS count FROM posts GROUP BY status",
  );
  for (const row of result.rows) {
    const status = String(row.status) as PostStatus;
    if (status in counts) counts[status] = Number(row.count) || 0;
  }
  return counts;
}

export async function listDueScheduledPosts(
  now = Date.now(),
): Promise<LinkedInPostRow[]> {
  await ready();
  const result = await getTursoClient().execute({
    sql: `SELECT * FROM posts
      WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= :now
      ORDER BY scheduled_at ASC`,
    args: { now },
  });
  return result.rows.map((row) => mapPost(row as Record<string, unknown>));
}

export async function getGenerationLearningContext(): Promise<{
  styleExamples: string[];
  performanceInsights: string;
}> {
  const posts = await listPosts();
  const approved = posts
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
      return { post, rate: engagements / metrics.impressions };
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
}

export async function listContentSeries(): Promise<ContentSeries[]> {
  await ready();
  const result = await getTursoClient().execute(
    "SELECT * FROM content_series ORDER BY created_at DESC",
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    theme: String(row.theme),
    audience: String(row.audience) as PostAudience,
    interval_days: asNumber(row.interval_days) ?? 7,
    post_count: asNumber(row.post_count) ?? 0,
    recurring: Boolean(asNumber(row.recurring)),
    enabled: asNumber(row.enabled) !== 0,
    next_generation_at: asNumber(row.next_generation_at),
    created_at: asNumber(row.created_at) ?? Date.now(),
  }));
}

export async function createContentSeries(
  series: ContentSeries,
): Promise<ContentSeries> {
  await ready();
  await getTursoClient().execute({
    sql: `INSERT INTO content_series
      (id, name, theme, audience, interval_days, post_count, recurring, enabled,
       next_generation_at, created_at)
      VALUES (:id, :name, :theme, :audience, :interval_days, :post_count, :recurring,
       :enabled, :next_generation_at, :created_at)`,
    args: seriesArgs(series),
  });
  return series;
}

export async function updateContentSeries(
  id: string,
  patch: Partial<
    Pick<ContentSeries, "recurring" | "enabled" | "next_generation_at" | "post_count">
  >,
): Promise<ContentSeries | null> {
  await ready();
  const current = (await listContentSeries()).find((series) => series.id === id);
  if (!current) return null;
  const updated = { ...current, ...patch };
  await getTursoClient().execute({
    sql: `UPDATE content_series SET recurring = :recurring, enabled = :enabled,
      next_generation_at = :next_generation_at, post_count = :post_count WHERE id = :id`,
    args: seriesArgs(updated),
  });
  return updated;
}

export async function getAppSettingRow(key: string): Promise<string | null> {
  await ready();
  const result = await getTursoClient().execute({
    sql: "SELECT value FROM settings WHERE key = :key",
    args: { key },
  });
  const value = result.rows[0]?.value;
  return value == null ? null : String(value);
}

export async function setAppSettingRow(key: string, value: string): Promise<void> {
  await ready();
  await getTursoClient().execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (:key, :value)",
    args: { key, value },
  });
}

export async function listEngagementComments(
  status?: EngagementCommentStatus,
): Promise<EngagementCommentRow[]> {
  await ready();
  const result = status
    ? await getTursoClient().execute({
        sql: "SELECT * FROM engagement_comments WHERE status = :status ORDER BY commented_at DESC",
        args: { status },
      })
    : await getTursoClient().execute(
        "SELECT * FROM engagement_comments ORDER BY commented_at DESC",
      );
  return result.rows.map((row) => mapComment(row as Record<string, unknown>));
}

function commentArgs(row: EngagementCommentRow) {
  return {
    id: row.id,
    post_id: row.post_id,
    post_topic: row.post_topic,
    linkedin_post_urn: row.linkedin_post_urn,
    linkedin_comment_id: row.linkedin_comment_id,
    linkedin_comment_urn: row.linkedin_comment_urn,
    linkedin_activity_urn: row.linkedin_activity_urn,
    author_urn: row.author_urn,
    author_label: row.author_label,
    comment_text: row.comment_text,
    commented_at: row.commented_at,
    status: row.status,
    suggested_replies_json: JSON.stringify(row.suggested_replies ?? []),
    coaching_note: row.coaching_note,
    approved_reply: row.approved_reply,
    replied_at: row.replied_at,
    reply_comment_urn: row.reply_comment_urn,
    error_message: row.error_message,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapComment(row: Record<string, unknown>): EngagementCommentRow {
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    post_topic: String(row.post_topic),
    linkedin_post_urn: String(row.linkedin_post_urn),
    linkedin_comment_id: String(row.linkedin_comment_id),
    linkedin_comment_urn: String(row.linkedin_comment_urn),
    linkedin_activity_urn:
      row.linkedin_activity_urn == null
        ? null
        : String(row.linkedin_activity_urn),
    author_urn: row.author_urn == null ? null : String(row.author_urn),
    author_label: String(row.author_label),
    comment_text: String(row.comment_text),
    commented_at: asNumber(row.commented_at) ?? Date.now(),
    status: String(row.status) as EngagementCommentStatus,
    suggested_replies: parseJson<EngagementReplyDraft[]>(
      row.suggested_replies_json,
      [],
    ),
    coaching_note: row.coaching_note == null ? null : String(row.coaching_note),
    approved_reply:
      row.approved_reply == null ? null : String(row.approved_reply),
    replied_at: asNumber(row.replied_at),
    reply_comment_urn:
      row.reply_comment_urn == null ? null : String(row.reply_comment_urn),
    error_message: row.error_message == null ? null : String(row.error_message),
    created_at: asNumber(row.created_at) ?? Date.now(),
    updated_at: asNumber(row.updated_at) ?? Date.now(),
  };
}

export async function getEngagementComment(
  id: string,
): Promise<EngagementCommentRow | null> {
  await ready();
  const result = await getTursoClient().execute({
    sql: "SELECT * FROM engagement_comments WHERE id = :id",
    args: { id },
  });
  const row = result.rows[0];
  return row ? mapComment(row as Record<string, unknown>) : null;
}

export async function findEngagementCommentByLinkedInId(
  linkedinCommentId: string,
): Promise<EngagementCommentRow | null> {
  await ready();
  const result = await getTursoClient().execute({
    sql: "SELECT * FROM engagement_comments WHERE linkedin_comment_id = :id",
    args: { id: linkedinCommentId },
  });
  const row = result.rows[0];
  return row ? mapComment(row as Record<string, unknown>) : null;
}

export async function upsertEngagementComment(
  row: EngagementCommentRow,
): Promise<EngagementCommentRow> {
  await ready();
  await getTursoClient().execute({
    sql: `INSERT OR REPLACE INTO engagement_comments (
      id, post_id, post_topic, linkedin_post_urn, linkedin_comment_id,
      linkedin_comment_urn, linkedin_activity_urn, author_urn, author_label,
      comment_text, commented_at, status, suggested_replies_json, coaching_note,
      approved_reply, replied_at, reply_comment_urn, error_message, created_at, updated_at
    ) VALUES (
      :id, :post_id, :post_topic, :linkedin_post_urn, :linkedin_comment_id,
      :linkedin_comment_urn, :linkedin_activity_urn, :author_urn, :author_label,
      :comment_text, :commented_at, :status, :suggested_replies_json, :coaching_note,
      :approved_reply, :replied_at, :reply_comment_urn, :error_message, :created_at, :updated_at
    )`,
    args: commentArgs(row),
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
  await ready();
  const existing = await getEngagementComment(id);
  if (!existing) return null;
  const updated: EngagementCommentRow = {
    ...existing,
    ...patch,
    updated_at: Date.now(),
  };
  await upsertEngagementComment(updated);
  return updated;
}

export async function getEngagementPollState(): Promise<EngagementPollState> {
  await ready();
  const result = await getTursoClient().execute(
    "SELECT * FROM engagement_poll WHERE id = 1",
  );
  const row = result.rows[0];
  if (!row) {
    return { last_poll_at: null, last_poll_error: null, last_new_count: 0 };
  }
  return {
    last_poll_at: asNumber(row.last_poll_at),
    last_poll_error:
      row.last_poll_error == null ? null : String(row.last_poll_error),
    last_new_count: asNumber(row.last_new_count) ?? 0,
  };
}

export async function setEngagementPollState(
  patch: Partial<EngagementPollState>,
): Promise<void> {
  const current = await getEngagementPollState();
  const next = { ...current, ...patch };
  await getTursoClient().execute({
    sql: `INSERT OR REPLACE INTO engagement_poll
      (id, last_poll_at, last_poll_error, last_new_count)
      VALUES (1, :last_poll_at, :last_poll_error, :last_new_count)`,
    args: pollArgs(next),
  });
}

export async function countEngagementComments(
  status?: EngagementCommentStatus,
): Promise<number> {
  await ready();
  const result = status
    ? await getTursoClient().execute({
        sql: "SELECT COUNT(*) AS count FROM engagement_comments WHERE status = :status",
        args: { status },
      })
    : await getTursoClient().execute(
        "SELECT COUNT(*) AS count FROM engagement_comments",
      );
  return Number(result.rows[0]?.count) || 0;
}
