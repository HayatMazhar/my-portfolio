/**
 * Normalize admin-store.json for production deploy.
 * - Sets production site URL + LinkedIn redirect
 * - Re-hashes admin password with bcryptjs (shared-hosting safe, pure JS)
 *
 * Password source (first match):
 *   ADMIN_DEPLOY_PASSWORD env var
 *   ADMIN_PASSWORD= in .env.local
 */
import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const storePath = resolve(process.argv[2] || "deploy/.data/admin-store.json");
const productionSiteUrl = (
  process.env.ADMIN_DEPLOY_SITE_URL || "https://mazharhayat.live"
).replace(/\/$/, "");

function readDeployPassword() {
  const envLocal = resolve(".env.local");
  if (existsSync(envLocal)) {
    const match = readFileSync(envLocal, "utf8").match(/^ADMIN_PASSWORD=(.+)$/m);
    const fromLocal = match?.[1]?.trim().replace(/^["']|["']$/g, "");
    if (fromLocal) return fromLocal;
  }
  if (process.env.ADMIN_DEPLOY_PASSWORD?.trim()) {
    return process.env.ADMIN_DEPLOY_PASSWORD.trim();
  }
  return null;
}

if (!existsSync(storePath)) {
  console.log("No admin-store.json to patch.");
  process.exit(0);
}

const store = JSON.parse(readFileSync(storePath, "utf8"));
store.settings ??= {};
store.posts ??= [];
store.linkedinAuth ??= null;

store.settings.site_url = productionSiteUrl;
store.settings.linkedin_redirect_uri = `${productionSiteUrl}/api/admin/linkedin/callback`;

const password = readDeployPassword();
const existing = store.settings.admin_password_hash || "";

if (password) {
  store.settings.admin_password_hash = bcrypt.hashSync(password, 10);
  console.log("Re-hashed admin password with bcrypt for production deploy.");
} else if (existing.startsWith("$2")) {
  console.log("Admin password already bcrypt — kept existing hash.");
} else if (existing) {
  console.warn(
    "WARNING: Legacy password hash kept — login may fail on shared hosting.",
  );
  console.warn(
    "Set ADMIN_DEPLOY_PASSWORD or ADMIN_PASSWORD in .env.local before packaging.",
  );
}

writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
console.log(`Patched ${storePath} (site_url -> ${productionSiteUrl})`);
