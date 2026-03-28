/*
  Live feed example for the AI Insight site.
  Adapt `handleLiveFeedRequest` to your platform of choice
  (Vercel, Netlify Functions, Node, Express, Fastify, etc.).

  Output shape:
  {
    "refreshedAt": "2026-03-22T10:00:00.000Z",
    "items": [ ...normalizedStoryObjects ]
  }

  Design goals:
  1. Pull from primary / official sources when possible.
  2. Cache aggressively so the front-end can poll without hammering origins.
  3. Normalize all remote stories into the exact structure your front-end already expects.
  4. Keep source configuration easy to edit, even if you are not changing application code.
*/

import { access, readFile } from "node:fs/promises";
import path from "node:path";

const CACHE_TTL_MS = Number(process.env.LIVE_FEED_CACHE_TTL_MS || 5 * 60 * 1000);
const MAX_ITEMS_TOTAL = Number(process.env.LIVE_FEED_MAX_ITEMS || 48);
const REQUEST_TIMEOUT_MS = Number(process.env.LIVE_FEED_TIMEOUT_MS || 12000);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_SOURCE_CACHE_TTL_MS = Number(process.env.GITHUB_SOURCE_CACHE_TTL_MS || 30 * 60 * 1000);
const LIVE_SOURCE_REGISTRY_FILE = process.env.LIVE_SOURCE_REGISTRY_FILE || "./data/live-source-registry.json";
const DEFAULT_ARXIV_MAX_RESULTS = 6;

function createArxivSource(id, query, sourceName, tags) {
  return {
    id,
    type: "atom",
    url: `http://export.arxiv.org/api/query?search_query=${query}&sortBy=lastUpdatedDate&sortOrder=descending&max_results=${DEFAULT_ARXIV_MAX_RESULTS}`,
    sourceName,
    sourceType: "primary",
    category: "research",
    region: "global",
    signal: "frontier",
    maxItems: 4,
    tags
  };
}

function createGitHubSource(config) {
  return {
    type: "github",
    sourceType: "github",
    category: "tooling",
    region: "global",
    signal: "watch",
    micro: true,
    maxItems: 1,
    cacheTtlMs: GITHUB_SOURCE_CACHE_TTL_MS,
    ...config
  };
}

