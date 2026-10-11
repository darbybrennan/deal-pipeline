# CLAUDE.md

@AGENTS.md

## What this repo actually is now

A CRE acquisitions deal pipeline built from the course PM starter. Columns are deal stages
(Sourcing, Underwriting, LOI, Due Diligence, Closed); each card is a deal with property type,
market, SF, price and cap rate. The AI chat acts as an acquisitions analyst.

## Layout

- `backend/app/` - FastAPI. `routes.py` (HTTP), `auth.py` (sessions), `board.py` (load/save),
  `ai.py` (OpenRouter structured output), `db.py` (SQLite schema), `seed.py` (demo deals)
- `frontend/src/` - Next.js static export. `components/` UI, `lib/` pure logic + API client
- `docs/` - PLAN.md, DATABASE.md, code_review.md

## Commands

- Backend tests: `cd backend && uv run pytest`
- Frontend unit tests: `cd frontend && npm test`
- Lint: `cd frontend && npx eslint src`
- E2E (needs app on :8000): `cd frontend && npm run test:e2e`
- Run without Docker: `cd frontend && npm run build`, then `cd backend && PM_STATIC_DIR=../frontend/out uv run uvicorn app.main:app --port 8000`

## Facts to not re-derive

- `.env` is gitignored and has never been committed. Do not report it as a leaked secret.
- Live AI tests are skipped unless `OPENROUTER_API_KEY` is set; that is expected.
- Commit after every working step.
