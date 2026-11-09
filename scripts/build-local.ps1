[CmdletBinding()]
param(
  [string]$ParTrivPath = '',
  [string]$PASfhPath = '',
  [string]$OutputPath = '',
  [string]$ZipPath = ''
)

$ErrorActionPreference = 'Stop'
$flyHighRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ParTrivPath = if ([string]::IsNullOrWhiteSpace($ParTrivPath)) { Join-Path $flyHighRoot '..\ParTriv' } else { $ParTrivPath }
$PASfhPath = if ([string]::IsNullOrWhiteSpace($PASfhPath)) { Join-Path $flyHighRoot '..\PASfh' } else { $PASfhPath }
$OutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) { Join-Path $flyHighRoot 'dist' } else { $OutputPath }
$parTrivRoot = (Resolve-Path $ParTrivPath).Path
$pasfhRoot = (Resolve-Path $PASfhPath).Path
$parTrivProject = Join-Path $parTrivRoot 'src\ParTriv.Web\ParTriv.Web.csproj'
$pasfhProject = Join-Path $pasfhRoot 'src\PASfh.Web\PASfh.Web.csproj'
$parTrivPublishPath = Join-Path $flyHighRoot '.local\partriv-publish'
$pasfhPublishPath = Join-Path $flyHighRoot '.local\pasfh-publish'
$stagingPath = Join-Path $flyHighRoot '.local\dist-staging'
$partyPath = Join-Path $stagingPath 'apps\party'
$pasfhPath = Join-Path $stagingPath 'apps\pasfh'

if (-not (Test-Path $parTrivProject)) { throw "No se encontró ParTriv.Web: $parTrivProject" }
if (-not (Test-Path $pasfhProject)) { throw "No se encontró PASfh.Web: $pasfhProject" }

Remove-Item -LiteralPath $parTrivPublishPath,$pasfhPublishPath -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $stagingPath -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $parTrivPublishPath,$pasfhPublishPath,$partyPath,$pasfhPath -Force | Out-Null