const BUILTIN_SOURCE_REGISTRY = [
  {
    id: "openai-news-rss",
    type: "rss",
    url: "https://openai.com/news/rss.xml",
    sourceName: "OpenAI",
    sourceType: "official",
    category: "products",
    region: "global",
    signal: "breakout",
    maxItems: 4,
    tags: ["OpenAI", "Official", "Product"]
  },
  {
    id: "anthropic-newsroom",
    type: "html",
    url: "https://www.anthropic.com/news",
    sourceName: "Anthropic",
    sourceType: "official",
    category: "products",
    region: "global",
    signal: "breakout",
    maxItems: 4,
    tags: ["Anthropic", "Official", "Enterprise AI"]
  },
  {
    id: "google-blog-rss",
    type: "rss",
    url: "https://blog.google/rss/",
    sourceName: "Google",
    sourceType: "official",
    category: "products",
    region: "global",
    signal: "breakout",
    maxItems: 5,
    includePatterns: [/\bai\b/i, /artificial intelligence/i, /gemini/i, /deepmind/i, /machine learning/i, /multimodal/i, /agent/i, /robotics/i, /veo/i, /imagen/i, /notebooklm/i],
    tags: ["Google", "Official", "AI ecosystem"]
  },
  {
    id: "microsoft-research-feed",
    type: "rss",
    url: "https://www.microsoft.com/en-us/research/feed/",
    sourceName: "Microsoft Research",
    sourceType: "primary",
    category: "research",
    region: "global",
    signal: "watch",
    maxItems: 4,
    includePatterns: [/\bai\b/i, /machine learning/i, /large language/i, /foundation model/i, /multimodal/i, /reasoning/i, /agent/i, /speech/i, /vision/i],
    tags: ["Microsoft", "Research", "Official"]
  },
  {
    id: "microsoft-blog-feed",
    type: "rss",
    url: "https://blogs.microsoft.com/feed/",
    sourceName: "Microsoft",
    sourceType: "official",
    category: "products",
    region: "global",
    signal: "breakout",
    maxItems: 4,
    includePatterns: [/\bai\b/i, /copilot/i, /agent/i, /model/i, /azure ai/i, /reasoning/i, /frontier/i],
    tags: ["Microsoft", "Official", "Copilot"]
  },
  {
    id: "nvidia-newsroom-releases",
    type: "rss",
    url: "https://nvidianews.nvidia.com/releases.xml",
    sourceName: "NVIDIA Newsroom",
    sourceType: "official",
    category: "chips",
    region: "global",
    signal: "frontier",
    maxItems: 4,
    includePatterns: [/\bai\b/i, /artificial intelligence/i, /gpu/i, /inference/i, /training/i, /robotics/i, /dgx/i, /blackwell/i, /cluster/i, /data center/i, /network/i, /nim/i],
    tags: ["NVIDIA", "Official", "Infrastructure"]
  },
  {
    id: "nvidia-developer-blog",
    type: "rss",
    url: "https://developer.nvidia.com/blog/feed",
    sourceName: "NVIDIA Developer",
    sourceType: "official",
    category: "chips",
    region: "global",
    signal: "breakout",
    maxItems: 4,
    includePatterns: [/\bai\b/i, /artificial intelligence/i, /llm/i, /agent/i, /inference/i, /training/i, /cuda/i, /tensor/i, /robotics/i, /nim/i],
    tags: ["NVIDIA", "Developer", "AI tooling"]
  },
  createArxivSource("arxiv-cs-ai-api", "cat:cs.AI", "arXiv cs.AI", ["Research", "Open access", "Preprint"]),
  createArxivSource("arxiv-cs-lg-api", "cat:cs.LG", "arXiv cs.LG", ["Machine Learning", "Open access", "Preprint"]),
  createArxivSource("arxiv-cs-cl-api", "cat:cs.CL", "arXiv cs.CL", ["Language", "Open access", "Preprint"]),
  createArxivSource("arxiv-cs-cv-api", "cat:cs.CV", "arXiv cs.CV", ["Vision", "Open access", "Preprint"]),
  createGitHubSource({
    id: "github-browser-use",
    repo: "browser-use/browser-use",
    sourceName: "GitHub / browser-use",
    signal: "breakout",
    tags: ["GitHub", "Browser agents", "Automation"],
    briefType: "Tool launch"
  }),
  createGitHubSource({
    id: "github-openhands",
    repo: "All-Hands-AI/OpenHands",
    sourceName: "GitHub / OpenHands",
    signal: "breakout",
    tags: ["GitHub", "Coding agents", "Developer tools"],
    briefType: "OSS release"
  }),
  createGitHubSource({
    id: "github-autogen",
    repo: "microsoft/autogen",
    sourceName: "GitHub / AutoGen",
    signal: "breakout",
    tags: ["GitHub", "Multi-agent", "Developer tools"],
    briefType: "Agent framework"
  }),
  createGitHubSource({
    id: "github-langgraph",
    repo: "langchain-ai/langgraph",
    sourceName: "GitHub / LangGraph",
    signal: "breakout",
    tags: ["GitHub", "Agent orchestration", "LangChain"],
    briefType: "Agent platform"
  }),
  createGitHubSource({
    id: "github-openai-agents",
    repo: "openai/openai-agents-python",
    sourceName: "GitHub / OpenAI Agents SDK",
    signal: "breakout",
    tags: ["GitHub", "OpenAI", "Agents"],
    briefType: "Official SDK"
  }),
  createGitHubSource({
    id: "github-langflow",
    repo: "langflow-ai/langflow",
    sourceName: "GitHub / Langflow",
    signal: "breakout",
    tags: ["GitHub", "Workflow builders", "Low-code"],
    briefType: "Workflow tool"
  }),
  createGitHubSource({
    id: "github-flowise",
    repo: "FlowiseAI/Flowise",
    sourceName: "GitHub / Flowise",
    signal: "watch",
    tags: ["GitHub", "Workflow builders", "Open source"],
    briefType: "App builder"
  }),
  createGitHubSource({
    id: "github-dify",
    repo: "langgenius/dify",
    sourceName: "GitHub / Dify",
    signal: "breakout",
    tags: ["GitHub", "AI app platform", "Open source"],
    briefType: "Product platform"
  }),
  createGitHubSource({
    id: "github-crewai",
    repo: "crewAIInc/crewAI",
    sourceName: "GitHub / crewAI",
    signal: "watch",
    tags: ["GitHub", "Multi-agent", "Automation"],
    briefType: "Agent framework"
  }),
  createGitHubSource({
    id: "github-pydantic-ai",
    repo: "pydantic/pydantic-ai",
    sourceName: "GitHub / PydanticAI",
    signal: "watch",
    tags: ["GitHub", "Python", "Agent framework"],
    briefType: "Developer framework"
  }),
  createGitHubSource({
    id: "github-opik",
    repo: "comet-ml/opik",
    sourceName: "GitHub / Opik",
    signal: "watch",
    tags: ["GitHub", "LLMOps", "Evaluation"],
    briefType: "Evaluation stack"
  }),
  createGitHubSource({
    id: "github-ollama",
    repo: "ollama/ollama",
    sourceName: "GitHub / Ollama",
    signal: "breakout",
    tags: ["GitHub", "Local models", "Open source"],
    briefType: "Local model runtime"
  }),
  createGitHubSource({
    id: "github-open-webui",
    repo: "open-webui/open-webui",
    sourceName: "GitHub / Open WebUI",
    signal: "breakout",
    tags: ["GitHub", "AI interface", "Open source"],
    briefType: "AI workspace"
  }),
  createGitHubSource({
    id: "github-vllm",
    repo: "vllm-project/vllm",
    sourceName: "GitHub / vLLM",
    signal: "breakout",
    tags: ["GitHub", "Inference", "Serving"],
    briefType: "Inference engine"
  }),
  createGitHubSource({
    id: "github-llama-cpp",
    repo: "ggml-org/llama.cpp",
    sourceName: "GitHub / llama.cpp",
    signal: "watch",
    tags: ["GitHub", "Local inference", "C++"],
    briefType: "Local inference"
  }),
  createGitHubSource({
    id: "github-litellm",
    repo: "BerriAI/litellm",
    sourceName: "GitHub / LiteLLM",
    signal: "watch",
    tags: ["GitHub", "Gateway", "LLMOps"],
    briefType: "Model gateway"
  })
];

