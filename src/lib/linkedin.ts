import {
  getLinkedInAuth,
  saveLinkedInAuth,
  type LinkedInAuthRow,
} from "@/lib/admin-db";
import {
  APP_SETTING_KEYS,
  getAppSetting,
  getSiteOriginFromSettings,
} from "@/lib/app-settings";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";

export const LINKEDIN_API_VERSION = "202608";

/**
 * Scopes every standard app gets from "Sign In with LinkedIn" + "Share on
 * LinkedIn". `w_member_social` covers creating posts *and* comments/replies.
 */
const BASE_SCOPES = ["openid", "profile", "email", "w_member_social"];

/**
 * Community Management API scopes. LinkedIn rejects the whole authorization
 * request with `unauthorized_scope_error` if the app isn't approved for a
 * requested scope, so these stay behind the advanced flag — only enable it
 * once the product is actually approved for the app.
 */
const ADVANCED_SCOPES = [
  "w_member_social_feed",
  "r_member_social",
  "r_member_postAnalytics",
  "w_organization_social",
  "r_organization_social",
];

/** Scope required to read comments on a post. */
export const COMMENT_READ_SCOPE = "r_member_social";

async function getLinkedInOAuthScopes(): Promise<string> {
  const advanced =
    (await getAppSetting(APP_SETTING_KEYS.linkedinAdvancedScopes)) === "true";
  return [...BASE_SCOPES, ...(advanced ? ADVANCED_SCOPES : [])].join(" ");
}

export function linkedInHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_API_VERSION,
  };
}

export async function isLinkedInConfigured(): Promise<boolean> {
  try {
    const [clientId, clientSecret] = await Promise.all([
      getAppSetting(APP_SETTING_KEYS.linkedinClientId),
      getAppSetting(APP_SETTING_KEYS.linkedinClientSecret),
    ]);
    return Boolean(clientId && clientSecret);
  } catch (err) {
    console.warn("[linkedin] could not read OAuth credentials:", err);
    return false;
  }
}

export async function getSiteOrigin(): Promise<string> {
  return getSiteOriginFromSettings();
}

export async function getLinkedInRedirectUri(): Promise<string> {
  const override = await getAppSetting(APP_SETTING_KEYS.linkedinRedirectUri);
  if (override) return override;
  return `${await getSiteOrigin()}/api/admin/linkedin/callback`;
}

export async function buildLinkedInAuthUrl(state: string): Promise<string> {
  const clientId = (await getAppSetting(APP_SETTING_KEYS.linkedinClientId))!;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: await getLinkedInRedirectUri(),
    state,
    scope: await getLinkedInOAuthScopes(),
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  /** Scopes LinkedIn actually granted — may be narrower than requested. */
  scope?: string;
}

interface UserInfoResponse {
  sub: string;
}

async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = (await getAppSetting(APP_SETTING_KEYS.linkedinClientId))!;
  const clientSecret = (await getAppSetting(
    APP_SETTING_KEYS.linkedinClientSecret,
  ))!;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: await getLinkedInRedirectUri(),
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token exchange failed: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<TokenResponse>;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = (await getAppSetting(APP_SETTING_KEYS.linkedinClientId))!;
  const clientSecret = (await getAppSetting(
    APP_SETTING_KEYS.linkedinClientSecret,
  ))!;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn token refresh failed: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<TokenResponse>;
}

async function fetchMemberUrn(accessToken: string): Promise<string> {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn userinfo failed: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as UserInfoResponse;
  if (!data.sub) throw new Error("LinkedIn userinfo missing sub");
  return data.sub.startsWith("urn:li:person:")
    ? data.sub
    : `urn:li:person:${data.sub}`;
}

export async function completeLinkedInOAuth(code: string): Promise<LinkedInAuthRow> {
  const tokens = await exchangeCodeForTokens(code);
  const memberUrn = await fetchMemberUrn(tokens.access_token);
  const now = Date.now();

  const auth: LinkedInAuthRow = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: now + tokens.expires_in * 1000 - 60_000,
    member_urn: memberUrn,
    updated_at: now,
    scope: tokens.scope ?? null,
  };

  await saveLinkedInAuth(auth);
  return auth;
}

