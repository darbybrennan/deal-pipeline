#!/usr/bin/env bash
# One-time setup when the Codespace is created: build the frontend, install the backend.
set -euo pipefail
cd "$(dirname "$0")/.."
(cd frontend && npm ci && npm run build)
(cd backend && uv sync)