const cacheState = {
  expiresAt: 0,
  payload: null
};
const sourceCache = new Map();

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
}

function stripHtml(html) {
  return decodeHtmlEntities(String(html || "")).replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function truncate(text, limit) {
  const clean = normalizeWhitespace(text);
  if (!clean || clean.length <= limit) {
    return clean;
  }

  return `${clean.slice(0, Math.max(0, limit - 3)).trim()}...`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function compilePatternList(patterns) {
  return (patterns || [])
    .map((pattern) => {
      if (!pattern) {
        return null;
      }

      if (pattern instanceof RegExp) {
        return pattern;
      }

      if (typeof pattern === "string") {
        return new RegExp(pattern, "i");
      }

      return null;
    })
    .filter(Boolean);
}

function normalizeSourceKind(source) {
  const kind = source.kind || source.type || "rss";
  const map = {
    rss: "rss",
    atom: "atom",
    html: "html",
    github: "github",
    "html-index": "html",
    "atom-api": "atom",
    "github-repo": "github",
    "rss-directory": "rss"
  };

  return map[kind] || "rss";
}

function normalizeSourceConfig(source) {
  return {
    ...source,
    type: normalizeSourceKind(source),
    sourceName: source.sourceName || source.name || source.id,
    sourceType: source.sourceType || source.authority || (normalizeSourceKind(source) === "github" ? "github" : "official"),
    tags: Array.isArray(source.tags) ? source.tags : [],
    maxItems: Number(source.maxItems || 0) || undefined,
    cacheTtlMs: Number(source.cacheTtlMs || 0) || undefined,
    includePatterns: compilePatternList(source.includePatterns),
    linkIncludePatterns: compilePatternList(source.linkIncludePatterns),
    excludePatterns: compilePatternList(source.excludePatterns)
  };
}

function resolveRegistryPath(filePath) {
  if (!filePath) {
    return "";
  }

  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

async function loadSourceRegistry() {
  const fallback = BUILTIN_SOURCE_REGISTRY.map((source) => normalizeSourceConfig(source));
  const registryPath = resolveRegistryPath(LIVE_SOURCE_REGISTRY_FILE);

  if (!registryPath) {
    return fallback;
  }

  try {
    await access(registryPath);
  } catch {
    return fallback;
  }

  try {
    const raw = await readFile(registryPath, "utf8");
    const parsed = JSON.parse(raw);
    const sources = Array.isArray(parsed.sources)
      ? parsed.sources.map((source) => normalizeSourceConfig(source)).filter((source) => source.id)
      : [];

    return sources.length ? sources : fallback;
  } catch (error) {
    console.warn(`[live-feed] Failed to read source registry at ${registryPath}: ${error.message}`);
    return fallback;
  }
}

let sourceRegistryPromise = null;

async function getSourceRegistry(options) {
  const nextOptions = options || {};

  if (nextOptions.reloadRegistry || !sourceRegistryPromise) {
    sourceRegistryPromise = loadSourceRegistry();
  }

  return sourceRegistryPromise;
}

function matchesAnyPattern(text, patterns) {
  if (!patterns || !patterns.length) {
    return false;
  }

  return patterns.some((pattern) => pattern.test(text));
}

function matchesSourceFilters(item, source) {
  const haystack = normalizeWhitespace(`${item.title || ""} ${item.summary || item.description || ""}`);
  const link = normalizeWhitespace(item.link || "");

  if (source.includePatterns && source.includePatterns.length && !matchesAnyPattern(haystack, source.includePatterns)) {
    return false;
  }

  if (source.linkIncludePatterns && source.linkIncludePatterns.length && !matchesAnyPattern(link, source.linkIncludePatterns)) {
    return false;
  }

  if (
    source.excludePatterns &&
    source.excludePatterns.length &&
    (matchesAnyPattern(haystack, source.excludePatterns) || matchesAnyPattern(link, source.excludePatterns))
  ) {
    return false;
  }

  return true;
}

function limitSourceItems(items, source) {
  const limit = Number(source.maxItems || 0);

  if (!limit) {
    return items;
  }

  return items.slice(0, limit);
}

function getXmlTagValue(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? normalizeWhitespace(stripHtml(match[1])) : "";
}

function extractTextByPatterns(source, patterns) {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match && match[1]) {
      const value = normalizeWhitespace(stripHtml(match[1]));
      if (value) {
        return value;
      }
    }
  }

  return "";
}

function getAtomLinkValue(block) {
  const hrefMatch = block.match(/<link[^>]+href="([^"]+)"/i);
  if (hrefMatch) {
    return normalizeWhitespace(hrefMatch[1]);
  }

  return normalizeWhitespace(getXmlTagValue(block, "link"));
}

