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

export const LINKEDIN_API_VERSION = "202509";

export async function isLinkedInConfigured(): Promise<boolean> {
  const [clientId, clientSecret] = await Promise.all([
    getAppSetting(APP_SETTING_KEYS.linkedinClientId),
    getAppSetting(APP_SETTING_KEYS.linkedinClientSecret),
  ]);
  return Boolean(clientId && clientSecret);
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
    scope: "openid profile email w_member_social",
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
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
  };

  await saveLinkedInAuth(auth);
  return auth;
}

export async function getValidLinkedInAuth(): Promise<LinkedInAuthRow | null> {
  const auth = await getLinkedInAuth();
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
    };
    await saveLinkedInAuth(refreshed);
    return refreshed;
  } catch {
    return null;
  }
}

export interface PublishResult {
  postUrn: string;
  postUrl: string | null;
}

export async function publishLinkedInPost(
  commentary: string,
): Promise<PublishResult> {
  const auth = await getValidLinkedInAuth();
  if (!auth) {
    throw new Error(
      "LinkedIn is not connected. Connect your account in Admin → Settings.",
    );
  }

  const payload = {
    author: auth.member_urn,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
  };

  const res = await fetch(LINKEDIN_POSTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": LINKEDIN_API_VERSION,
    },
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
}> {
  const auth = await getValidLinkedInAuth();
  if (!auth) {
    return { connected: false, memberUrn: null, expiresAt: null };
  }
  return {
    connected: true,
    memberUrn: auth.member_urn,
    expiresAt: auth.expires_at,
  };
}
