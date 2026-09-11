const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

function loadEnv() {
  const text = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function emptyStore() {
  return {
    settings: {},
    posts: [],
    linkedinAuth: null,
    engagementComments: [],
    engagementPoll: {
      last_poll_at: null,
      last_poll_error: null,
      last_new_count: 0,
    },
    contentSeries: [],
  };
}

async function main() {
  const env = loadEnv();
  const db = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const schema = [
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY, topic TEXT NOT NULL, template TEXT NOT NULL, tone TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '', hook TEXT, status TEXT NOT NULL, scheduled_at INTEGER,
      posted_at INTEGER, linkedin_post_urn TEXT, linkedin_url TEXT, error_message TEXT,
      generation_mode TEXT, length TEXT, target_word_count INTEGER, audience TEXT,
      variants_json TEXT, alternative_hooks_json TEXT, sources_json TEXT, metrics_json TEXT,
      series_id TEXT, carousel_slides_json TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
      , publish_target TEXT, media_kind TEXT, media_title TEXT, revisions_json TEXT,
      first_comment TEXT, hashtags_json TEXT, first_comment_posted_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS linkedin_auth (
      id INTEGER PRIMARY KEY CHECK (id = 1), access_token TEXT NOT NULL, refresh_token TEXT,
      expires_at INTEGER NOT NULL, member_urn TEXT NOT NULL, updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS engagement_comments (
      id TEXT PRIMARY KEY, post_id TEXT NOT NULL, post_topic TEXT NOT NULL,
      linkedin_post_urn TEXT NOT NULL, linkedin_comment_id TEXT NOT NULL UNIQUE,
      linkedin_comment_urn TEXT NOT NULL, linkedin_activity_urn TEXT, author_urn TEXT,
      author_label TEXT NOT NULL, comment_text TEXT NOT NULL, commented_at INTEGER NOT NULL,
      status TEXT NOT NULL, suggested_replies_json TEXT, coaching_note TEXT, approved_reply TEXT,
      replied_at INTEGER, reply_comment_urn TEXT, error_message TEXT, created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS engagement_poll (
      id INTEGER PRIMARY KEY CHECK (id = 1), last_poll_at INTEGER, last_poll_error TEXT,
      last_new_count INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS content_series (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, theme TEXT NOT NULL, audience TEXT NOT NULL,
      interval_days INTEGER NOT NULL, post_count INTEGER NOT NULL, created_at INTEGER NOT NULL
      , recurring INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1,
      next_generation_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  ];

  for (const sql of schema) await db.execute(sql);
  for (const sql of [
    "ALTER TABLE posts ADD COLUMN publish_target TEXT",
    "ALTER TABLE posts ADD COLUMN media_kind TEXT",
    "ALTER TABLE posts ADD COLUMN media_title TEXT",
    "ALTER TABLE posts ADD COLUMN revisions_json TEXT",
    "ALTER TABLE posts ADD COLUMN first_comment TEXT",
    "ALTER TABLE posts ADD COLUMN hashtags_json TEXT",
    "ALTER TABLE posts ADD COLUMN first_comment_posted_at INTEGER",
    "ALTER TABLE content_series ADD COLUMN recurring INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE content_series ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE content_series ADD COLUMN next_generation_at INTEGER",
  ]) {
    try {
      await db.execute(sql);
    } catch (err) {
      if (!/duplicate column|already exists/i.test(String(err.message))) throw err;
    }
  }

  const marker = await db.execute(
    "SELECT value FROM meta WHERE key = 'json_migrated_at'",
  );
  if (!marker.rows[0]) {
    let store = emptyStore();
    const jsonPath = path.join(process.cwd(), ".data", "admin-store.json");
    if (fs.existsSync(jsonPath)) {
      store = { ...emptyStore(), ...JSON.parse(fs.readFileSync(jsonPath, "utf8")) };
    }
    const hasData =
      Object.keys(store.settings || {}).length > 0 ||
      (store.posts || []).length > 0 ||
      store.linkedinAuth ||
      (store.engagementComments || []).length > 0 ||
      (store.contentSeries || []).length > 0;

    if (hasData) {
      for (const [key, value] of Object.entries(store.settings || {})) {
        await db.execute({
          sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          args: [key, value],
        });
      }
      for (const post of store.posts || []) {
        await db.execute({
          sql: `INSERT OR REPLACE INTO posts (
            id, topic, template, tone, body, hook, status, scheduled_at, posted_at,
            linkedin_post_urn, linkedin_url, error_message, generation_mode, length,
            target_word_count, audience, variants_json, alternative_hooks_json,
            sources_json, metrics_json, series_id, carousel_slides_json, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            post.id,
            post.topic,
            post.template,
            post.tone,
            post.body ?? "",
            post.hook ?? null,
            post.status,
            post.scheduled_at ?? null,
            post.posted_at ?? null,
            post.linkedin_post_urn ?? null,
            post.linkedin_url ?? null,
            post.error_message ?? null,
            post.generation_mode ?? "cv",
            post.length ?? "medium",
            post.target_word_count ?? null,
            post.audience ?? "general",
            JSON.stringify(post.variants ?? []),
            JSON.stringify(post.alternative_hooks ?? []),
            JSON.stringify(post.sources ?? []),
            post.metrics ? JSON.stringify(post.metrics) : null,
            post.series_id ?? null,
            JSON.stringify(post.carousel_slides ?? []),
            post.created_at,
            post.updated_at,
          ],
        });
      }
      if (store.linkedinAuth) {
        const auth = store.linkedinAuth;
        await db.execute({
          sql: `INSERT OR REPLACE INTO linkedin_auth
            (id, access_token, refresh_token, expires_at, member_urn, updated_at)
            VALUES (1,?,?,?,?,?)`,
          args: [
            auth.access_token,
            auth.refresh_token,
            auth.expires_at,
            auth.member_urn,
            auth.updated_at,
          ],
        });
      }
      for (const comment of store.engagementComments || []) {
        await db.execute({
          sql: `INSERT OR REPLACE INTO engagement_comments (
            id, post_id, post_topic, linkedin_post_urn, linkedin_comment_id,
            linkedin_comment_urn, linkedin_activity_urn, author_urn, author_label,
            comment_text, commented_at, status, suggested_replies_json, coaching_note,
            approved_reply, replied_at, reply_comment_urn, error_message, created_at, updated_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            comment.id,
            comment.post_id,
            comment.post_topic,
            comment.linkedin_post_urn,
            comment.linkedin_comment_id,
            comment.linkedin_comment_urn,
            comment.linkedin_activity_urn,
            comment.author_urn,
            comment.author_label,
            comment.comment_text,
            comment.commented_at,
            comment.status,
            JSON.stringify(comment.suggested_replies ?? []),
            comment.coaching_note,
            comment.approved_reply,
            comment.replied_at,
            comment.reply_comment_urn,
            comment.error_message,
            comment.created_at,
            comment.updated_at,
          ],
        });
      }
      const poll = store.engagementPoll || emptyStore().engagementPoll;
      await db.execute({
        sql: `INSERT OR REPLACE INTO engagement_poll
          (id, last_poll_at, last_poll_error, last_new_count) VALUES (1,?,?,?)`,
        args: [poll.last_poll_at, poll.last_poll_error, poll.last_new_count ?? 0],
      });
      for (const series of store.contentSeries || []) {
        await db.execute({
          sql: `INSERT OR REPLACE INTO content_series
            (id, name, theme, audience, interval_days, post_count, created_at)
            VALUES (?,?,?,?,?,?,?)`,
          args: [
            series.id,
            series.name,
            series.theme,
            series.audience,
            series.interval_days,
            series.post_count,
            series.created_at,
          ],
        });
      }
    }

    await db.execute({
      sql: "INSERT OR REPLACE INTO meta (key, value) VALUES ('json_migrated_at', ?)",
      args: [String(Date.now())],
    });
  }

  const counts = await Promise.all([
    db.execute("SELECT COUNT(*) AS n FROM posts"),
    db.execute("SELECT COUNT(*) AS n FROM settings"),
    db.execute("SELECT COUNT(*) AS n FROM engagement_comments"),
    db.execute("SELECT COUNT(*) AS n FROM content_series"),
  ]);
  console.log(
    JSON.stringify({
      ok: true,
      posts: Number(counts[0].rows[0].n),
      settings: Number(counts[1].rows[0].n),
      comments: Number(counts[2].rows[0].n),
      series: Number(counts[3].rows[0].n),
    }),
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