function normalizeDate(value) {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function formatCompactNumber(value) {
  const count = Number(value || 0);

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(count >= 10000000 ? 0 : 1)}m`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 100000 ? 0 : 1)}k`;
  }

  return String(count);
}

function parseCompactNumber(value) {
  const text = normalizeWhitespace(String(value || "")).toLowerCase().replace(/,/g, "");
  const match = text.match(/^([0-9]+(?:\.[0-9]+)?)([km])?$/i);

  if (!match) {
    const digits = Number(text.replace(/[^0-9.]/g, ""));
    return Number.isFinite(digits) ? digits : 0;
  }

  const base = Number(match[1]);
  const suffix = match[2];

  if (suffix === "m") {
    return Math.round(base * 1000000);
  }

  if (suffix === "k") {
    return Math.round(base * 1000);
  }

  return Math.round(base);
}

function extractMetaContent(html, attribute, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<meta[^>]+${attribute}="${escapedKey}"[^>]+content="([^"]+)"`, "i"));
  return match ? normalizeWhitespace(decodeHtmlEntities(match[1])) : "";
}

function inferCategory(title, summary, fallback) {
  const haystack = `${title} ${summary}`.toLowerCase();

  if (/(sdk|framework|tooling|workflow|open source|github|observability|llmops|evaluation stack)/.test(haystack)) {
    return "tooling";
  }

  if (/(gpu|chip|cluster|datacenter|data center|cloud|inference|telecom|networking|interconnect|fabric|\bcompute\b|blackwell|dgx|cuda)/.test(haystack)) {
    return "chips";
  }

  if (/(paper|benchmark|research|preprint|arxiv|study|evaluation)/.test(haystack)) {
    return "research";
  }

  if (/(policy|government|regulation|safety|framework|partnership)/.test(haystack)) {
    return "policy";
  }

  if (/(model|gpt|claude|gemini|reasoning|multimodal|frontier)/.test(haystack)) {
    return "models";
  }

  if (/(robot|embodied|automation|computer use)/.test(haystack)) {
    return "robotics";
  }

  return fallback || "products";
}

function inferRegion(title, summary, fallback) {
  const haystack = `${title} ${summary}`.toLowerCase();

  if (/(india|singapore|japan|korea|australia|apac)/.test(haystack)) {
    return "apac";
  }

  if (/(china|beijing|shanghai|shenzhen)/.test(haystack)) {
    return "china";
  }

  if (/(europe|eu|brussels|germany|france|uk)/.test(haystack)) {
    return "europe";
  }

  if (/(united states|u\.s\.|us |washington|california|texas)/.test(haystack)) {
    return "us";
  }

  return fallback || "global";
}

function inferSignal(title, summary, fallback) {
  const haystack = `${title} ${summary}`.toLowerCase();

  if (/(frontier|first|largest|new generation|acquire|launch|deep think|6g)/.test(haystack)) {
    return "frontier";
  }

  if (/(partnership|rollout|expand|update|enterprise|release)/.test(haystack)) {
    return "breakout";
  }

  return fallback || "watch";
}

function extractKeywordTags(title, summary, sourceName) {
  const tags = [sourceName];
  const haystack = `${title} ${summary}`.toLowerCase();
  const candidates = [
    { key: "OpenAI", pattern: /openai|chatgpt|gpt-/ },
    { key: "Anthropic", pattern: /anthropic|claude/ },
    { key: "Google", pattern: /google|gemini|deepmind/ },
    { key: "Microsoft", pattern: /microsoft|copilot|autogen/ },
    { key: "NVIDIA", pattern: /nvidia/ },
    { key: "Research", pattern: /research|paper|preprint|study|benchmark/ },
    { key: "Agents", pattern: /agent|computer use|workflow|orchestration/ },
    { key: "Tooling", pattern: /sdk|framework|tooling|llmops|observability|github|open source/ },
    { key: "Infrastructure", pattern: /cloud|\bcompute\b|gpu|cluster|datacenter|data center|inference|networking|interconnect|fabric|blackwell|dgx|cuda/ },
    { key: "Enterprise AI", pattern: /enterprise|adoption|deployment|partner/ },
    { key: "Vision", pattern: /vision|image|video|multimodal/ },
    { key: "Language", pattern: /language|translation|speech|reasoning/ }
  ];

  candidates.forEach((candidate) => {
    if (candidate.pattern.test(haystack)) {
      tags.push(candidate.key);
    }
  });

  return unique(tags).slice(0, 5);
}

