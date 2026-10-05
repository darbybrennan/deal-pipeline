# Deal Pipeline

A CRE acquisitions pipeline (Kanban) with an AI analyst. Next.js frontend, FastAPI backend, SQLite, OpenRouter, all in one Docker container.

## Run in the browser (no installs)

On GitHub: Code -> Codespaces -> Create codespace on main. Add `OPENROUTER_API_KEY` under Settings -> Secrets -> Codespaces first. The app opens on port 8000 (sign in with `user` / `password`).

## Run locally with Docker

1. Install Docker Desktop and start it.
2. Copy `.env.example` to `.env` in the project root and paste your OpenRouter key after `OPENROUTER_API_KEY=`
3. Windows: double-click `Start Deal Pipeline.bat`. Mac/Linux: `scripts/start-mac.sh` / `scripts/start-linux.sh`
4. Open http://localhost:8000 and sign in with `user` / `password`.
5. Stop with `scripts/stop-mac.sh`. Data persists in the `pm-data` Docker volume.

## Test

- Backend: `cd backend && uv run pytest`
- Frontend unit: `cd frontend && npm install && npm test`
- E2E (app running): `cd frontend && npx playwright install chromium && npm run test:e2e`

See `docs/PLAN.md` for the build plan and decisions, `docs/DATABASE.md` for the schema.
