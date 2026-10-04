#!/usr/bin/env bash
# Stop and remove the app container. Data stays in the pm-data volume.
set -euo pipefail
docker rm -f pm-app >/dev/null 2>&1 && echo "Stopped pm-app" || echo "pm-app was not running"
