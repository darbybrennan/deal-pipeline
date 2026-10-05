#!/usr/bin/env bash
# Start the app on port 8000 (Codespaces opens it in a browser tab).
cd "$(dirname "$0")/../backend"
if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "Note: OPENROUTER_API_KEY is not set, so the AI chat won't work. Add it as a Codespaces secret."
fi
export PM_STATIC_DIR=../frontend/out PM_DB_PATH=./data/pm.db
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
