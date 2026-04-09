# AI Insight

- Chinese guide: [README.zh-CN.md](./README.zh-CN.md)

## What is already wired

- Static bilingual site pages
- Same-origin live feed endpoint at `/api/news`
- Same-origin AI summary endpoint at `/api/summarize`
- Same-origin account + sync endpoint at `/api/account`
- Seeded headline layer plus a tool / OSS radar layer
- Local Node server entry at `server.mjs`
- Vercel-style serverless handlers in `api/`

## Fastest way to run

1. Install Node.js 18 or newer
2. Open this folder
3. Run `node server.mjs`
4. Open `http://127.0.0.1:3000`

The site now includes a free local summary mode by default, so AI summaries work even with no external API key.

If you want upgraded model-generated summaries, set `OPENAI_API_KEY` and/or `DEEPSEEK_API_KEY` before starting.

If you also want the tool / GitHub radar layer to stay healthy at higher refresh volumes, set `GITHUB_TOKEN` too.
If you do not set `GITHUB_TOKEN`, the backend now falls back to public GitHub repository pages when the GitHub API rate-limits anonymous traffic. The API path is still better and fresher, but the radar will not go completely blank.

If you want to control the live source mix without touching JS, edit `data/live-source-registry.json`. The backend will load it automatically, and `GET /api/news?refresh=1` will force a reload.

If you want account sync for saves, Radar themes, and daily briefing settings, keep `app-config.js` on the same origin.

- Local fallback: customize `ACCOUNT_STORE_FILE`, `ACCOUNT_SESSION_TTL_HOURS`, and `ACCOUNT_MAX_SESSIONS`
- Durable cloud sync: set `SUPABASE_URL` and either `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, then run [supabase/schema.sql](./supabase/schema.sql)

## What the front-end does now

When the site is served over `http://` or `https://`, [app-config.js](./app-config.js) automatically points to:

- `/api/news`
- `/api/summarize`
- `/api/account`

If the site is opened directly as local files, the app falls back to the seeded content and disables live endpoints.

The seeded front-end data now includes:

- Editorial deep briefs
- Source-backed live headlines
- A compact launches / GitHub / AI tools radar lane

The backend live ingest example now pulls from a wider mix of official and primary sources:

- OpenAI and Anthropic news
- Google blog AI-related posts
- Microsoft Research updates
- NVIDIA newsroom and developer AI infrastructure posts
- arXiv `cs.AI`, `cs.LG`, `cs.CL`, and `cs.CV`
- A wider GitHub radar for agents, workflow builders, SDKs, and evaluation tools

The runtime source list now lives in [data/live-source-registry.json](./data/live-source-registry.json), so you can add or remove feeds without editing the aggregator itself.

The site also now includes a lightweight account page at `account.html`. Once you sign in, the front-end will sync:

- Saved stories
- Saved professional sources
- Radar topics
- Language and reading mode
- Summary provider/model preference
- Daily briefing schedule settings

The `/api/account` service now supports two storage modes behind the same contract:

- File mode
  Default for local development and quick demos
- Supabase mode
  Recommended for production because it keeps account state durable across deployments

## Deploy options

- Local Node server: `server.mjs`
- Vercel-style deploy: `api/news.js`, `api/summarize.js`, and `api/account.js`
- Vercel deployment notes: [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)

### Quick public deploy

1. Push this folder to a Git repository.
2. Import the repo into Vercel.
3. Add environment variables only if you want paid model summaries or a stronger GitHub radar:
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY`
   - `GITHUB_TOKEN`
4. Deploy.

The site already uses same-origin endpoints in [app-config.js](./app-config.js), so once deployed it will automatically call:

- `/api/news`
- `/api/summarize`
- `/api/account`

If you skip all summary API keys, the deployed site still works because `Free local summary` is now the default provider.

For Vercel, the project now includes [vercel.json](./vercel.json) with API duration settings for the live feed, summary endpoint, and account route.

If you want durable account sync on Vercel, set:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

Keep the Supabase server key server-side only. It should never be exposed in the browser.

Then run [supabase/schema.sql](./supabase/schema.sql) in the Supabase SQL editor. If you skip those variables, the account service falls back to file mode, which is still fine for local use and short demos.
If the Supabase tables are not created yet, the current backend will also fall back to file mode temporarily so the site keeps working while you finish setup.

The live ingest, summary, and account logic live in:

- [backend-examples/live-ingest.example.js](./backend-examples/live-ingest.example.js)
- [backend-examples/summary-proxy.example.js](./backend-examples/summary-proxy.example.js)
- [backend-examples/account-service.example.js](./backend-examples/account-service.example.js)

The editable live source registry lives in:

- [data/live-source-registry.json](./data/live-source-registry.json)
