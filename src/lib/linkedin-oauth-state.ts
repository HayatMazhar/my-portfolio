import { createHmac, randomBytes } from "crypto";
import { APP_SETTING_KEYS, getAppSetting } from "@/lib/app-settings";

const OAUTH_STATE_COOKIE = "linkedin_oauth_state";

async function getSecret(): Promise<string> {
  const secret = await getAppSetting(APP_SETTING_KEYS.adminSessionSecret);
  if (!secret) throw new Error("Admin session secret is not configured.");
  return secret;
}

function signState(state: string, secret: string): string {
  return createHmac("sha256", secret).update(state).digest("base64url");
}

export async function createOAuthState(): Promise<string> {
  const state = randomBytes(16).toString("hex");
  const secret = await getSecret();
  return `${state}.${signState(state, secret)}`;
}

export async function verifyOAuthState(
  received: string,
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue || received !== cookieValue) return false;
  const [state, sig] = received.split(".");
  if (!state || !sig) return false;
  try {
    const secret = await getSecret();
    return sig === signState(state, secret);
  } catch {
    return false;
  }
}

export { OAUTH_STATE_COOKIE };
