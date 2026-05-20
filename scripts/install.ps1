# Thin wrapper — core logic lives in scripts/install.ts
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
npx ts-node scripts/install.ts @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
