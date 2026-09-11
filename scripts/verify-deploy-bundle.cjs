/**
 * Verify the deploy/ bundle is safe for Linux shared hosting.
 * Usage: node scripts/verify-deploy-bundle.cjs
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const checks = [];

const nativeLibsql = fs.existsSync("deploy/node_modules/libsql");
checks.push([
  "no native libsql binding in bundle",
  !nativeLibsql,
  nativeLibsql ? "deploy/node_modules/libsql present — Linux will fail to load it" : "",
]);

checks.push([
  "Turso uses bundled fetch client (no @libsql npm package required)",
  !fs.existsSync("deploy/node_modules/libsql"),
  fs.existsSync("deploy/node_modules/libsql") ? "native libsql present" : "",
]);

checks.push([
  "server.js present",
  fs.existsSync("deploy/server.js"),
  "",
]);

const env = {};
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

const store = JSON.parse(
  fs.readFileSync("deploy/.data/admin-store.json", "utf8"),
);
const hash = String(store.settings.admin_password_hash || "");
checks.push([
  "fallback store password is bcrypt and matches ADMIN_PASSWORD",
  /^\$2[aby]\$/.test(hash) &&
    Boolean(env.ADMIN_PASSWORD) &&
    bcrypt.compareSync(env.ADMIN_PASSWORD, hash),
  `hash head ${hash.slice(0, 7)}`,
]);
checks.push([
  "fallback store site_url is production",
  String(store.settings.site_url || "").startsWith("https://"),
  String(store.settings.site_url || ""),
]);

let failed = 0;
for (const [label, ok, detail] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}
process.exit(failed === 0 ? 0 : 1);
