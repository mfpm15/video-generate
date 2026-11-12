param([Parameter(ValueFromRemainingArguments=$true)][string[]]$ClaudeArgs)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Test-Path '.venv\Scripts\python.exe')) { throw 'Jalankan Setup-FreeLocal.ps1 dahulu.' }
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { throw 'Claude Code belum ditemukan. Gunakan instalasi/login Claude Code Pro milik Anda.' }
$names = @('ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','OPENROUTER_API_KEY')
Get-Content '.env.example' | ForEach-Object { if ($_ -match '^([A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|CREDENTIALS))=') { $names += $matches[1] } }
if (Test-Path '.env') {
  Get-Content '.env' | ForEach-Object {
    if ($_ -match '^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$') {
      $keyName=$matches[1]; $keyText=$matches[2].Trim().Trim('"').Trim("'")
      if ($names -contains $keyName -and $keyText -and -not $keyText.StartsWith('#')) { throw "Mode gratis: .env memiliki credential media/provider pada $keyName. Gunakan checkout khusus tanpa credential media. Nilai credential tidak ditampilkan." }
    }
  }
}
foreach ($keyName in ($names | Select-Object -Unique)) { Remove-Item "Env:$keyName" -ErrorAction SilentlyContinue }
foreach ($routeName in @('CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_USE_VERTEX','CLAUDE_CODE_USE_FOUNDRY','ANTHROPIC_BASE_URL')) { Remove-Item "Env:$routeName" -ErrorAction SilentlyContinue }
$env:HYPERFRAMES_NO_TELEMETRY='1'
$env:PRODUCER_MAX_WORKERS='2'
$env:VIDEO_GEN_LOCAL_ENABLED='false'
$env:HYPERFRAMES_CACHE_DIR=Join-Path $PSScriptRoot '.local-cache\hyperframes'
$env:HYPERFRAMES_CONFIG_DIR=Join-Path $PSScriptRoot '.local-cache\hyperframes-config'
if (Test-Path '.venv\Scripts') { $env:PATH=(Join-Path $PSScriptRoot '.venv\Scripts')+';'+$env:PATH }
Write-Host 'OpenMontage lokal, API budget $0. Pakai login Pro; jangan memilih cloud/media generator berbayar. Baca LOCAL_FREE_ONLY.md.'
& claude @ClaudeArgs
exit $LASTEXITCODE