function buildSummaryPoints(summary, sourceName, category) {
  const lead = truncate(summary || "Source-backed update collected from a primary feed.", 140);
  const second = `${sourceName} is the primary source behind this live brief.`;
  const thirdMap = {
    models: "Track whether this changes model capability, pricing, or API access.",
    chips: "Track downstream effects on compute supply, inference cost, or cloud rollout.",
    research: "Track whether this turns into a paper, benchmark shift, or follow-on replication.",
    policy: "Track whether it changes governance, ecosystem incentives, or go-to-market behavior.",
    robotics: "Track whether this expands real-world automation capability.",
    tooling: "Track whether this changes developer workflow, evaluation quality, or production readiness.",
    products: "Track whether it changes enterprise workflow, adoption, or distribution."
  };

  return [lead, second, thirdMap[category] || thirdMap.products];
}

function buildInsight(sourceName, category) {
  const lensMap = {
    models: "Frontier model coverage matters most when it changes deployment behavior, not only benchmark headlines.",
    chips: "Infrastructure stories often shape the ceiling of the AI market longer than a single model launch.",
    research: "Research signals matter when they start influencing tooling, evaluation, or production roadmaps.",
    policy: "Governance and partnership moves often reveal where the ecosystem is becoming more durable.",
    robotics: "Embodied and automation coverage matters when software capability starts crossing into execution.",
    tooling: "Tooling stories matter when they reveal where builders are standardizing on workflows, SDKs, and evaluation layers.",
    products: "Product and rollout updates matter most when they show how AI is becoming part of real workflows."
  };

  return `${sourceName} update. ${lensMap[category] || lensMap.products}`;
}

function buildWho(category) {
  const map = {
    models: "Model teams, developer platforms, and enterprise AI leads",
    chips: "Infrastructure teams, cloud builders, and inference-service operators",
    research: "Researchers, applied scientists, and evaluation teams",
    policy: "Policy researchers, partner managers, and strategy leads",
    robotics: "Automation builders, robotics teams, and workflow operators",
    tooling: "Developer platform teams, AI builders, and technical product leads",
    products: "Product teams, enterprise operators, and transformation leaders"
  };

  return map[category] || map.products;
}

function buildWatchpoint(category) {
  const map = {
    models: "Watch follow-on announcements around APIs, pricing, benchmarks, and enterprise packaging.",
    chips: "Watch whether more suppliers, facilities, or telecom partners cluster around the same stack.",
    research: "Watch whether this feeds into benchmarks, replications, or production tooling.",
    policy: "Watch for second-order effects on procurement, compliance, and regional rollout.",
    robotics: "Watch whether the capability crosses from demos into stable real-world execution.",
    tooling: "Watch whether the project adds integrations, more stable releases, or clearer production boundaries.",
    products: "Watch whether the update changes adoption, workflow depth, or partner behavior."
  };

  return map[category] || map.products;
}

function toBilingual(value) {
  const text = normalizeWhitespace(value);
  return {
    zh: "",
    en: text
  };
}

function toOptionalBilingualList(values) {
  const items = (values || []).map((value) => normalizeWhitespace(value)).filter(Boolean);
  return {
    zh: [],
    en: items
  };
}

function buildGitHubDeck(repo, release) {
  const releaseLead = normalizeWhitespace(release && (release.name || release.body || ""));
  const repoLead = normalizeWhitespace(repo.description || "");
  return truncate(releaseLead || repoLead || `${repo.full_name} posted a fresh open-source update.`, 220);
}

