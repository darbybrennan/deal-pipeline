# Project Plan

Status: Parts 1-10 complete, plus the Week 1 extension (CRE deal pipeline). Approved by user at Part 1 and Part 5.

## How to run and test (read this first)

- Start: `scripts/start-mac.sh` (or `start-linux.sh`, `start-pc.ps1`). Builds the image and runs container `pm-app` on http://localhost:8000.
- Stop: `scripts/stop-mac.sh` (or `stop-linux.sh`, `stop-pc.ps1`).
- Backend tests: `cd backend && uv run pytest` (live OpenRouter tests run only when `OPENROUTER_API_KEY` is set).
- Frontend unit tests: `cd frontend && npm test`.
- E2E: start the container, then `cd frontend && npm run test:e2e`.
- Data persists in the Docker volume `pm-data` (SQLite file `/app/data/pm.db`).

## Decisions log

- Python deps managed by a uv project (`backend/pyproject.toml` + `uv.lock`), installed with `uv sync --frozen` in Docker.
- Multi-stage Dockerfile: Node stage builds the static export, Python stage runs FastAPI and serves `frontend/out`.
- Auth: hardcoded `user` / `password`; session token stored in the `sessions` table and sent as an httpOnly cookie.
- Board API is whole-board: `GET /api/board` and `PUT /api/board`. Simple, and avoids partial-sync bugs from drag and drop.
- AI test endpoint: `GET /api/chat/ping` (asks "2+2", no mocking). Chat endpoint: `POST /api/chat`. Model hardcoded to `openai/gpt-oss-120b`.
- Test coverage: aim for useful tests, not a percentage. Do not add tests just to hit a number.
- Backend split into modules (config, db, auth, board, ai, routes) rather than one `main.py`.

## Part 1: Plan

- [x] Enrich this document with substeps, tests and success criteria
- [x] Create `frontend/AGENTS.md` describing the existing code
- [x] User reviews and approves

Success: user approves plan.

## Part 2: Scaffolding

- [x] `backend/` uv project with FastAPI + uvicorn
- [x] `GET /api/health` returns `{"status": "ok"}`, `GET /api/hello` returns a greeting
- [x] Dockerfile and `.dockerignore`
- [x] Start/stop scripts for Mac, Linux, PC in `scripts/`
- [x] Tests: health and hello routes

Success: `scripts/start-mac.sh` brings up the container; `/api/health` and `/api/hello` respond.

## Part 3: Add in Frontend

- [x] `next.config.ts` uses `output: "export"`
- [x] Dockerfile builds the frontend and copies `out/` into the image
- [x] FastAPI serves static files at `/` (API routes take precedence)
- [x] Tests: backend serves `index.html` at `/`; frontend unit tests pass

Success: Kanban board visible at http://localhost:8000.

## Part 4: Fake sign-in

- [x] `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- [x] Login screen gates the board; logout button returns to login
- [x] Tests: good login, bad login, logout, protected routes return 401

Success: must sign in with `user` / `password` to see the board; logout works.

## Part 5: Database modeling

- [x] Schema proposed and documented in `docs/DATABASE.md` (JSON shape in `docs/schema.json`)
- [x] User sign-off

Success: user approves schema.

## Part 6: Backend board API

- [x] SQLite created on startup if missing; seed user and default board on first login
- [x] `GET /api/board` returns `BoardData`; `PUT /api/board` validates and saves
- [x] Tests: create db, read default board, save and re-read, validation errors, per-user isolation

Success: all backend tests pass; DB file created automatically.

## Part 7: Frontend + Backend

- [x] Board loads from API after login
- [x] Every change (move, rename, add, edit, delete) saves via `PUT /api/board`
- [x] Tests: unit tests with mocked fetch; manual check of persistence across logout/login

Success: changes survive logout, browser close and container restart.

## Part 8: AI connectivity

- [x] `backend/app/ai.py` calls OpenRouter via the OpenAI SDK
- [x] `GET /api/chat/ping` asks "What is 2+2?"
- [x] Live test (no mocking) confirms the answer contains 4

Success: live test passes with a real key.

## Part 9: AI with board context

- [x] `POST /api/chat` sends system prompt + board JSON + history + question
- [x] Structured output: `{ reply: string, board: BoardData | null }`
- [x] Backend validates any returned board and saves it
- [x] Tests: mocked unit tests for update/no-update/invalid; live test that asks to move a card

Success: asking the AI to move a card changes the stored board.

## Part 10: Chat sidebar

- [x] Sidebar widget with message history, thinking indicator, error state
- [x] Board refreshes automatically when the AI returns an update
- [x] Tests: unit tests with mocked chat API

Success: "Move X to Closed" in chat moves the card on screen and it persists.

## Extension (Week 1 assignment): CRE deal pipeline

- [x] Default board becomes an acquisitions pipeline: Sourcing, Underwriting, LOI, Due Diligence, Closed
- [x] Cards carry optional deal fields: property type, market, size (SF), price, cap rate
- [x] Pipeline metrics strip: active deals, active pipeline value, average cap rate, closed volume
- [x] Card editing (title, details, deal fields)
- [x] AI system prompt acts as a CRE acquisitions analyst and can read and update deal fields
- [x] Tests for metrics and deal field validation

Success: board opens as a deal pipeline; AI can answer pipeline questions ("what's my average cap rate in underwriting?") and add or move deals.
