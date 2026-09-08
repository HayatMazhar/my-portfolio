import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const hash =
  "$2b$10$GGKQiL4F7TVDbSwGK92M8.EZTmtIHLDaqCSxswLc3wiiGUWQYM.Ya";
const envLocal = resolve(".env.local");
if (!existsSync(envLocal)) {
  console.log("no .env.local");
  process.exit(0);
}
const match = readFileSync(envLocal, "utf8").match(/^ADMIN_PASSWORD=(.+)$/m);
const password = match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
console.log("passwordConfigured:", Boolean(password));
console.log("hashMatches:", password ? bcrypt.compareSync(password, hash) : false);
