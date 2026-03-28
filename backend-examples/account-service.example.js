import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = process.env.ACCOUNT_STORE_FILE || (
  process.env.VERCEL
    ? path.join("/tmp", "ai-insight-account-store.json")
    : path.join(__dirname, "..", "data", "account-store.json")
);
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = String(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
const SUPABASE_ACCOUNTS_TABLE = String(process.env.SUPABASE_ACCOUNTS_TABLE || "ai_insight_accounts").trim() || "ai_insight_accounts";
const SUPABASE_SESSIONS_TABLE = String(process.env.SUPABASE_SESSIONS_TABLE || "ai_insight_sessions").trim() || "ai_insight_sessions";
const ACCOUNT_STORAGE_BACKEND = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "file";

const SESSION_TTL_MS = Math.max(1, Number(process.env.ACCOUNT_SESSION_TTL_HOURS || 720)) * 60 * 60 * 1000;
const MAX_SESSIONS_PER_USER = Math.max(1, Number(process.env.ACCOUNT_MAX_SESSIONS || 5));

const CATEGORY_KEYS = new Set(["all", "models", "chips", "products", "tooling", "research", "robotics", "policy"]);
const REGION_KEYS = new Set(["all", "global", "us", "china", "europe", "apac"]);
const VIEW_MODES = new Set(["pulse", "light", "pro"]);
const LOCAL_MODELS = new Set(["local-brief", "local-expanded"]);
const OPENAI_MODELS = new Set(["gpt-5.4-mini", "gpt-5.4-nano"]);
const DEEPSEEK_MODELS = new Set(["deepseek-chat", "deepseek-reasoner"]);
const OSS_MODELS = new Set(["gpt-oss:20b", "gpt-oss:120b", "qwen3-coder", "glm-4.7"]);

let storeCache;
let storePromise;
let persistQueue = Promise.resolve();

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function uniqueStrings(values) {
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value || seen.has(value)) {
        return false;
      }

      seen.add(value);
      return true;
    });
}

function slugifyTopic(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildTrackedTopicId(topic) {
  return [slugifyTopic(topic.query || topic.label || ""), topic.category || "all", topic.region || "all"].join("__");
}

function normalizeTrackedTopic(topic) {
  const source = topic && typeof topic === "object" ? topic : {};
  const query = String(source.query || source.label || "").trim();

  if (!query) {
    return null;
  }

  const category = CATEGORY_KEYS.has(source.category) ? source.category : "all";
  const region = REGION_KEYS.has(source.region) ? source.region : "all";
  const label = String(source.label || query).trim() || query;

  return {
    id: source.id || buildTrackedTopicId({ query, label, category, region }),
    query,
    label,
    category,
    region
  };
}

function dedupeTrackedTopics(values) {
  const seen = new Set();

  return (Array.isArray(values) ? values : [])
    .map(normalizeTrackedTopic)
    .filter((topic) => {
      if (!topic || seen.has(topic.id)) {
        return false;
      }

      seen.add(topic.id);
      return true;
    });
}

function normalizeSummaryPreference(value) {
  const source = value && typeof value === "object" ? value : {};
  const provider =
    source.provider === "deepseek" || source.provider === "local" || source.provider === "oss"
      ? source.provider
      : "openai";
  const modelSet = provider === "local"
    ? LOCAL_MODELS
    : provider === "deepseek"
      ? DEEPSEEK_MODELS
      : provider === "oss"
        ? OSS_MODELS
        : OPENAI_MODELS;
  const defaultModel = provider === "local"
    ? "local-brief"
    : provider === "deepseek"
      ? "deepseek-chat"
      : provider === "oss"
        ? "gpt-oss:20b"
        : "gpt-5.4-mini";

  return {
    provider,
    model: typeof source.model === "string" && modelSet.has(source.model) ? source.model : defaultModel
  };
}

function normalizeBriefingSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  const hour = Number.isFinite(Number(source.hour)) ? Math.min(23, Math.max(0, Number(source.hour))) : 8;
  const minute = Number.isFinite(Number(source.minute)) ? Math.min(59, Math.max(0, Number(source.minute))) : 0;
  const timezone = typeof source.timezone === "string" && source.timezone.trim() ? source.timezone.trim() : "UTC";

  return {
    enabled: Boolean(source.enabled),
    hour,
    minute,
    timezone
  };
}

