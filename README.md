# Deal Pipeline

A CRE acquisitions pipeline (Kanban) with an AI analyst. Next.js frontend, FastAPI backend, SQLite, OpenRouter, all in one Docker container.

## Run

1. Install Docker Desktop and start it.
2. Create `.env` in the project root: `OPENROUTER_API_KEY=sk-or-...`
3. `scripts/start-mac.sh` (Windows: `scripts\start-pc.ps1`, Linux: `scripts/start-linux.sh`)
4. Open http://localhost:8000 and sign in with `user` / `password`.
5. Stop with `scripts/stop-mac.sh`. Data persists in the `pm-data` Docker volume.

## Test

- Backend: `cd backend && uv run pytest`
- Frontend unit: `cd frontend && npm install && npm test`
- E2E (app running): `cd frontend && npx playwright install chromium && npm run test:e2e`

See `docs/PLAN.md` for the build plan and decisions, `docs/DATABASE.md` for the schema.
