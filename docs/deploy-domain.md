# Domain Deployment

This app can run on a domain without starting the local planner server.

## Runtime Shape

- Vercel serves the Vite build from `dist`.
- Vercel Functions serve:
  - `POST /api/login`
  - `GET /api/plans`
  - `PUT /api/plans`
- Upstash Redis stores the shared large-plan library.

## Required Environment Variables

Set these in Vercel for production and preview:

```text
PLANNER_USERNAME=your-login-id
PLANNER_PASSWORD=your-login-password
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
PLANNER_REDIS_KEY=desktop-planner:large-plans
```

Do not set `VITE_PLANNER_API_URL` on Vercel. The browser should use the current domain origin for `/api`.

## Deploy

```powershell
npm test
npm run build
vercel --prod
```

After deployment, connect a custom domain in the Vercel project settings.
