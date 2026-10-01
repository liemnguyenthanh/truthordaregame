# Base44 Dev Environment

## Stack
- Next.js 16 (App Router) + TypeScript + React 19. Node.js 22+.
- Vietnamese "Truth or Dare" game (`Thật hay Thách`). Default locale `/vi`.
- Content is bundled JSON in `public/vi/` (categories, packs, questions). Supabase is optional — when `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are absent, the app falls back to bundled content and payment/AI/admin endpoints return 503 gracefully.

## Running
```sh
docker compose -f docker-compose.base44.yml up -d --build
```
- `setup` service runs `npm ci --ignore-scripts` (one-shot, exits).
- `web` service runs `next dev -H 0.0.0.0 -p 3000` with live reload (bind-mounted source).
- Health check: `curl http://localhost:3000/vi`.

## Secrets
No secrets are required to boot — free/trial content works immediately. To enable commerce, AI, or admin:
- Supabase project + run migrations in `supabase/migrations/`.
- SePay payment config, recovery encryption key, AI gateway key, admin password.
- See `.env.example` and `docs/payment-setup.md` / `docs/ai-setup.md`.
- All secrets are delivered via `/run/base44/app.env` (platform-managed, outside the repo).

## Key conventions
- `@/*` path alias maps to repo root (tsconfig paths).
- i18n: `vi` is default; `en` routes are rewritten to `vi` page files. See `lib/i18n.ts`.
- `lib/live-content.ts` is the content entry point (Supabase or bundled fallback).
- `lib/db/server.ts` `env()` throws `HttpError(503)` for missing config — never crashes boot.
- Service worker only registered in production build; `public/sw.js` is pre-built and committed.
- Linting: `npm run format:check` / `npm run typecheck`. Tests: `npm test` (tsx --test). E2E: `npm run test:e2e` (Playwright).
