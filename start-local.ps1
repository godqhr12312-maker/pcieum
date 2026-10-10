$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$siteNode = (Get-Command node -ErrorAction Stop).Source
$siteNpm = Join-Path (Split-Path -Parent $siteNode) 'node_modules/npm/bin/npm-cli.js'
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/vinext'))) {
    Write-Host '먼저 README 안내에 따라 패키지를 설치해 주세요.'
    exit 1
}
Write-Host '피씨이음 로컬 사이트를 시작합니다. 종료하려면 Ctrl+C를 누르세요.'
& $siteNode $siteNpm run dev -- --hostname 127.0.0.1