function normalizeState(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    language: source.language === "en" ? "en" : "zh",
    viewMode: VIEW_MODES.has(source.viewMode) ? source.viewMode : "pulse",
    summaryPreference: normalizeSummaryPreference(source.summaryPreference),
    savedStories: uniqueStrings(source.savedStories),
    savedSources: uniqueStrings(source.savedSources),
    trackedTopics: dedupeTrackedTopics(source.trackedTopics),
    briefingSettings: normalizeBriefingSettings(source.briefingSettings)
  };
}

function hashPassword(password, salt) {
  return scryptSync(String(password || ""), salt, 64).toString("hex");
}

function createPasswordRecord(password) {
  const salt = randomBytes(16).toString("hex");
  return {
    salt,
    hash: hashPassword(password, salt)
  };
}

function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) {
    return false;
  }

  const candidate = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function hashToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function pruneSessions(user, nowMs) {
  const nextNow = typeof nowMs === "number" ? nowMs : Date.now();

  user.sessions = (Array.isArray(user.sessions) ? user.sessions : [])
    .filter((session) => session && session.tokenHash && Date.parse(session.expiresAt || "") > nextNow)
    .slice(0, MAX_SESSIONS_PER_USER);

  return user.sessions;
}

function normalizeUserRecord(user) {
  const source = user && typeof user === "object" ? user : {};
  const email = normalizeEmail(source.email);

  return {
    id: source.id || randomUUID(),
    email,
    displayName: String(source.displayName || email.split("@")[0] || "AI Reader").trim().slice(0, 80) || "AI Reader",
    passwordSalt: source.passwordSalt || "",
    passwordHash: source.passwordHash || "",
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: source.updatedAt || new Date().toISOString(),
    lastSyncedAt: source.lastSyncedAt || "",
    state: normalizeState(source.state),
    sessions: (Array.isArray(source.sessions) ? source.sessions : [])
      .map((session) => ({
        tokenHash: session && session.tokenHash ? String(session.tokenHash) : "",
        issuedAt: session && session.issuedAt ? String(session.issuedAt) : "",
        lastSeenAt: session && session.lastSeenAt ? String(session.lastSeenAt) : "",
        expiresAt: session && session.expiresAt ? String(session.expiresAt) : ""
      }))
      .filter((session) => session.tokenHash)
  };
}

function normalizeStore(store) {
  const source = store && typeof store === "object" ? store : {};

  return {
    version: 1,
    users: (Array.isArray(source.users) ? source.users : []).map(normalizeUserRecord)
  };
}

async function persistStore(store) {
  const payload = JSON.stringify(store, null, 2);
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  persistQueue = persistQueue.catch(() => {}).then(() => writeFile(STORE_PATH, payload, "utf8"));
  await persistQueue;
  storeCache = store;
  return store;
}

async function loadStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const store = normalizeStore(parsed);
    storeCache = store;
    return store;
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`AI Insight account store read failed: ${error.message}`);
    }

    const store = normalizeStore({ users: [] });
    await persistStore(store);
    return store;
  }
}

async function getStore() {
  if (storeCache) {
    return storeCache;
  }

  if (!storePromise) {
    storePromise = loadStore().finally(() => {
      storePromise = null;
    });
  }

  return storePromise;
}

function findUserByEmail(store, email) {
  const normalized = normalizeEmail(email);
  return store.users.find((user) => user.email === normalized) || null;
}

function findSessionByToken(store, token) {
  const tokenHash = hashToken(token);
  const now = Date.now();

  for (const user of store.users) {
    pruneSessions(user, now);

    const session = user.sessions.find((item) => item.tokenHash === tokenHash);

    if (session) {
      session.lastSeenAt = new Date().toISOString();
      return { user, session };
    }
  }

  return null;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    lastSyncedAt: user.lastSyncedAt || ""
  };
}

function buildSessionPayload(user, extra) {
  return {
    authenticated: true,
    user: sanitizeUser(user),
    state: normalizeState(user.state),
    lastSyncedAt: user.lastSyncedAt || "",
    ...(extra || {})
  };
}

function getAuthToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

function usesSupabaseStore() {
  return ACCOUNT_STORAGE_BACKEND === "supabase";
}

function isRecoverableSupabaseError(error) {
  const message = String(error && error.message ? error.message : "");
  return /PGRST205/i.test(message) || /relation .* does not exist/i.test(message) || /Could not find the table/i.test(message);
}

function logSupabaseFallback(error) {
  console.warn(`AI Insight account store falling back to file mode: ${error.message}`);
}

function encodeFilterValue(value) {
  return encodeURIComponent(String(value || ""));
}

