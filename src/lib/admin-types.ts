export type PostStatus = "draft" | "approved" | "scheduled" | "posted" | "failed";

export type PostTemplate =
  | "story"
  | "lesson"
  | "case_study"
  | "hot_take"
  | "hiring_signal";

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
  created_at: number;
  updated_at: number;
}

export interface LinkedInAuthRow {
  access_token: string;
  refresh_token: string | null;
  expires_at: number;
  member_urn: string;
  updated_at: number;
}
