# Backend

FastAPI app managed with uv (`pyproject.toml`, `uv.lock`). Python 3.12.

## Modules (`app/`)

- `main.py` - app factory: runs `init_db` on startup, mounts API router, serves the static frontend at `/`.
- `config.py` - paths (`PM_DB_PATH`, `PM_STATIC_DIR`), demo credentials, OpenRouter settings. Loads `.env` from the project root.
- `db.py` - SQLite connection and schema (`CREATE TABLE IF NOT EXISTS`). See `docs/DATABASE.md`.
- `models.py` - Pydantic models: `BoardData` (validates every card sits in exactly one column), chat request/response.
- `auth.py` - hardcoded credential check, sessions table, `current_user` dependency (httpOnly cookie `pm_session`).
- `board.py` - load/save a user's board; seeds the default board on first access; columns are fixed.
- `seed.py` - default CRE pipeline board (fictional sample deals).
- `ai.py` - OpenRouter via OpenAI SDK: `ping()` and `chat()` with Structured Outputs (`AIResponse`).
- `routes.py` - all `/api` routes.

## API

| Method | Path | Notes |
|---|---|---|
| GET | /api/health | `{"status": "ok"}` |
| GET | /api/hello | hello world |
| POST | /api/auth/login | `{username, password}`, sets cookie |
| POST | /api/auth/logout | clears session |
| GET | /api/auth/me | current user or 401 |
| GET | /api/board | `BoardData` |
| PUT | /api/board | replace board (validated) |
| GET | /api/chat/ping | live "2+2" check |
| POST | /api/chat | `{message, history}` -> `{reply, board}` |

## Tests

`uv run pytest`. AI tests mock `ai.chat`; tests marked live run only when `OPENROUTER_API_KEY` is set.
