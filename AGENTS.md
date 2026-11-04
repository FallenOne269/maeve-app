# AGENTS.md — Maeve App

## Overview
Vite + React 19 + TypeScript + Tailwind CSS frontend with Netlify-style serverless API functions.

## Architecture
- **Frontend**: Vite dev server on port 5173 (mapped to host 3000). React 19, Tailwind CSS.
- **API**: Functions in `api/` use the Web Request/Response API (Netlify Functions v2 format). In dev, `server.ts` serves them on port 8888. Vite proxies `/api/*` to the API service.
- **Production**: Deploys to Netlify (`netlify.toml`) or Vercel (`vercel.json`). Functions run as serverless.

## Dev Setup
```
docker compose -f docker-compose.base44.yml up -d
```
- `web` service: Vite dev server (port 5173 → host 3000)
- `api` service: `tsx watch server.ts` (port 8888)
- Vite proxy forwards `/api/*` to the API service.

## Secrets
- `ANTHROPIC_API_KEY` — required for `/api/chat` (Claude). From https://console.anthropic.com/settings/keys
- `MOLTBOOK_API_KEY` — required for `/api/moltbook/*` and `/api/heartbeat`. From Moltbook account settings.
- `CRON_SECRET` — optional bearer token for `/api/heartbeat` auth.

## Key Files
- `src/App.tsx` — main chat UI with streaming, file uploads, metrics display
- `api/chat.ts` — Anthropic Claude streaming chat endpoint
- `api/moltbook/_client.ts` — Moltbook API client (base: https://www.moltbook.com/api/v1)
- `server.ts` — dev-only API server (not for production)
- `vite.config.ts` — includes dev proxy for `/api` → API service

## Verify
- Frontend loads at http://localhost:3000
- API health at http://localhost:3000/api/heartbeat (needs MOLTBOOK_API_KEY)
- Chat works at http://localhost:3000 (needs ANTHROPIC_API_KEY)