function parseGitHubRepoHtml(html, repoPath) {
  const canonicalPath =
    extractMetaContent(html, "name", "octolytics-dimension-repository_nwo") ||
    extractMetaContent(html, "property", "og:title")
      .replace(/^GitHub - /i, "")
      .split(":")[0]
      .trim() ||
    repoPath;
  const descriptionMeta =
    extractMetaContent(html, "name", "description") ||
    extractMetaContent(html, "property", "og:description");
  const description = normalizeWhitespace(
    descriptionMeta.replace(new RegExp(`^GitHub\\s+-\\s+${canonicalPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*`, "i"), "")
  );
  const starsText = extractTextByPatterns(html, [
    /id="repo-stars-counter-star"[^>]*title="([^"]+)"/i,
    new RegExp(`href="/${canonicalPath.replace("/", "\\/")}/stargazers"[^>]*>[\\s\\S]*?<strong[^>]*>([\\s\\S]*?)<\\/strong>`, "i")
  ]);
  const forksText = extractTextByPatterns(html, [
    new RegExp(`href="/${canonicalPath.replace("/", "\\/")}/network/members"[^>]*>[\\s\\S]*?<strong[^>]*>([\\s\\S]*?)<\\/strong>`, "i")
  ]);
  const language = extractTextByPatterns(html, [
    /<span class="color-fg-default text-bold mr-1">([\s\S]*?)<\/span>/i
  ]);
  const topics = [...html.matchAll(/href="\/topics\/([^"]+)"/gi)].map((match) => normalizeWhitespace(match[1])).filter(Boolean);

  return {
    full_name: canonicalPath,
    name: canonicalPath.split("/").pop(),
    html_url: `https://github.com/${canonicalPath}`,
    description,
    stargazers_count: parseCompactNumber(starsText),
    forks_count: parseCompactNumber(forksText),
    language,
    topics: unique(topics).slice(0, 6),
    pushed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function parseGitHubReleaseHtml(html, repoPath) {
  const repoPathPattern = repoPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const releaseHrefMatch = html.match(new RegExp(`href="/${repoPathPattern}/releases/tag/([^"#?]+)"`, "i"));

  if (!releaseHrefMatch) {
    return null;
  }

  const tag = decodeURIComponent(releaseHrefMatch[1]);
  const releaseBlockPattern = new RegExp(
    `<a[^>]+href="/${repoPathPattern}/releases/tag/${releaseHrefMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]*?(?:<relative-time[^>]+datetime="([^"]+)"|<time[^>]+datetime="([^"]+)")`,
    "i"
  );
  const blockMatch = html.match(releaseBlockPattern);
  const publishedAt = blockMatch ? blockMatch[1] || blockMatch[2] || "" : "";

  return {
    tag_name: tag,
    name: tag,
    html_url: `https://github.com/${repoPath}/releases/tag/${releaseHrefMatch[1]}`,
    published_at: publishedAt || new Date().toISOString(),
    created_at: publishedAt || new Date().toISOString(),
    body: tag
  };
}

function buildGitHubSummaryPoints(repo, release, source) {
  const starLine = `${repo.full_name} now sits at about ${formatCompactNumber(repo.stargazers_count)} stars on GitHub.`;
  const releaseLine = release && release.tag_name
    ? `Latest release: ${release.tag_name} on ${normalizeDate(release.published_at || release.created_at)}.`
    : `Recent repository activity remains live, with the latest push on ${normalizeDate(repo.pushed_at || repo.updated_at)}.`;
  const angleLine = source.briefType
    ? `${source.briefType} coverage helps the feed surface high-signal tools beyond large-company headlines.`
    : "This repo belongs in the tooling radar rather than the heavyweight headline lane.";

  return [starLine, releaseLine, angleLine];
}

function buildGitHubInsight(repo) {
  return `${repo.full_name} is a useful ecosystem signal because it shows where builder attention is concentrating beyond frontier labs.`;
}

function buildGitHubWho(repo) {
  if (/(agent|browser|workflow|automation)/i.test(`${repo.name} ${repo.description || ""}`)) {
    return "Product engineers, automation teams, and agent builders";
  }

  return "Developer platform teams, applied AI builders, and technical product leads";
}

function buildGitHubWatchpoint(repo, release) {
  if (release && release.tag_name) {
    return `Watch whether ${repo.name} keeps shipping stable releases, stronger integrations, and clearer production boundaries.`;
  }

  return `Watch whether ${repo.name} converts community attention into more stable releases, integrations, and production usage.`;
}

function buildGitHubProNotes(repo, release) {
  const notes = [
    `${repo.full_name} has about ${formatCompactNumber(repo.stargazers_count)} stars and ${formatCompactNumber(repo.forks_count)} forks.`,
    `Primary language: ${repo.language || "n/a"}. Last repo push: ${normalizeDate(repo.pushed_at || repo.updated_at)}.`
  ];

  if (release && release.tag_name) {
    notes.unshift(`Latest GitHub release: ${release.tag_name} on ${normalizeDate(release.published_at || release.created_at)}.`);
  }

  return notes.slice(0, 3);
}

function normalizeGitHubRepoItem(repo, release, source) {
  const title = release && release.tag_name
    ? `${repo.name} ships ${release.tag_name}`
    : `${repo.name} stays active in the AI tooling radar`;
  const deck = buildGitHubDeck(repo, release);
  const publishedAt = normalizeDate(
    (release && (release.published_at || release.created_at)) ||
    repo.pushed_at ||
    repo.updated_at
  );
  const tags = unique([...(source.tags || []), ...(Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : [])]).slice(0, 6);
  const metricValue = [
    `${formatCompactNumber(repo.stargazers_count)} stars`,
    release && release.tag_name ? release.tag_name : null,
    publishedAt
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    id: `${source.id}-${slugify(release && release.tag_name ? `${repo.full_name}-${release.tag_name}` : repo.full_name)}`,
    slug: `${source.id}-${slugify(repo.full_name)}`,
    live: true,
    micro: true,
    featured: false,
    category: source.category || "tooling",
    region: source.region || "global",
    signal: source.signal || inferSignal(title, deck, "watch"),
    date: publishedAt,
    sourceName: source.sourceName || `GitHub / ${repo.name}`,
    sourceType: source.sourceType || "github",
    sourceUrl: (release && release.html_url) || repo.html_url,
    readingTime: 2,
    tags,
    title: toBilingual(title),
    deck: toBilingual(deck),
    summaryPoints: {
      zh: [],
      en: buildGitHubSummaryPoints(repo, release, source)
    },
    editorialSummary: toBilingual(deck),
    aiSummary: null,
    briefType: toBilingual(source.briefType || "Tool radar"),
    metricLabel: toBilingual("Project signal"),
    metricValue,
    proNotes: toOptionalBilingualList(buildGitHubProNotes(repo, release)),
    insight: toBilingual(buildGitHubInsight(repo)),
    who: toBilingual(buildGitHubWho(repo)),
    watchpoint: toBilingual(buildGitHubWatchpoint(repo, release)),
    content: {
      zh: [],
      en: [
        deck,
        `${repo.full_name} is being tracked as part of the tool and OSS radar so the feed can capture ecosystem movement beyond large-company announcements.`
      ]
    }
  };
}

function normalizeRemoteItem(item, source, index) {
  const title = normalizeWhitespace(item.title || "Untitled update");
  const summary = truncate(item.summary || item.description || `${source.sourceName} published a new update.`, 280);
  const category = inferCategory(title, summary, source.category);
  const region = inferRegion(title, summary, source.region);
  const signal = inferSignal(title, summary, source.signal);
  const idBase = `${source.id}-${slugify(item.link || title || String(index)) || index}`;

  return {
    id: idBase,
    slug: idBase,
    live: true,
    micro: Boolean(source.micro),
    featured: false,
    category,
    region,
    signal,
    date: normalizeDate(item.date),
    sourceName: source.sourceName,
    sourceType: source.sourceType || "official",
    sourceUrl: item.link,
    readingTime: Math.max(3, Math.min(6, Math.ceil((title.length + summary.length) / 180))),
    tags: extractKeywordTags(title, summary, source.sourceName).concat(source.tags || []).filter((value, itemIndex, list) => list.indexOf(value) === itemIndex).slice(0, 5),
    title: toBilingual(title),
    deck: toBilingual(summary),
    summaryPoints: {
      zh: [],
      en: buildSummaryPoints(summary, source.sourceName, category)
    },
    editorialSummary: toBilingual(summary),
    aiSummary: null,
    insight: toBilingual(buildInsight(source.sourceName, category)),
    who: toBilingual(buildWho(category)),
    watchpoint: toBilingual(buildWatchpoint(category)),
    content: {
      zh: [],
      en: [summary]
    }
  };
}

function parseRssLike(xml) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  return blocks.map((block) => ({
    title: getXmlTagValue(block, "title"),
    link: getAtomLinkValue(block),
    date: getXmlTagValue(block, "pubDate") || getXmlTagValue(block, "updated") || getXmlTagValue(block, "published"),
    summary:
      getXmlTagValue(block, "description") ||
      getXmlTagValue(block, "summary") ||
      getXmlTagValue(block, "content") ||
      getXmlTagValue(block, "content:encoded")
  }));
}

