import "server-only";

import * as jsonDb from "@/lib/admin-db-json";
import * as tursoDb from "@/lib/admin-db-turso";
import { isTursoConfigured, pingTurso } from "@/lib/turso";

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

export type AdminStoreBackend = "turso" | "json";

type AdminDb = typeof jsonDb | typeof tursoDb;

let resolvedBackend: AdminStoreBackend | null = null;
let resolvePromise: Promise<AdminStoreBackend> | null = null;
let dbPromise: Promise<AdminDb> | null = null;

/** Prefer the resolved backend after {@link resolveAdminStoreBackend} has run. */
export function getAdminStoreBackend(): AdminStoreBackend {
  if (resolvedBackend) return resolvedBackend;
  return isTursoConfigured() ? "turso" : "json";
}

/**
 * When Turso env vars are set but the database is unreachable (wrong token,
 * deleted DB, flaky host), fall back to `.data/admin-store.json` so admin login
 * still works on shared hosting.
 */
export async function resolveAdminStoreBackend(): Promise<AdminStoreBackend> {
  if (resolvedBackend) return resolvedBackend;
  if (!resolvePromise) {
    resolvePromise = (async () => {
      if (!isTursoConfigured()) {
        resolvedBackend = "json";
        return resolvedBackend;
      }
      const ok = await pingTurso();
      if (!ok) {
        console.warn(
          "[admin-db] Turso configured but unreachable — using .data/admin-store.json fallback.",
        );
        resolvedBackend = "json";
        return resolvedBackend;
      }
      resolvedBackend = "turso";
      return resolvedBackend;
    })().catch((err) => {
      resolvePromise = null;
      console.warn("[admin-db] Turso probe failed:", err);
      resolvedBackend = "json";
      return resolvedBackend;
    });
  }
  return resolvePromise;
}

async function getDb(): Promise<AdminDb> {
  if (!dbPromise) {
    dbPromise = resolveAdminStoreBackend().then((backend) =>
      backend === "turso" ? tursoDb : jsonDb,
    );
  }
  return dbPromise;
}

export const listPosts = async (...args: Parameters<typeof jsonDb.listPosts>) =>
  (await getDb()).listPosts(...args);
export const getPost = async (...args: Parameters<typeof jsonDb.getPost>) =>
  (await getDb()).getPost(...args);
export const createPost = async (...args: Parameters<typeof jsonDb.createPost>) =>
  (await getDb()).createPost(...args);
export const updatePost = async (...args: Parameters<typeof jsonDb.updatePost>) =>
  (await getDb()).updatePost(...args);
export const deletePost = async (...args: Parameters<typeof jsonDb.deletePost>) =>
  (await getDb()).deletePost(...args);
export const getLinkedInAuth = async () => (await getDb()).getLinkedInAuth();
export const saveLinkedInAuth = async (
  ...args: Parameters<typeof jsonDb.saveLinkedInAuth>
) => (await getDb()).saveLinkedInAuth(...args);
export const clearLinkedInAuth = async () => (await getDb()).clearLinkedInAuth();
export const getPostCounts = async () => (await getDb()).getPostCounts();
export const listDueScheduledPosts = async (
  ...args: Parameters<typeof jsonDb.listDueScheduledPosts>
) => (await getDb()).listDueScheduledPosts(...args);
export const getGenerationLearningContext = async () =>
  (await getDb()).getGenerationLearningContext();
export const listContentSeries = async () => (await getDb()).listContentSeries();
export const createContentSeries = async (
  ...args: Parameters<typeof jsonDb.createContentSeries>
) => (await getDb()).createContentSeries(...args);
export const updateContentSeries = async (
  ...args: Parameters<typeof jsonDb.updateContentSeries>
) => (await getDb()).updateContentSeries(...args);
export const getAppSettingRow = async (
  ...args: Parameters<typeof jsonDb.getAppSettingRow>
) => (await getDb()).getAppSettingRow(...args);
export const setAppSettingRow = async (
  ...args: Parameters<typeof jsonDb.setAppSettingRow>
) => (await getDb()).setAppSettingRow(...args);
export const listEngagementComments = async (
  ...args: Parameters<typeof jsonDb.listEngagementComments>
) => (await getDb()).listEngagementComments(...args);
export const getEngagementComment = async (
  ...args: Parameters<typeof jsonDb.getEngagementComment>
) => (await getDb()).getEngagementComment(...args);
export const findEngagementCommentByLinkedInId = async (
  ...args: Parameters<typeof jsonDb.findEngagementCommentByLinkedInId>
) => (await getDb()).findEngagementCommentByLinkedInId(...args);
export const upsertEngagementComment = async (
  ...args: Parameters<typeof jsonDb.upsertEngagementComment>
) => (await getDb()).upsertEngagementComment(...args);
export const updateEngagementComment = async (
  ...args: Parameters<typeof jsonDb.updateEngagementComment>
) => (await getDb()).updateEngagementComment(...args);
export const getEngagementPollState = async () =>
  (await getDb()).getEngagementPollState();
export const setEngagementPollState = async (
  ...args: Parameters<typeof jsonDb.setEngagementPollState>
) => (await getDb()).setEngagementPollState(...args);
export const countEngagementComments = async (
  ...args: Parameters<typeof jsonDb.countEngagementComments>
) => (await getDb()).countEngagementComments(...args);
