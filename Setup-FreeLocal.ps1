$ErrorActionPreference = 'Stop'
$env:HYPERFRAMES_NO_TELEMETRY='1'
Set-Location $PSScriptRoot
foreach ($tool in @('node','npm','ffmpeg','ffprobe')) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "Prasyarat belum tersedia: $tool. Minta Claude menyiapkan dependency lokal ini dahulu." }
}
$nv = [Version](& node -p 'process.versions.node')
$minimum = @{22=[Version]'22.23.4';24=[Version]'24.22.1';26=[Version]'26.12.1'}
if (-not $minimum.ContainsKey($nv.Major) -or $nv -lt $minimum[$nv.Major]) { throw "Node $nv belum sesuai engine upstream. Gunakan Node24.22.1+ pada major24, atau versi lain yang tercantum di README." }
if (-not (Test-Path '.venv\Scripts\python.exe')) {
  if (Get-Command py -ErrorAction SilentlyContinue) { & py -3 -m venv .venv }
  elseif (Get-Command python -ErrorAction SilentlyContinue) { & python -m venv .venv }
  else { throw 'Python3.10+ belum ditemukan.' }
  if ($LASTEXITCODE -ne 0) { throw 'Gagal membuat virtualenv.' }
}
$pythonLocal = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
& $pythonLocal -m pip install 'pip>=26.2.2'
if ($LASTEXITCODE -ne 0) { throw 'Instalasi pip gagal.' }
& $pythonLocal -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Instalasi dependency Python gagal.' }
& npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'Instalasi runtime lokal yang dipin gagal.' }
& npx --no-install hyperframes --version
if ($LASTEXITCODE -ne 0) { throw 'Pemeriksaan CLI HyperFrames gagal.' }
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
Write-Host 'Dependency dasar selesai. Tidak ada model GPU/API berbayar yang dikonfigurasi. Jalankan Start-FreeClaude.ps1 untuk preflight dan uji render lokal; instalasi ini sendiri belum membuktikan kualitas/render berhasil.'
