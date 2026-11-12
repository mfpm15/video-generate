param([string]$ProjectId)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$pythonLocal = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path $pythonLocal)) { throw 'Jalankan Setup-FreeLocal.ps1 dahulu.' }
if ($ProjectId) { & $pythonLocal -m backlot open $ProjectId }
else { & $pythonLocal -m backlot open }
if ($LASTEXITCODE -ne 0) { throw 'Backlot gagal dibuka. Coba .venv\Scripts\python.exe -m backlot serve --port 4750 untuk melihat error.' }
