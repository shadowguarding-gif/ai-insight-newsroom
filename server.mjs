import "./load-env.mjs";
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleLiveFeedRequest } from "./backend-examples/live-ingest.example.js";
import { handleSummaryRequest } from "./backend-examples/summary-proxy.example.js";
import { handleAccountRequest } from "./backend-examples/account-service.example.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function toWebRequest(req, fullUrl) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const bodyBuffer = chunks.length ? Buffer.concat(chunks) : null;

  return new Request(fullUrl, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : bodyBuffer
  });
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
}

function resolveStaticPath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const decoded = decodeURIComponent(cleanPath);
  const normalized = path
    .normalize(decoded)
    .replace(/^([/\\])+/, "")
    .replace(/^(\.\.[\\/])+/, "");
  return path.join(__dirname, normalized);
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
    res.end(buffer);
  } catch (error) {
    res.statusCode = error.code === "ENOENT" ? 404 : 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(error.code === "ENOENT" ? "Not found" : "Static file error");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);

  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (url.pathname === "/api/news") {
    const request = await toWebRequest(req, url.toString());
    const response = await handleLiveFeedRequest(request);
    await sendWebResponse(res, response);
    return;
  }

  if (url.pathname === "/api/summarize") {
    const request = await toWebRequest(req, url.toString());
    const response = await handleSummaryRequest(request);
    await sendWebResponse(res, response);
    return;
  }

  if (url.pathname === "/api/account") {
    const request = await toWebRequest(req, url.toString());
    const response = await handleAccountRequest(request);
    await sendWebResponse(res, response);
    return;
  }

  await serveStatic(req, res, url.pathname);
});

server.listen(port, host, () => {
  console.log(`AI Insight server running at http://${host}:${port}`);
});