export async function getValidLinkedInAuth(): Promise<LinkedInAuthRow | null> {
  let auth: LinkedInAuthRow | null;
  try {
    auth = await getLinkedInAuth();
  } catch (err) {
    console.warn("[linkedin] could not read stored auth:", err);
    return null;
  }
  if (!auth) return null;

  if (auth.expires_at > Date.now()) return auth;

  if (!auth.refresh_token) return null;

  try {
    const tokens = await refreshAccessToken(auth.refresh_token);
    const refreshed: LinkedInAuthRow = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? auth.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000 - 60_000,
      member_urn: auth.member_urn,
      updated_at: Date.now(),
      scope: tokens.scope ?? auth.scope,
    };
    await saveLinkedInAuth(refreshed);
    return refreshed;
  } catch (err) {
    console.warn("[linkedin] token refresh failed:", err);
    return null;
  }
}

export interface PublishResult {
  postUrn: string;
  postUrl: string | null;
}

export interface LinkedInPublishOptions {
  target?: "member" | "organization";
  media?: {
    kind: "image" | "document";
    bytes: Uint8Array;
    contentType: "image/png" | "application/pdf";
    title: string;
  };
}

async function resolvePublishOwner(
  auth: LinkedInAuthRow,
  target: "member" | "organization",
): Promise<string> {
  if (target === "member") return auth.member_urn;
  const organizationUrn = await getAppSetting(
    APP_SETTING_KEYS.linkedinOrganizationUrn,
  );
  if (!organizationUrn?.startsWith("urn:li:organization:")) {
    throw new Error(
      "Add a valid LinkedIn organization URN in Admin → Settings first.",
    );
  }
  return organizationUrn;
}

async function uploadLinkedInMedia(
  accessToken: string,
  owner: string,
  media: NonNullable<LinkedInPublishOptions["media"]>,
): Promise<string> {
  const collection = media.kind === "image" ? "images" : "documents";
  const assetKey = media.kind === "image" ? "image" : "document";
  const initialize = await fetch(
    `https://api.linkedin.com/rest/${collection}?action=initializeUpload`,
    {
      method: "POST",
      headers: linkedInHeaders(accessToken),
      body: JSON.stringify({ initializeUploadRequest: { owner } }),
    },
  );
  if (!initialize.ok) {
    const text = await initialize.text();
    throw new Error(
      `LinkedIn ${media.kind} initialization failed (${initialize.status}): ${text.slice(0, 350)}`,
    );
  }
  const initialized = (await initialize.json()) as {
    value?: { uploadUrl?: string; image?: string; document?: string };
  };
  const uploadUrl = initialized.value?.uploadUrl;
  const assetUrn = initialized.value?.[assetKey];
  if (!uploadUrl || !assetUrn) {
    throw new Error(`LinkedIn did not return a ${media.kind} upload URL.`);
  }

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": media.contentType,
    },
    body: media.bytes.buffer.slice(
      media.bytes.byteOffset,
      media.bytes.byteOffset + media.bytes.byteLength,
    ) as ArrayBuffer,
  });
  if (!upload.ok) {
    const text = await upload.text();
    throw new Error(
      `LinkedIn ${media.kind} upload failed (${upload.status}): ${text.slice(0, 350)}`,
    );
  }
  return assetUrn;
}

