# Build the image and start the app on http://localhost:8000
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".env")) {
    Write-Host "Missing .env in the project root (needs OPENROUTER_API_KEY=...)"
    exit 1
}

docker build -t pm-app .
docker rm -f pm-app 2>$null | Out-Null
docker run -d --name pm-app -p 8000:8000 --env-file .env -v pm-data:/app/data pm-app | Out-Null

Write-Host "Waiting for the server..."
for ($i = 0; $i -lt 30; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing | Out-Null
        Write-Host "Running at http://localhost:8000 (sign in with user / password)"
        exit 0
    } catch {
        Start-Sleep -Seconds 1
    }
}
Write-Host "Server did not start. Check logs with: docker logs pm-app"
exit 1
