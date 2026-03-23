# Deploy To Vercel

## What you need

- A Git repository containing this project
- A Vercel account
- Optional environment variables if you want stronger live summaries, a steadier GitHub radar, or durable account sync:
  - `OPENAI_API_KEY`
  - `DEEPSEEK_API_KEY`
  - `GITHUB_TOKEN`
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

## Fastest path

1. Push the project to GitHub, GitLab, or Bitbucket.
2. In Vercel, click `Add New Project`.
3. Import the repository.
4. Keep the project root as this folder.
5. Deploy without changing the static output setup.

Or, if you already have a Vercel token locally, run:

```bash
npm run deploy:vercel
```

The site already uses same-origin endpoints in [app-config.js](./app-config.js), so after deployment it will automatically call:

- `/api/news`
- `/api/summarize`
- `/api/account`

## Recommended environment variables

You can deploy with zero paid API keys because `Free local summary` is now the default provider.

- `GITHUB_TOKEN`
  Recommended. Helps the tool and OSS radar avoid anonymous GitHub API rate limits.
- `OPENAI_API_KEY`
  Optional. Enables paid OpenAI summaries.
- `DEEPSEEK_API_KEY`
  Optional. Enables paid DeepSeek summaries.
- `SUPABASE_URL`
  Recommended if you want durable login, saves, Radar sync, and daily briefing settings on Vercel.
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
  Required together with `SUPABASE_URL` for the server-side account service.
  Keep this server-side only. Do not expose it in front-end code or browser config.

## Important note about account sync

The current account service now supports two modes:

- File mode
  Good for local development and quick demos
- Supabase mode
  Recommended for real deployments because it is durable across deployments and invocations

If you deploy to Vercel without Supabase variables, account sync falls back to file mode and should be treated as a demo layer there.

If you want durable accounts in production, create a Supabase project and run [supabase/schema.sql](./supabase/schema.sql) in the SQL editor before deploying.

## Post-deploy checks

After the project goes live, open these URLs:

- `/`
- `/api/news`
- `/detail.html`
- `/briefing.html`

Then verify:

- The home page loads.
- `/api/news` returns JSON.
- Detail pages can generate `Free local summary`.
- If you added `GITHUB_TOKEN`, the tools / OSS radar keeps showing GitHub-backed items.
- If you added Supabase variables, account registration and login survive redeploys.
