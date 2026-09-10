import type { CardCopy } from "@/lib/linkedin-card";

export type PostStatus = "draft" | "approved" | "scheduled" | "posted" | "failed";

export type PostTemplate =
  | "story"
  | "lesson"
  | "case_study"
  | "hot_take"
  | "hiring_signal";

export type PostGenerationMode = "cv" | "trend" | "custom";
export type PostLength = "short" | "medium" | "long" | "custom";
export type PostAudience =
  | "general"
  | "recruiters"
  | "engineering_leaders"
  | "developers"
  | "uae_government";
export type PublishTarget = "member" | "organization";
export type PostMediaKind = "none" | "image" | "document";
export type RewriteAction =
  | "sharper_hook"
  | "simpler"
  | "more_technical"
  | "more_personal"
  | "shorter"
  | "custom";

export interface PostSource {
  title: string;
  url: string;
  publisher: string;
  context?: string;
}

export interface PostVariant {
  id: string;
  label: string;
  hook: string;
  body: string;
}

export interface PostRevision {
  id: string;
  body: string;
  hook: string | null;
  created_at: number;
}

export interface PostMetrics {
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  clicks: number;
  recorded_at: number;
  source?: "manual" | "linkedin";
  sync_error?: string | null;
}

export interface CarouselSlide {
  title: string;
  body: string;
}

export interface ContentSeries {
  id: string;
  name: string;
  theme: string;
  audience: PostAudience;
  interval_days: number;
  post_count: number;
  created_at: number;
  recurring?: boolean;
  enabled?: boolean;
  next_generation_at?: number | null;
}

export interface LinkedInPostRow {
  id: string;
  topic: string;
  template: PostTemplate;
  tone: string;
  body: string;
  hook: string | null;
  status: PostStatus;
  scheduled_at: number | null;
  posted_at: number | null;
  linkedin_post_urn: string | null;
  linkedin_url: string | null;
  error_message: string | null;
  generation_mode?: PostGenerationMode;
  length?: PostLength;
  target_word_count?: number | null;
  audience?: PostAudience;
  variants?: PostVariant[];
  alternative_hooks?: string[];
  sources?: PostSource[];
  metrics?: PostMetrics | null;
  series_id?: string | null;
  carousel_slides?: CarouselSlide[];
  publish_target?: PublishTarget;
  media_kind?: PostMediaKind;
  media_title?: string | null;
  /** Written copy for the generated image; see `linkedin-card-copy.ts`. */
  card_copy?: CardCopy | null;
  revisions?: PostRevision[];
  first_comment?: string | null;
  hashtags?: string[];
  first_comment_posted_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface LinkedInAuthRow {
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
  member_urn: string;
  updated_at: number;
  /**
   * Space-separated scopes LinkedIn actually granted (from the token
   * response). Requesting a scope is not the same as being granted it, so this
   * is what tells us whether e.g. comment reading is really available.
   * Null for connections made before this was recorded.
   */
  scope: string | null;
}

export type EngagementCommentStatus =
  | "pending"
  | "replied"
  | "skipped"
  | "failed";

export interface EngagementReplyDraft {
  label: string;
  text: string;
  intent: string;
}

export interface EngagementCommentRow {
  id: string;
  post_id: string;
  post_topic: string;
  linkedin_post_urn: string;
  linkedin_comment_id: string;
  linkedin_comment_urn: string;
  linkedin_activity_urn: string | null;
  author_urn: string | null;
  author_label: string;
  comment_text: string;
  commented_at: number;
  status: EngagementCommentStatus;
  suggested_replies: EngagementReplyDraft[];
  coaching_note: string | null;
  approved_reply: string | null;
  replied_at: number | null;
  reply_comment_urn: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

export interface EngagementPollState {
  last_poll_at: number | null;
  last_poll_error: string | null;
  last_new_count: number;
}