export async function publishLinkedInPost(
  commentary: string,
  options: LinkedInPublishOptions = {},
): Promise<PublishResult> {
  const auth = await getValidLinkedInAuth();
  if (!auth) {
    throw new Error(
      "LinkedIn is not connected. Connect your account in Admin → Settings.",
    );
  }

  const owner = await resolvePublishOwner(auth, options.target ?? "member");
  const mediaUrn = options.media
    ? await uploadLinkedInMedia(auth.access_token, owner, options.media)
    : null;
  const payload = {
    author: owner,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    ...(mediaUrn
      ? {
          content: {
            media: {
              id: mediaUrn,
              title: options.media?.title || "LinkedIn post media",
            },
          },
        }
      : {}),
  };

  const res = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: linkedInHeaders(auth.access_token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn publish failed (${res.status}): ${text.slice(0, 400)}`);
  }

  const postUrn = res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id");
  if (!postUrn) {
    throw new Error("LinkedIn publish succeeded but no post ID was returned.");
  }

  return {
    postUrn,
    postUrl: linkedInPostUrlFromUrn(postUrn),
  };
}

function linkedInPostUrlFromUrn(urn: string): string | null {
  const match = urn.match(/urn:li:share:(\d+)/) || urn.match(/urn:li:ugcPost:(\d+)/);
  if (!match) return null;
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`;
}

export async function getLinkedInConnectionStatus(): Promise<{
  connected: boolean;
  memberUrn: string | null;
  expiresAt: number | null;
  organizationUrn: string | null;
  advancedScopes: boolean;
  /** Scopes LinkedIn granted. Empty when unknown (pre-existing connection). */
  grantedScopes: string[];
  /** True only when the token can actually read comments. */
  canReadComments: boolean;
}> {
  const disconnected = {
    connected: false,
    memberUrn: null,
    expiresAt: null,
    organizationUrn: null as string | null,
    advancedScopes: false,
    grantedScopes: [] as string[],
    canReadComments: false,
  };

  try {
    const [organizationUrn, advancedScopes] = await Promise.all([
      getAppSetting(APP_SETTING_KEYS.linkedinOrganizationUrn),
      getAppSetting(APP_SETTING_KEYS.linkedinAdvancedScopes),
    ]);
    disconnected.organizationUrn = organizationUrn;
    disconnected.advancedScopes = advancedScopes === "true";

    const auth = await getValidLinkedInAuth();
    if (!auth) return disconnected;

    const grantedScopes = (auth.scope ?? "")
      .split(/[\s,]+/)
      .filter(Boolean)
      .sort();

    return {
      connected: true,
      memberUrn: auth.member_urn,
      expiresAt: auth.expires_at,
      organizationUrn,
      advancedScopes: advancedScopes === "true",
      grantedScopes,
      canReadComments: grantedScopes.includes(COMMENT_READ_SCOPE),
    };
  } catch (err) {
    console.warn("[linkedin] connection status unavailable:", err);
    return disconnected;
  }
}

function analyticsEntity(urn: string): string {
  const type = urn.includes(":ugcPost:") ? "ugc" : "share";
  return `(${type}:${encodeURIComponent(urn)})`;
}

export async function fetchLinkedInPostMetrics(
  postUrn: string,
): Promise<{
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
  clicks: number;
}> {
  const auth = await getValidLinkedInAuth();
  if (!auth) throw new Error("LinkedIn is not connected.");
  const metricMap = {
    IMPRESSION: "impressions",
    REACTION: "reactions",
    COMMENT: "comments",
    RESHARE: "reposts",
    LINK_CLICKS: "clicks",
  } as const;
  const output = {
    impressions: 0,
    reactions: 0,
    comments: 0,
    reposts: 0,
    clicks: 0,
  };

  await Promise.all(
    Object.entries(metricMap).map(async ([metric, key]) => {
      const response = await fetch(
        `https://api.linkedin.com/rest/memberCreatorPostAnalytics?q=entity&entity=${analyticsEntity(postUrn)}&queryType=${metric}&aggregation=TOTAL`,
        { headers: linkedInHeaders(auth.access_token) },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `LinkedIn analytics unavailable (${response.status}). Community Management API and r_member_postAnalytics are required. ${text.slice(0, 180)}`,
        );
      }
      const data = (await response.json()) as {
        elements?: Array<{ count?: number }>;
      };
      output[key] = Number(data.elements?.[0]?.count ?? 0);
    }),
  );
  return output;
}
