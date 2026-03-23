import "../load-env.mjs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const token = process.env.VERCEL_TOKEN || process.argv[2] || "";

if (!token) {
  console.error("Missing VERCEL_TOKEN. Set it in the environment or pass it as the first argument.");
  process.exit(1);
}

const runtimeEnvKeys = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "GITHUB_TOKEN",
  "LIVE_SOURCE_REGISTRY_FILE",
  "LIVE_FEED_CACHE_TTL_MS",
  "GITHUB_SOURCE_CACHE_TTL_MS",
  "LIVE_FEED_MAX_ITEMS",
  "LIVE_FEED_TIMEOUT_MS",
  "ACCOUNT_STORE_FILE",
  "ACCOUNT_SESSION_TTL_HOURS",
  "ACCOUNT_MAX_SESSIONS",
  "SUPABASE_ACCOUNTS_TABLE",
  "SUPABASE_SESSIONS_TABLE"
];

const envArgs = runtimeEnvKeys.flatMap((key) => {
  const value = process.env[key];
  return value ? ["-e", `${key}=${value}`] : [];
});

const args = ["deploy", "--prod", "--yes", "--token", token, ...envArgs];
const vercelCliEntrypoint = path.join(projectRoot, "node_modules", "vercel", "dist", "vc.js");

const child = spawn(process.execPath, [vercelCliEntrypoint, ...args], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