function parseAnthropicNewsroom(html) {
  const matches = [...html.matchAll(/href="(\/news\/[^"#?]+)"/gi)];
  const seen = new Set();

  return matches
    .map((match) => match[1])
    .filter((href) => {
      if (seen.has(href)) {
        return false;
      }

      seen.add(href);
      return true;
    })
    .slice(0, 6)
    .map((href, index) => {
      const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const anchorMatch = html.match(new RegExp(`<a[^>]+href="${escapedHref}"[^>]*>([\\s\\S]*?)<\\/a>`, "i"));
      const anchorMarkup = anchorMatch ? anchorMatch[1] : "";
      const windowStart = anchorMatch ? html.indexOf(anchorMatch[0]) : -1;
      const context = windowStart >= 0 ? html.slice(Math.max(0, windowStart - 400), windowStart + 1200) : "";
      const timeMatch = context.match(/datetime="([^"]+)"/i) || context.match(/([A-Z][a-z]{2,9} \\d{1,2}, \\d{4})/);
      const fallbackTitle = href.split("/").pop().replace(/-/g, " ");
      const title =
        extractTextByPatterns(anchorMarkup, [
          /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i,
          /<span[^>]+title[^>]*>([\s\S]*?)<\/span>/i
        ]) ||
        extractTextByPatterns(context, [
          /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i,
          /<span[^>]+title[^>]*>([\s\S]*?)<\/span>/i
        ]) ||
        normalizeWhitespace(stripHtml(anchorMarkup || fallbackTitle));
      const paragraph =
        extractTextByPatterns(anchorMarkup, [/<p[^>]*>([\s\S]*?)<\/p>/i]) ||
        extractTextByPatterns(context, [/<p[^>]*>([\s\S]*?)<\/p>/i]);
      const summary = paragraph
        ? truncate(`${paragraph} Collected from the official Anthropic newsroom index.`, 280)
        : `${title}. Collected from the official Anthropic newsroom index.`;

      return {
        title,
        link: `https://www.anthropic.com${href}`,
        date: timeMatch ? timeMatch[1] : new Date(Date.now() - index * 86400000).toISOString(),
        summary
      };
    });
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AIInsightLiveFeed/1.0 (+https://your-domain.com)"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Source returned ${response.status} for ${url}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, headers) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Source returned ${response.status} for ${url}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function getGitHubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
    "User-Agent": "AIInsightLiveFeed/1.0 (+https://your-domain.com)"
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
}

function shouldFallbackGitHubHtml(error) {
  return / 403 | 429 /i.test(` ${error.message} `);
}

async function fetchGitHubRelease(repoPath) {
  try {
    return await fetchJson(`https://api.github.com/repos/${repoPath}/releases/latest`, getGitHubHeaders());
  } catch (error) {
    if (/ 404 /.test(` ${error.message} `) || / 403 /.test(` ${error.message} `)) {
      return null;
    }

    throw error;
  }
}

async function fetchGitHubSourceItems(source) {
  try {
    const repo = await fetchJson(`https://api.github.com/repos/${source.repo}`, getGitHubHeaders());
    const release = await fetchGitHubRelease(source.repo);
    return limitSourceItems([normalizeGitHubRepoItem(repo, release, source)], source);
  } catch (error) {
    if (!shouldFallbackGitHubHtml(error)) {
      throw error;
    }

    const repoHtml = await fetchText(`https://github.com/${source.repo}`);
    const releaseHtml = await fetchText(`https://github.com/${source.repo}/releases`);
    const repo = parseGitHubRepoHtml(repoHtml, source.repo);
    const release = parseGitHubReleaseHtml(releaseHtml, repo.full_name || source.repo);
    return limitSourceItems([normalizeGitHubRepoItem(repo, release, source)], source);
  }
}

async function fetchSourceItemsFromNetwork(source) {
  if (source.type === "github") {
    return fetchGitHubSourceItems(source);
  }

  const body = await fetchText(source.url);
  const normalizedItems =
    source.type === "html"
      ? parseAnthropicNewsroom(body).map((item, index) => normalizeRemoteItem(item, source, index))
      : parseRssLike(body).map((item, index) => normalizeRemoteItem(item, source, index));

  return limitSourceItems(normalizedItems.filter((item) => matchesSourceFilters(item, source)), source);
}

async function fetchSourceItems(source, options) {
  const nextOptions = options || {};
  const ttl = Number(source.cacheTtlMs || CACHE_TTL_MS);
  const cached = sourceCache.get(source.id);

  if (!nextOptions.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.items;
  }

  const items = await fetchSourceItemsFromNetwork(source);
  sourceCache.set(source.id, {
    expiresAt: Date.now() + ttl,
    items
  });
  return items;
}

function dedupeStories(stories) {
  const seen = new Set();

  return stories.filter((story) => {
    const key = story.sourceUrl || `${story.sourceName}-${story.slug}-${story.date}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sortStories(stories) {
  return [...stories].sort((left, right) => new Date(right.date) - new Date(left.date));
}

async function collectLiveStories(options) {
  const nextOptions = options || {};
  const sourceRegistry = await getSourceRegistry({ reloadRegistry: nextOptions.reloadRegistry });
  const results = await Promise.allSettled(sourceRegistry.map((source) => fetchSourceItems(source, nextOptions)));
  const successfulGroups = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => sortStories(result.value))
    .filter((items) => items.length);
  const firstPass = successfulGroups.map((items) => items[0]);
  const overflow = successfulGroups.flatMap((items) => items.slice(1));
  const ordered = [...sortStories(firstPass), ...sortStories(overflow)];

  return dedupeStories(ordered).slice(0, MAX_ITEMS_TOTAL);
}

export async function handleLiveFeedRequest(request) {
  if (request.method === "OPTIONS") {
    return json({}, 200);
  }

  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  if (!forceRefresh && cacheState.payload && cacheState.expiresAt > Date.now()) {
    return json(cacheState.payload, 200);
  }

  try {
    const items = await collectLiveStories({
      forceRefresh,
      reloadRegistry: forceRefresh
    });
    const payload = {
      refreshedAt: new Date().toISOString(),
      items
    };

    cacheState.payload = payload;
    cacheState.expiresAt = Date.now() + CACHE_TTL_MS;

    return json(payload, 200);
  } catch (error) {
    return json(
      {
        error: "live_feed_generation_failed",
        detail: error.message,
        refreshedAt: new Date().toISOString(),
        items: []
      },
      500
    );
  }
}