try {
  Copy-Item -LiteralPath (Join-Path $flyHighRoot 'index.html') -Destination $stagingPath
  Copy-Item -LiteralPath (Join-Path $flyHighRoot 'assets') -Destination $stagingPath -Recurse
  Copy-Item -LiteralPath (Join-Path $flyHighRoot 'scripts') -Destination $stagingPath -Recurse

  foreach ($project in @($parTrivProject, $pasfhProject)) {
    dotnet clean $project --configuration Release --nologo
    if ($LASTEXITCODE -ne 0) { throw "dotnet clean falló: $project" }
    dotnet restore $project --nologo
    if ($LASTEXITCODE -ne 0) { throw "dotnet restore falló: $project" }
  }
  dotnet publish $parTrivProject --configuration Release --output $parTrivPublishPath --no-restore --nologo
  if ($LASTEXITCODE -ne 0) { throw 'dotnet publish ParTriv falló.' }
  dotnet publish $pasfhProject --configuration Release --output $pasfhPublishPath --no-restore --nologo
  if ($LASTEXITCODE -ne 0) { throw 'dotnet publish PASfh falló.' }

  $publishedPartyRoot = if (Test-Path (Join-Path $parTrivPublishPath 'wwwroot')) { Join-Path $parTrivPublishPath 'wwwroot' } else { $parTrivPublishPath }
  $publishedPasfhRoot = if (Test-Path (Join-Path $pasfhPublishPath 'wwwroot')) { Join-Path $pasfhPublishPath 'wwwroot' } else { $pasfhPublishPath }
  Copy-Item -Path (Join-Path $publishedPartyRoot '*') -Destination $partyPath -Recurse -Force
  Copy-Item -Path (Join-Path $publishedPasfhRoot '*') -Destination $pasfhPath -Recurse -Force

  $partyIndex = Join-Path $partyPath 'index.html'
  $partyText = Get-Content -LiteralPath $partyIndex -Raw
  $partyText = $partyText -replace '<base href="/"\s*/>', '<base href="/apps/party/" />'
  if ($partyText -notmatch '<base href="/apps/party/"\s*/>') { throw 'Base href inválido para Party.' }
  Set-Content -LiteralPath $partyIndex -Value $partyText -Encoding utf8
  $partyManifest = Join-Path $partyPath 'manifest.webmanifest'
  $partyManifestText = Get-Content -LiteralPath $partyManifest -Raw
  $partyManifestText = $partyManifestText -replace '"start_url"\s*:\s*"\."', '"start_url": "/apps/party/"'
  $partyManifestText = $partyManifestText -replace '"scope"\s*:\s*"\."', '"scope": "/apps/party/"'
  Set-Content -LiteralPath $partyManifest -Value $partyManifestText -Encoding utf8

  $pasfhIndex = Join-Path $pasfhPath 'index.html'
  $pasfhText = Get-Content -LiteralPath $pasfhIndex -Raw
  $pasfhText = $pasfhText -replace '<base href="\.\/"\s*/?>', '<base href="/apps/pasfh/" />'
  if ($pasfhText -notmatch '<base href="/apps/pasfh/"\s*/>') { throw 'Base href inválido para PASfh.' }
  Set-Content -LiteralPath $pasfhIndex -Value $pasfhText -Encoding utf8
  $pasfhManifest = Join-Path $pasfhPath 'manifest.webmanifest'
  $pasfhManifestText = Get-Content -LiteralPath $pasfhManifest -Raw
  $pasfhManifestText = $pasfhManifestText -replace '"start_url"\s*:\s*"\.\/?"', '"start_url": "/apps/pasfh/"'
  $pasfhManifestText = $pasfhManifestText -replace '"scope"\s*:\s*"\.\/?"', '"scope": "/apps/pasfh/"'
  Set-Content -LiteralPath $pasfhManifest -Value $pasfhManifestText -Encoding utf8

  foreach ($required in @('index.html','manifest.webmanifest','service-worker.js','service-worker-assets.js','game_items.json','_framework')) {
    if (-not (Test-Path (Join-Path $partyPath $required))) { throw "Falta el recurso Party: $required" }
  }
  foreach ($required in @('index.html','manifest.webmanifest','service-worker.js','service-worker-assets.js','_framework')) {
    if (-not (Test-Path (Join-Path $pasfhPath $required))) { throw "Falta el recurso PASfh: $required" }
  }
  foreach ($appPath in @($partyPath, $pasfhPath)) {
    $assets = Get-Content -LiteralPath (Join-Path $appPath 'service-worker-assets.js') -Raw
    if ($assets -match '"url"\s*:\s*"/') { throw "Ruta absoluta fuera del ámbito en: $appPath" }
    $worker = Get-Content -LiteralPath (Join-Path $appPath 'service-worker.js') -Raw
    if ($worker -match 'scope\s*=\s*["'']\/["'']|importScripts\(["'']/') { throw "Service worker fuera de ámbito: $appPath" }
  }

  if (-not [string]::IsNullOrWhiteSpace($ZipPath)) {
    $zipTarget = [IO.Path]::GetFullPath($ZipPath)
    $zipParent = Split-Path -Parent $zipTarget
    if ($zipParent) { New-Item -ItemType Directory -Path $zipParent -Force | Out-Null }
    Compress-Archive -Path (Join-Path $stagingPath '*') -DestinationPath $zipTarget -CompressionLevel Optimal -Force
  }

  Remove-Item -LiteralPath $OutputPath -Recurse -Force -ErrorAction SilentlyContinue
  Move-Item -LiteralPath $stagingPath -Destination $OutputPath
  Write-Output "Distribución local creada en: $OutputPath"
  Write-Output "ParTriv integrado en: $(Join-Path $OutputPath 'apps\party')"
  Write-Output "PASfh integrado en: $(Join-Path $OutputPath 'apps\pasfh')"
}
catch {
  Remove-Item -LiteralPath $parTrivPublishPath,$pasfhPublishPath,$stagingPath -Recurse -Force -ErrorAction SilentlyContinue
  throw
}
