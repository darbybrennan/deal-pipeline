#!/usr/bin/env bash
# Build the image and start the app on http://localhost:8000
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env in the project root (needs OPENROUTER_API_KEY=...)"
  exit 1
fi

docker build -t pm-app .
docker rm -f pm-app >/dev/null 2>&1 || true
docker run -d --name pm-app -p 8000:8000 --env-file .env -v pm-data:/app/data pm-app >/dev/null

echo "Waiting for the server..."
for _ in $(seq 1 30); do
  if curl -sf http://localhost:8000/api/health >/dev/null; then
    echo "Running at http://localhost:8000 (sign in with user / password)"
    exit 0
  fi
  sleep 1
done
echo "Server did not start. Check logs with: docker logs pm-app"
exit 1
