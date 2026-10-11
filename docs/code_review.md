# Code Review - Deal Pipeline

Date: 2026-10-11. Scope: entire repo (backend, frontend, Docker, scripts, devcontainer).
Baseline: 24 backend tests pass (3 live-AI tests skipped without a key), 22 frontend tests pass, ESLint clean.

## Executive summary

| Priority | Count | Status |
|---|---|---|
| Critical | 0 | - |
| High | 3 | Fixed |
| Medium | 5 | Fixed |
| Low | 4 | 2 fixed, 2 deferred |

The code is in good shape structurally: the backend is already split into modules
(routes, auth, board, ai, db), so the "monolithic main.py" problem from the course demo does not apply here.
The real gaps are authentication, AI safety on board edits, and container hardening.

## Checked and ruled out (not issues)

These were investigated because they look like problems at a glance. Each was verified against the code.

- **`.env` secret leak** - `.env` is listed in `.gitignore` (line 130) and is not tracked (`git ls-files` shows only `.env.example`). Not a leak.
- **SQL injection in `board._write`** - the f-string only interpolates column names from the constant `CARD_FIELDS` list. All user values go through `?` placeholders. Safe.

## High

1. **Hardcoded credentials** (`auth.check_credentials`, `config.DEMO_*`). Anyone can sign in as `user` / `password`, and there is no way to create real accounts.
   Action: add sign-up with salted password hashes (stdlib `hashlib.scrypt`), keep the demo user seeded for the class.
2. **Sessions never expire** (`sessions` table has no expiry check). A stolen cookie works forever.
   Action: reject sessions older than 7 days; set cookie `max_age` to match.
3. **AI can silently delete deals** (`routes.chat` -> `board.save_board`). The AI returns the whole board; if it drops a card, that deal is deleted with no warning.
   Action: when an AI update removes deals, say so in the reply (list the removed deal names).

## Medium

4. **Container runs as root and has no health check** (`Dockerfile`). Action: add a non-root user and a `HEALTHCHECK` against `/api/health`.
   Note: the image build could not be run end-to-end in the review sandbox (its proxy blocks package downloads during `docker build`). Verify with `scripts/start-mac.sh` before relying on it. An existing `pm-data` volume created by the old root container may need `docker volume rm pm-data`.
5. **`uv:latest` base image is unpinned** (`Dockerfile`). Builds can change without warning. Action: pin a uv version.
6. **Internal error text returned to the browser** (`routes.chat`, `routes.chat_ping` put `str(e)` in the 502 detail). Action: log the exception server-side, return a generic message.
7. **Unbounded chat history** (`ChatRequest.history`). The client sends every prior message on every call, so cost and latency grow without limit. Action: cap history at the last 20 messages server-side.
8. **Leftover scaffolding** - `/api/hello` endpoint and its test, and the unused `initialData` PM sample board in `frontend/src/lib/kanban.ts`. Action: remove.

## Low

9. **Card actions are text buttons** ("Edit" / "Remove") that crowd narrow columns. Action: icon buttons with accessible labels. (Fixed in UI pass.)
10. **Board does not use horizontal space well** - fixed 200px minimum columns leave dead space on wide screens and the header is tall. (Fixed in UI pass.)
11. **No retry when a save fails** - the UI shows "Save failed" but the next edit is the only retry. Deferred: low impact for a local app.
12. **No rate limiting on login.** Deferred: local/demo app; revisit before any public deploy.

## Remediation log

- High 1: sign-up added (`POST /api/auth/register`); passwords stored as salted scrypt hashes; demo user kept, now hashed. Old databases get the new column automatically.
- High 2: sessions expire after 7 days (server check + cookie `max_age`).
- High 3: AI replies now list any deals the update removed.
- Medium 4-5: non-root user, `HEALTHCHECK`, uv pinned to 0.11.
- Medium 6: 502s return a generic message; details go to the server log.
- Medium 7: history capped at 20 messages server-side.
- Medium 8: `/api/hello` and unused `initialData` removed.
- Tests: backend 24 -> 30 passing (new: hashing, register, validation, expiry, legacy DB migration, removed-deal notice, history cap, no error leak). Frontend 22 passing. ESLint and `tsc` clean.
