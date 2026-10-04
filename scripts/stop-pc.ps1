# Stop and remove the app container. Data stays in the pm-data volume.
docker rm -f pm-app 2>$null | Out-Null
Write-Host "Stopped pm-app"
