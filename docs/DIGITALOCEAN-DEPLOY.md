# DigitalOcean App Platform deploy (LON1)

## Why the first deploy failed

DigitalOcean ran MarginOS as a **Web Service** with **no start command**.  
Vite produces static files in `dist/` — there is no long-running Node process unless you add one.

Log lines:

- `when there is no default process a command is required`
- readiness probe `dial tcp …:8080: connection refused`

## Fix A — Static Site (recommended)

In App Platform → your app → **Settings** / recreate component:

| Setting | Value |
|---|---|
| Component type | **Static Site** (not Web Service) |
| Source | `BA64592/MarginOS` · branch `main` |
| Build command | `npm ci && npm run build` |
| Output directory | `dist` |
| Catch-all / SPA | `index.html` |

Or apply `.do/app.yaml` from this repo.

## Fix B — Keep Web Service

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Run / start command | `npm start` |
| HTTP port | `8080` (or leave as App Platform default `$PORT`) |

`npm start` runs `serve -s dist` on `0.0.0.0:$PORT` (default 8080).

## After changing settings

Redeploy. Health checks should pass once the static files are served (or `serve` is listening).

## Note on `/api/*`

Vercel serverless routes under `api/` are **not** wired on DigitalOcean Static Site. Soft launch with demo auth/checkout works without them; live Stripe/SES needs Functions or a separate service later.
