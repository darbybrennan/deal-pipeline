# Scripts

- `start-mac.sh` / `start-linux.sh` / `start-pc.ps1` - build the `pm-app` image, (re)start the container on port 8000 with `.env` and the `pm-data` volume, wait for `/api/health`.
- `stop-mac.sh` / `stop-linux.sh` / `stop-pc.ps1` - remove the container. Data persists in the `pm-data` volume.
- Reset all data: `docker volume rm pm-data` (after stopping).
