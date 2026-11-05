[CmdletBinding()]
param(
  [string]$ParTrivPath = '',
  [string]$OutputPath = '',
  [string]$ZipPath = ''
)

$ErrorActionPreference = 'Stop'
$flyHighRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ParTrivPath = if ([string]::IsNullOrWhiteSpace($ParTrivPath)) { Join-Path $flyHighRoot '..\ParTriv' } else { $ParTrivPath }
$OutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) { Join-Path $flyHighRoot 'dist' } else { $OutputPath }
$parTrivRoot = (Resolve-Path $ParTrivPath).Path
$project = Join-Path $parTrivRoot 'src\ParTriv.Web\ParTriv.Web.csproj'
$publishPath = Join-Path $flyHighRoot '.local\partriv-publish'
$stagingPath = Join-Path $flyHighRoot '.local\dist-staging'
$partyPath = Join-Path $stagingPath 'apps\party'

if (-not (Test-Path $project)) { throw "No se encontró ParTriv.Web: $project" }

Remove-Item -LiteralPath $publishPath -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $stagingPath -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $publishPath,$partyPath -Force | Out-Null

Copy-Item -LiteralPath (Join-Path $flyHighRoot 'index.html') -Destination $stagingPath
Copy-Item -LiteralPath (Join-Path $flyHighRoot 'assets') -Destination $stagingPath -Recurse
Copy-Item -LiteralPath (Join-Path $flyHighRoot 'scripts') -Destination $stagingPath -Recurse

dotnet clean $project --configuration Release --nologo
if ($LASTEXITCODE -ne 0) { throw "dotnet clean falló con código $LASTEXITCODE." }
dotnet restore $project --nologo
if ($LASTEXITCODE -ne 0) { throw "dotnet restore falló con código $LASTEXITCODE." }
dotnet publish $project --configuration Release --output $publishPath --no-restore --nologo
if ($LASTEXITCODE -ne 0) { throw "dotnet publish falló con código $LASTEXITCODE." }
$publishedWebRoot = if (Test-Path (Join-Path $publishPath 'wwwroot')) { Join-Path $publishPath 'wwwroot' } else { $publishPath }

Copy-Item -Path (Join-Path $publishedWebRoot '*') -Destination $partyPath -Recurse -Force

$partyIndex = Join-Path $partyPath 'index.html'
$indexText = Get-Content -LiteralPath $partyIndex -Raw
$indexText = $indexText -replace '<base href="/"\s*/>', '<base href="/apps/party/" />'
if ($indexText -notmatch '<base href="/apps/party/"\s*/>') { throw 'La publicación no contiene el base href esperado de Party.' }
Set-Content -LiteralPath $partyIndex -Value $indexText -Encoding utf8

$manifestPath = Join-Path $partyPath 'manifest.webmanifest'
$manifestText = Get-Content -LiteralPath $manifestPath -Raw
$manifestText = $manifestText -replace '"start_url"\s*:\s*"\."', '"start_url": "/apps/party/"'
$manifestText = $manifestText -replace '"scope"\s*:\s*"\."', '"scope": "/apps/party/"'
Set-Content -LiteralPath $manifestPath -Value $manifestText -Encoding utf8

$assetManifest = Get-Content -LiteralPath (Join-Path $partyPath 'service-worker-assets.js') -Raw
if ($assetManifest -match '"url"\s*:\s*"/') { throw 'El manifiesto del service worker contiene una ruta absoluta fuera de /apps/party/.' }
$serviceWorker = Get-Content -LiteralPath (Join-Path $partyPath 'service-worker.js') -Raw
if ($serviceWorker.Contains('scope = "/"')) { throw 'El service worker integrado no puede controlar la raíz de FlyHigh.' }

foreach ($required in @('index.html','manifest.webmanifest','service-worker.js','service-worker-assets.js','game_items.json','_framework')) {
  if (-not (Test-Path (Join-Path $partyPath $required))) { throw "Falta el recurso Party: $required" }
}

if (-not [string]::IsNullOrWhiteSpace($ZipPath)) {
  $zipTarget = [IO.Path]::GetFullPath($ZipPath)
  $zipParent = Split-Path -Parent $zipTarget
  if ($zipParent) { New-Item -ItemType Directory -Path $zipParent -Force | Out-Null }
  Compress-Archive -Path (Join-Path $stagingPath '*') -DestinationPath $zipTarget -CompressionLevel Optimal -Force
  Write-Output "ZIP offline avanzado creado en: $zipTarget"
}

Remove-Item -LiteralPath $OutputPath -Recurse -Force -ErrorAction SilentlyContinue
Move-Item -LiteralPath $stagingPath -Destination $OutputPath
Write-Output "Distribucion local creada en: $OutputPath"
Write-Output "ParTriv integrado en: $(Join-Path $OutputPath 'apps\party')"
