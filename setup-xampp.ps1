# MOUBARIK Parking - Copie l'API vers XAMPP pour activer les réservations
# Exécutez en tant qu'administrateur si nécessaire

$xamppPath = "C:\xampp\htdocs"
$targetFolder = "parking-intelligent"
$sourceApi = Join-Path $PSScriptRoot "api"
$targetApi = Join-Path (Join-Path $xamppPath $targetFolder) "api"

if (-not (Test-Path $xamppPath)) {
    Write-Host "XAMPP non trouvé dans $xamppPath" -ForegroundColor Red
    Write-Host "Modifiez le chemin dans ce script si XAMPP est ailleurs." -ForegroundColor Yellow
    exit 1
}

$targetDir = Join-Path $xamppPath $targetFolder
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
Write-Host "Démarrez Apache et MySQL dans le panneau XAMPP." -ForegroundColor Yellow
