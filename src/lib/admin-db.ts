import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type {
  LinkedInAuthRow,
  LinkedInPostRow,
  PostStatus,
  PostTemplate,
} from "@/lib/admin-types";

export type {
  LinkedInAuthRow,
  LinkedInPostRow,
  PostStatus,
  PostTemplate,
} from "@/lib/admin-types";

interface AdminStore {
  settings: Record<string, string>;
  posts: LinkedInPostRow[];
  linkedinAuth: LinkedInAuthRow | null;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "admin-store.json");

const emptyStore = (): AdminStore => ({
  settings: {},
  posts: [],
  linkedinAuth: null,
});

let writeChain: Promise<void> = Promise.resolve();

function withStore<T>(fn: (store: AdminStore) => T | Promise<T>): Promise<T> {
  return (async () => {
    await mkdir(DATA_DIR, { recursive: true });
    let store: AdminStore;
    try {
      const raw = await readFile(STORE_PATH, "utf8");
      store = JSON.parse(raw) as AdminStore;
      store.settings ??= {};
      store.posts ??= [];
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
      store = JSON.parse(raw) as AdminStore;
      store.settings ??= {};
      store.posts ??= [];
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
    scheduled_at: null,
    posted_at: null,
    linkedin_post_urn: null,
    linkedin_url: null,
    error_message: null,
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
    >
  >,
): Promise<LinkedInPostRow | null> {
  let updated: LinkedInPostRow | null = null;
  await mutateStore((store) => {
    const idx = store.posts.findIndex((p) => p.id === id);
    if (idx === -1) return;
    updated = { ...store.posts[idx]!, ...patch, updated_at: Date.now() };
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
  return withStore((store) => store.linkedinAuth);
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

export async function getAppSettingRow(key: string): Promise<string | null> {
  return withStore((store) => store.settings[key] ?? null);
}

export async function setAppSettingRow(key: string, value: string): Promise<void> {
  await mutateStore((store) => {
    store.settings[key] = value;
  });
}