function buildSupabaseRestUrl(table, query) {
  return `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

function getSupabaseHeaders(prefer) {
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json"
  };

  if (!/^sb_/i.test(SUPABASE_SERVICE_ROLE_KEY)) {
    headers.Authorization = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

async function supabaseRequest(options) {
  const query = options && options.query ? options.query : "";
  const response = await fetch(buildSupabaseRestUrl(options.table, query), {
    method: options.method || "GET",
    headers: {
      ...getSupabaseHeaders(options.prefer),
      ...(options.headers || {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`supabase_${response.status}${detail ? `:${detail}` : ""}`);
  }

  if (response.status === 204 || options.expectJson === false) {
    return null;
  }

  return response.json();
}

function toSupabaseAccountRow(user) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    password_salt: user.passwordSalt,
    password_hash: user.passwordHash,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    last_synced_at: user.lastSyncedAt || null,
    state: normalizeState(user.state)
  };
}

function getFirstRow(payload) {
  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  return payload && typeof payload === "object" ? payload : null;
}

function fromSupabaseAccountRow(row) {
  return normalizeUserRecord({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSyncedAt: row.last_synced_at || "",
    state: row.state
  });
}

function toSupabaseSessionRow(userId, session) {
  return {
    token_hash: session.tokenHash,
    user_id: userId,
    issued_at: session.issuedAt,
    last_seen_at: session.lastSeenAt,
    expires_at: session.expiresAt
  };
}

function fromSupabaseSessionRow(row) {
  return {
    tokenHash: String(row.token_hash || ""),
    issuedAt: String(row.issued_at || ""),
    lastSeenAt: String(row.last_seen_at || ""),
    expiresAt: String(row.expires_at || "")
  };
}

async function listSupabaseSessionsForUser(userId) {
  const rows = await supabaseRequest({
    table: SUPABASE_SESSIONS_TABLE,
    query: `user_id=eq.${encodeFilterValue(userId)}&select=token_hash,issued_at,last_seen_at,expires_at&order=issued_at.desc`
  });

  return (Array.isArray(rows) ? rows : []).map(fromSupabaseSessionRow);
}

async function attachSupabaseSessions(user) {
  const nextUser = normalizeUserRecord(user);
  nextUser.sessions = await listSupabaseSessionsForUser(nextUser.id);
  return nextUser;
}

async function getSupabaseUserByEmail(email) {
  const rows = await supabaseRequest({
    table: SUPABASE_ACCOUNTS_TABLE,
    query: `email=eq.${encodeFilterValue(normalizeEmail(email))}&select=*`
  });
  const row = getFirstRow(rows);
  return row ? attachSupabaseSessions(fromSupabaseAccountRow(row)) : null;
}

async function getSupabaseUserById(userId) {
  const rows = await supabaseRequest({
    table: SUPABASE_ACCOUNTS_TABLE,
    query: `id=eq.${encodeFilterValue(userId)}&select=*`
  });
  const row = getFirstRow(rows);
  return row ? attachSupabaseSessions(fromSupabaseAccountRow(row)) : null;
}

async function createSupabaseUser(user) {
  const rows = await supabaseRequest({
    table: SUPABASE_ACCOUNTS_TABLE,
    method: "POST",
    prefer: "return=representation",
    body: toSupabaseAccountRow(user)
  });
  const row = getFirstRow(rows);
  return row ? fromSupabaseAccountRow(row) : normalizeUserRecord(user);
}

async function updateSupabaseUser(user) {
  const rows = await supabaseRequest({
    table: SUPABASE_ACCOUNTS_TABLE,
    method: "PATCH",
    query: `id=eq.${encodeFilterValue(user.id)}`,
    prefer: "return=representation",
    body: toSupabaseAccountRow(user)
  });
  const row = getFirstRow(rows);
  return row ? attachSupabaseSessions(fromSupabaseAccountRow(row)) : attachSupabaseSessions(user);
}

async function insertSupabaseSession(userId, session) {
  await supabaseRequest({
    table: SUPABASE_SESSIONS_TABLE,
    method: "POST",
    prefer: "return=minimal",
    body: toSupabaseSessionRow(userId, session),
    expectJson: false
  });
}

async function updateSupabaseSession(tokenHash, patch) {
  await supabaseRequest({
    table: SUPABASE_SESSIONS_TABLE,
    method: "PATCH",
    query: `token_hash=eq.${encodeFilterValue(tokenHash)}`,
    prefer: "return=minimal",
    body: patch,
    expectJson: false
  });
}

async function deleteSupabaseSessionByTokenHash(tokenHash) {
  await supabaseRequest({
    table: SUPABASE_SESSIONS_TABLE,
    method: "DELETE",
    query: `token_hash=eq.${encodeFilterValue(tokenHash)}`,
    prefer: "return=minimal",
    expectJson: false
  });
}

async function pruneSupabaseSessionsForUser(userId) {
  const sessions = await listSupabaseSessionsForUser(userId);
  const nowMs = Date.now();
  const stale = [];
  const active = [];

  sessions.forEach((session) => {
    if (!session.tokenHash || Date.parse(session.expiresAt || "") <= nowMs) {
      stale.push(session);
    } else {
      active.push(session);
    }
  });

  const overflow = active.slice(MAX_SESSIONS_PER_USER);
  const removals = [...stale, ...overflow];

  for (const session of removals) {
    await deleteSupabaseSessionByTokenHash(session.tokenHash);
  }
}

async function findSupabaseSessionByToken(token) {
  const tokenHash = hashToken(token);
  const rows = await supabaseRequest({
    table: SUPABASE_SESSIONS_TABLE,
    query: `token_hash=eq.${encodeFilterValue(tokenHash)}&expires_at=gt.${encodeFilterValue(new Date().toISOString())}&select=*`
  });
  const row = getFirstRow(rows);

  if (!row) {
    return null;
  }

  const user = await getSupabaseUserById(row.user_id);

  if (!user) {
    await deleteSupabaseSessionByTokenHash(tokenHash);
    return null;
  }

  const session = fromSupabaseSessionRow(row);
  session.lastSeenAt = new Date().toISOString();
  await updateSupabaseSession(tokenHash, { last_seen_at: session.lastSeenAt });

  return {
    user,
    session
  };
}

async function handleRegister(request) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const displayName = String(body.displayName || body.name || email.split("@")[0] || "AI Reader").trim().slice(0, 80) || "AI Reader";

  if (!isValidEmail(email)) {
    return json({ error: "invalid_email" }, 400);
  }

  if (password.length < 8) {
    return json({ error: "password_too_short", minLength: 8 }, 400);
  }

  if (usesSupabaseStore()) {
    try {
      if (await getSupabaseUserByEmail(email)) {
        return json({ error: "email_already_exists" }, 409);
      }

      const now = new Date().toISOString();
      const passwordRecord = createPasswordRecord(password);
      const user = normalizeUserRecord({
        id: randomUUID(),
        email,
        displayName,
        passwordSalt: passwordRecord.salt,
        passwordHash: passwordRecord.hash,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
        state: body.state
      });
      const token = randomBytes(32).toString("hex");
      const session = {
        tokenHash: hashToken(token),
        issuedAt: now,
        lastSeenAt: now,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
      };

      const createdUser = await createSupabaseUser(user);
      await insertSupabaseSession(createdUser.id, session);
      await pruneSupabaseSessionsForUser(createdUser.id);

      return json(buildSessionPayload(await attachSupabaseSessions(createdUser), { token }), 201);
    } catch (error) {
      if (!isRecoverableSupabaseError(error)) {
        throw error;
      }

      logSupabaseFallback(error);
    }
  }

  const store = await getStore();

  if (findUserByEmail(store, email)) {
    return json({ error: "email_already_exists" }, 409);
  }

  const now = new Date().toISOString();
  const passwordRecord = createPasswordRecord(password);
  const user = normalizeUserRecord({
    id: randomUUID(),
    email,
    displayName,
    passwordSalt: passwordRecord.salt,
    passwordHash: passwordRecord.hash,
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: now,
    state: body.state
  });
  const token = randomBytes(32).toString("hex");

  user.sessions = [
    {
      tokenHash: hashToken(token),
      issuedAt: now,
      lastSeenAt: now,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    }
  ];

  store.users.unshift(user);
  await persistStore(store);

  return json(buildSessionPayload(user, { token }), 201);
}

async function handleLogin(request) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (usesSupabaseStore()) {
    try {
      const user = await getSupabaseUserByEmail(email);

      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        return json({ error: "invalid_credentials" }, 401);
      }

      const now = new Date().toISOString();
      const token = randomBytes(32).toString("hex");
      const session = {
        tokenHash: hashToken(token),
        issuedAt: now,
        lastSeenAt: now,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
      };

      user.updatedAt = now;
      await updateSupabaseUser(user);
      await insertSupabaseSession(user.id, session);
      await pruneSupabaseSessionsForUser(user.id);

      return json(buildSessionPayload(await attachSupabaseSessions(user), { token }));
    } catch (error) {
      if (!isRecoverableSupabaseError(error)) {
        throw error;
      }

      logSupabaseFallback(error);
    }
  }

  const store = await getStore();
  const user = findUserByEmail(store, email);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return json({ error: "invalid_credentials" }, 401);
  }

  const now = new Date().toISOString();
  const token = randomBytes(32).toString("hex");

  pruneSessions(user);
  user.sessions = [
    {
      tokenHash: hashToken(token),
      issuedAt: now,
      lastSeenAt: now,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    },
    ...user.sessions
  ].slice(0, MAX_SESSIONS_PER_USER);
  user.updatedAt = now;

  await persistStore(store);

  return json(buildSessionPayload(user, { token }));
}

async function handleSession(request) {
  const token = getAuthToken(request);

  if (!token) {
    return json({ authenticated: false });
  }

  if (usesSupabaseStore()) {
    try {
      const match = await findSupabaseSessionByToken(token);

      if (!match) {
        return json({ authenticated: false }, 401);
      }

      match.user.updatedAt = new Date().toISOString();
      const user = await updateSupabaseUser(match.user);

      return json(buildSessionPayload(user));
    } catch (error) {
      if (!isRecoverableSupabaseError(error)) {
        throw error;
      }

      logSupabaseFallback(error);
    }
  }

  const store = await getStore();
  const match = findSessionByToken(store, token);

  if (!match) {
    return json({ authenticated: false }, 401);
  }

  match.user.updatedAt = new Date().toISOString();
  await persistStore(store);

  return json(buildSessionPayload(match.user));
}

async function handleStateUpdate(request) {
  const token = getAuthToken(request);

  if (!token) {
    return json({ error: "unauthorized" }, 401);
  }

  if (usesSupabaseStore()) {
    try {
      const match = await findSupabaseSessionByToken(token);

      if (!match) {
        return json({ error: "unauthorized" }, 401);
      }

      const body = await readJson(request);
      const now = new Date().toISOString();

      match.user.state = normalizeState(body.state);
      match.user.updatedAt = now;
      match.user.lastSyncedAt = now;

      const user = await updateSupabaseUser(match.user);
      return json(buildSessionPayload(user, { syncedAt: now }));
    } catch (error) {
      if (!isRecoverableSupabaseError(error)) {
        throw error;
      }

      logSupabaseFallback(error);
    }
  }

  const store = await getStore();
  const match = findSessionByToken(store, token);

  if (!match) {
    return json({ error: "unauthorized" }, 401);
  }

  const body = await readJson(request);
  const now = new Date().toISOString();

  match.user.state = normalizeState(body.state);
  match.user.updatedAt = now;
  match.user.lastSyncedAt = now;

  await persistStore(store);

  return json(buildSessionPayload(match.user, { syncedAt: now }));
}

async function handleLogout(request) {
  const token = getAuthToken(request);

  if (!token) {
    return json({ authenticated: false, loggedOut: true });
  }

  if (usesSupabaseStore()) {
    try {
      await deleteSupabaseSessionByTokenHash(hashToken(token));
      return json({ authenticated: false, loggedOut: true });
    } catch (error) {
      if (!isRecoverableSupabaseError(error)) {
        throw error;
      }

      logSupabaseFallback(error);
    }
  }

  const store = await getStore();
  const tokenHash = hashToken(token);
  let changed = false;

  store.users.forEach((user) => {
    const previousLength = Array.isArray(user.sessions) ? user.sessions.length : 0;
    user.sessions = (Array.isArray(user.sessions) ? user.sessions : []).filter((session) => session.tokenHash !== tokenHash);

    if (user.sessions.length !== previousLength) {
      user.updatedAt = new Date().toISOString();
      changed = true;
    }
  });

  if (changed) {
    await persistStore(store);
  }

  return json({ authenticated: false, loggedOut: true });
}

export async function handleAccountRequest(request) {
  if (request.method === "OPTIONS") {
    return json({}, 200);
  }

  const url = new URL(request.url);
  const action = (url.searchParams.get("action") || "session").toLowerCase();

  if (action === "register") {
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    return handleRegister(request);
  }

  if (action === "login") {
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    return handleLogin(request);
  }

  if (action === "logout") {
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    return handleLogout(request);
  }

  if (action === "state") {
    if (request.method !== "PUT") {
      return json({ error: "method_not_allowed" }, 405);
    }

    return handleStateUpdate(request);
  }

  if (action === "session") {
    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405);
    }

    return handleSession(request);
  }

  return json({ error: "unknown_action" }, 404);
}
