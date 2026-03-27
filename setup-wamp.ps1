# MOUBARIK Parking - Copie l'API vers WAMP pour activer les réservations
# Exécutez en tant qu'administrateur si nécessaire

$wampPath = "C:\wamp64\www"
$targetFolder = "parking-intelligent"
$sourceApi = Join-Path $PSScriptRoot "api"
$targetApi = Join-Path (Join-Path $wampPath $targetFolder) "api"

if (-not (Test-Path $wampPath)) {
    Write-Host "WAMP non trouvé dans $wampPath" -ForegroundColor Red
    Write-Host "Modifiez le chemin dans ce script si WAMP est ailleurs." -ForegroundColor Yellow
    exit 1
}

$targetDir = Join-Path $wampPath $targetFolder
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}
if (-not (Test-Path $targetApi)) {
    New-Item -ItemType Directory -Path $targetApi -Force | Out-Null
}

Copy-Item -Path "$sourceApi\*" -Destination $targetApi -Recurse -Force
Write-Host "API copiée vers $targetApi" -ForegroundColor Green
Write-Host "URL API: http://localhost/$targetFolder/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Créez un fichier .env avec:" -ForegroundColor Yellow
Write-Host "VITE_API_URL=http://localhost/$targetFolder/api" -ForegroundColor White
