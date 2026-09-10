import "server-only";

import { createTursoHttpClient, type TursoClient } from "@/lib/turso-http";

export function isTursoConfigured(): boolean {
  return Boolean(
    process.env.TURSO_DATABASE_URL?.trim() &&
      process.env.TURSO_AUTH_TOKEN?.trim(),
  );
}

let client: TursoClient | null = null;
let schemaReady: Promise<void> | null = null;

export function getTursoClient(): TursoClient {
  if (!isTursoConfigured()) {
    throw new Error("Turso is not configured.");
  }
  if (!client) {
    client = createTursoHttpClient({
      url: process.env.TURSO_DATABASE_URL!.trim(),
      authToken: process.env.TURSO_AUTH_TOKEN!.trim(),
    });
  }
  return client;
}

const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    template TEXT NOT NULL,
    tone TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    hook TEXT,
    status TEXT NOT NULL,
    scheduled_at INTEGER,
    posted_at INTEGER,
    linkedin_post_urn TEXT,
    linkedin_url TEXT,
    error_message TEXT,
    generation_mode TEXT,
    length TEXT,
    target_word_count INTEGER,
    audience TEXT,
    variants_json TEXT,
    alternative_hooks_json TEXT,
    sources_json TEXT,
    metrics_json TEXT,
    series_id TEXT,
    carousel_slides_json TEXT,
    publish_target TEXT,
    media_kind TEXT,
    media_title TEXT,
    card_copy_json TEXT,
    revisions_json TEXT,
    first_comment TEXT,
    hashtags_json TEXT,
    first_comment_posted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS linkedin_auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at INTEGER NOT NULL,
    member_urn TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    scope TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS engagement_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    post_topic TEXT NOT NULL,
    linkedin_post_urn TEXT NOT NULL,
    linkedin_comment_id TEXT NOT NULL UNIQUE,
    linkedin_comment_urn TEXT NOT NULL,
    linkedin_activity_urn TEXT,
    author_urn TEXT,
    author_label TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    commented_at INTEGER NOT NULL,
    status TEXT NOT NULL,
    suggested_replies_json TEXT,
    coaching_note TEXT,
    approved_reply TEXT,
    replied_at INTEGER,
    reply_comment_urn TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS engagement_poll (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_poll_at INTEGER,
    last_poll_error TEXT,
    last_new_count INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS content_series (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme TEXT NOT NULL,
    audience TEXT NOT NULL,
    interval_days INTEGER NOT NULL,
    post_count INTEGER NOT NULL,
    recurring INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    next_generation_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];

const ADDITIVE_MIGRATIONS = [
  "ALTER TABLE posts ADD COLUMN publish_target TEXT",
  "ALTER TABLE posts ADD COLUMN media_kind TEXT",
  "ALTER TABLE posts ADD COLUMN media_title TEXT",
  "ALTER TABLE posts ADD COLUMN revisions_json TEXT",
  "ALTER TABLE posts ADD COLUMN first_comment TEXT",
  "ALTER TABLE posts ADD COLUMN hashtags_json TEXT",
  "ALTER TABLE posts ADD COLUMN first_comment_posted_at INTEGER",
  "ALTER TABLE posts ADD COLUMN card_copy_json TEXT",
  "ALTER TABLE content_series ADD COLUMN recurring INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE content_series ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE content_series ADD COLUMN next_generation_at INTEGER",
  "ALTER TABLE linkedin_auth ADD COLUMN scope TEXT",
];

export async function ensureTursoSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getTursoClient();
      for (const sql of SCHEMA_SQL) {
        await db.execute(sql);
      }
      for (const sql of ADDITIVE_MIGRATIONS) {
        try {
          await db.execute(sql);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!/duplicate column|already exists/i.test(message)) throw err;
        }
      }
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export async function pingTurso(): Promise<boolean> {
  if (!isTursoConfigured()) return false;
  try {
    await ensureTursoSchema();
    await getTursoClient().execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
