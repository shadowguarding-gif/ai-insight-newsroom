# Backend Examples

This folder now includes three backend-facing examples:

- `summary-proxy.example.js`
  Secure summary proxy for `Free local summary`, `OpenAI / ChatGPT`, and `DeepSeek`
- `live-ingest.example.js`
  Live news aggregator that normalizes official / primary feeds into the front-end contract
- `account-service.example.js`
  Lightweight account + cloud-state sync service for saves, Radar themes, and daily briefing settings

## Recommended deployment shape

1. Deploy `handleLiveFeedRequest` as `GET /api/news`
2. Deploy `handleSummaryRequest` as `POST /api/summarize`
3. Deploy `handleAccountRequest` as `GET/POST/PUT /api/account?action=...`
4. Point [app-config.js](../app-config.js) at those endpoints
5. Keep `autoRefreshMs` aligned with your cache TTL

For durable account sync, set `SUPABASE_URL` and either `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, then run [../supabase/schema.sql](../supabase/schema.sql).

## Expected `/api/news` response

```json
{
  "refreshedAt": "2026-03-22T10:00:00.000Z",
  "items": []
}
```

The front-end will automatically merge this response with local editorial briefs and embedded seed updates.

## Current source mix

- Official product / company feeds
  OpenAI RSS
  Anthropic newsroom
  Google blog RSS with AI filtering
  NVIDIA newsroom and developer blog AI filtering
- Primary research streams
  arXiv `cs.AI`
  arXiv `cs.LG`
  arXiv `cs.CL`
  arXiv `cs.CV`
  Microsoft Research feed with AI filtering
- Tool / OSS radar
  GitHub repo metadata + latest release for selected high-signal AI projects such as browser-use, OpenHands, AutoGen, LangGraph, OpenAI Agents SDK, Langflow, Flowise, Dify, crewAI, PydanticAI, and Opik

## Operational notes

- Cache live feed responses for 5 minutes or longer.
- Cache GitHub-backed tooling sources longer than company/newsroom feeds, for example 30 minutes.
- Prefer official / primary sources over scraped reposts.
- Keep a source registry file so you can add and remove origins without touching business logic.
- The example now reads `data/live-source-registry.json` by default, or `LIVE_SOURCE_REGISTRY_FILE` if you override it.
- Source definitions can now declare `maxItems`, `includePatterns`, `linkIncludePatterns`, and `excludePatterns` to keep broad feeds high-signal.
- Return `refreshedAt` every time. The front-end uses it to explain whether the page is truly live or in fallback mode.
- If a source becomes unstable, drop it rather than silently serving low-quality scraped content.
- If you ingest GitHub sources at scale, add `GITHUB_TOKEN` to avoid low unauthenticated rate limits.
- The example now falls back to public GitHub repository and release pages when anonymous GitHub API access is rate-limited. A real `GITHUB_TOKEN` is still recommended for freshness and stability.

## Production advice

- Run the aggregator on a schedule and pre-warm cache every 5 to 10 minutes.
- Log per-source failures so you can spot parser drift early.
- If you want Chinese live titles and decks, add a second server-side enrichment pass using your preferred summary / translation model.
- For paywalled journals, ingest only title, abstract/preview, and source URL. Do not try to mirror full text.
- Treat `account-service.example.js` as a prototype persistence layer. For production, replace the JSON file with a database or hosted auth backend.
- If you deploy serverless, do not rely on local file persistence for accounts; wire the same contract into a real datastore instead.
- On Vercel specifically, the example account store falls back to `/tmp`, which is fine for demos but not durable enough for real user accounts.
- This project now includes an optional Supabase-backed path for `/api/account`, so you can keep the same front-end contract while moving to durable storage.
