import "../load-env.mjs";
import { handleAccountRequest } from "../backend-examples/account-service.example.js";

async function readBody(req) {
  if (typeof req.body === "string") {
    return req.body;
  }

  if (req.body && typeof req.body === "object") {
    return JSON.stringify(req.body);
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  return chunks.length ? Buffer.concat(chunks).toString("utf8") : "";
}

async function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  const url = new URL(req.url, `${protocol}://${host}`);
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);

  return new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body
  });
}

export default async function handler(req, res) {
  const response = await handleAccountRequest(await toWebRequest(req));
  const body = await response.text();

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(body);
}
