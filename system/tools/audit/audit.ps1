# audit.ps1 - read-only environment audit for Lemo-Opuscar on Windows.
# Run in PowerShell:  powershell -ExecutionPolicy Bypass -File .\audit.ps1
# Installs nothing, deletes nothing. Writes AUDIT-REPORT.md next to this script.
$ErrorActionPreference = 'SilentlyContinue'
$out = New-Object System.Collections.Generic.List[string]
function Add-Row($name, $status, $detail) { $out.Add("| $name | $status | $detail |") }
function Cmd($n) { $c = Get-Command $n -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $c.Source } else { $null } }
function Ver($exe, $args) { try { (& $exe @args 2>&1 | Select-Object -First 1) -as [string] } catch { 'n/a' } }

$out.Add("# Audit report - $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
$out.Add("")
$out.Add("| Item | Status | Detail |")
$out.Add("|---|---|---|")

# OS / hardware
$os = (Get-CimInstance Win32_OperatingSystem)
Add-Row 'Windows' 'INFO' "$($os.Caption) build $($os.BuildNumber)"
$ramGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
Add-Row 'RAM' ($(if ($ramGB -ge 16) {'VERIFIED'} elseif ($ramGB -ge 8) {'LIMITED'} else {'BLOCKED'})) "$ramGB GB total"
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
Add-Row 'CPU' 'INFO' "$($cpu.Name), $($cpu.NumberOfLogicalProcessors) logical cores"
$gpus = Get-CimInstance Win32_VideoController | ForEach-Object { "$($_.Name) (driver $($_.DriverVersion))" }
Add-Row 'GPU' 'INFO' ($gpus -join '; ')
if (Cmd 'nvidia-smi') { Add-Row 'nvidia-smi' 'VERIFIED' (Ver 'nvidia-smi' @('--query-gpu=name,memory.total','--format=csv,noheader')) }
$drive = Get-PSDrive D
if ($drive) { $freeGB = [math]::Round($drive.Free / 1GB, 1); Add-Row 'Disk D:' ($(if ($freeGB -ge 20) {'VERIFIED'} else {'LIMITED'})) "$freeGB GB free" }

# Core tools
$ff = Cmd 'ffmpeg'
if ($ff) {
  $v = Ver 'ffmpeg' @('-version')
  $m = [regex]::Match($v, 'version\s+(?:n)?(\d+)\.')
  $major = if ($m.Success) { [int]$m.Groups[1].Value } else { 0 }
  $isGit = $v -match 'git-|N-\d+'
  $st = if ($major -ge 7 -or $isGit) { 'VERIFIED' } else { 'LIMITED' }
  Add-Row 'ffmpeg' $st "$v  [need 7+; 6.x breaks mux.sh loudnorm check]  ($ff)"
  $filters = (& ffmpeg -hide_banner -filters 2>&1) -join "`n"
  Add-Row 'ffmpeg loudnorm' ($(if ($filters -match 'loudnorm') {'VERIFIED'} else {'BLOCKED'})) 'filter present?'
  $enc = (& ffmpeg -hide_banner -encoders 2>&1) -join "`n"
  Add-Row 'ffmpeg libx264/aac' ($(if (($enc -match 'libx264') -and ($enc -match ' aac ')) {'VERIFIED'} else {'BLOCKED'})) 'H.264 + AAC encoders'
  $hw = @(); foreach ($e in 'h264_nvenc','h264_qsv','h264_amf') { if ($enc -match $e) { $hw += $e } }
  Add-Row 'ffmpeg HW encoders' 'INFO' ($(if ($hw) { $hw -join ', ' } else { 'none' }))
} else { Add-Row 'ffmpeg' 'BLOCKED' 'not on PATH' }
if (Cmd 'ffprobe') { Add-Row 'ffprobe' 'VERIFIED' (Cmd 'ffprobe') } else { Add-Row 'ffprobe' 'BLOCKED' 'not on PATH' }

$node = Cmd 'node'
if ($node) { $nv = Ver 'node' @('-v'); $nm = [int](($nv -replace 'v','') -split '\.')[0]; Add-Row 'Node.js' ($(if ($nm -ge 20) {'VERIFIED'} else {'LIMITED'})) "$nv [need 20+]" } else { Add-Row 'Node.js' 'BLOCKED' 'not on PATH' }
if (Cmd 'npm') { Add-Row 'npm' 'VERIFIED' (Ver 'npm' @('-v')) }

$py = Cmd 'python'; if (-not $py) { $py = Cmd 'py' }
if ($py) { Add-Row 'Python' 'INFO' "$(Ver $py @('--version')) [need 3.11+; kokoro-onnx needs 3.11-3.13]" } else { Add-Row 'Python' 'LIMITED' 'not found (uv can supply one)' }
if (Cmd 'uv') { Add-Row 'uv' 'VERIFIED' (Ver 'uv' @('--version')) } else { Add-Row 'uv' 'NOT TESTED' 'not found (optional if Python 3.11+ exists)' }

# Git Bash (setup.sh and build.sh are POSIX sh)
$gb = @('C:\Program Files\Git\bin\bash.exe','C:\Program Files\Git\usr\bin\bash.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($gb) { Add-Row 'Git Bash' 'VERIFIED' $gb } else { Add-Row 'Git Bash' 'BLOCKED' 'Git for Windows not found' }
if (Cmd 'git') { Add-Row 'git' 'VERIFIED' (Ver 'git' @('--version')) }

# Claude Code + Opuscar plugin
if (Cmd 'claude') {
  Add-Row 'Claude Code' 'VERIFIED' (Ver 'claude' @('--version'))
  $pl = (& claude plugin list 2>&1) -join ' '
  Add-Row 'lemo-opuscar plugin' ($(if ($pl -match 'lemo-opuscar') {'VERIFIED'} else {'NOT TESTED'})) ($(if ($pl -match 'lemo-opuscar') {'installed'} else {'not installed'}))
} else { Add-Row 'Claude Code' 'BLOCKED' 'claude not on PATH' }
$libHome = Join-Path $HOME 'lemo-opuscar'
Add-Row 'Opuscar library (~\lemo-opuscar)' ($(if (Test-Path $libHome) {'READY'} else {'NOT TESTED'})) ($(if (Test-Path $libHome) {$libHome} else {'not cloned yet'}))

# Browser for headless render
$browsers = @('C:\Program Files\Google\Chrome\Application\chrome.exe','C:\Program Files (x86)\Google\Chrome\Application\chrome.exe','C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') | Where-Object { Test-Path $_ }
Add-Row 'Browser (Chrome/Edge)' ($(if ($browsers) {'READY'} else {'LIMITED'})) ($(if ($browsers) {$browsers -join '; '} else {'none found; setup.sh deps installs headless Chromium'}))
$pw = Join-Path $env:LOCALAPPDATA 'ms-playwright'
Add-Row 'Playwright browsers' 'INFO' ($(if (Test-Path $pw) {(Get-ChildItem $pw -Directory | Select-Object -Expand Name) -join ', '} else {'none cached'}))

# TTS / ASR python packages (only if python exists)
if ($py) {
  foreach ($pkg in 'edge_tts','kokoro_onnx','faster_whisper','numpy','soundfile') {
    $r = & $py -c "import importlib.util,sys;print('yes' if importlib.util.find_spec('$pkg') else 'no')" 2>$null
    Add-Row "py: $pkg" 'INFO' "$r (global; Opuscar uses its own .venv)"
  }
}

# Fonts (existence only; real glyph QA happens at render time)
$fontDir = 'C:\Windows\Fonts'
foreach ($f in @(@('Arabic-capable (Segoe UI / Arial)','segoeui.ttf'),@('Arial','arial.ttf'),@('Noto Naskh Arabic','NotoNaskhArabic-Regular.ttf'),@('Noto Sans','NotoSans-Regular.ttf'))) {
  Add-Row "Font: $($f[0])" 'INFO' ($(if (Test-Path (Join-Path $fontDir $f[1])) {'present'} else {'absent'}))
}
Add-Row 'Fonts note' 'INFO' 'Opuscar self-hosts fonts per project (Google Fonts OFL); system fonts are not relied on.'

# Network reachability for downloads / TTS (HEAD only)
foreach ($u in 'https://github.com','https://registry.npmjs.org','https://pypi.org','https://huggingface.co','https://speech.platform.bing.com') {
  try { $r = Invoke-WebRequest -Uri $u -Method Head -TimeoutSec 8 -UseBasicParsing; Add-Row "Net: $u" 'VERIFIED' "HTTP $($r.StatusCode)" }
  catch { $code = $_.Exception.Response.StatusCode.value__; if ($code) { Add-Row "Net: $u" 'VERIFIED' "reachable (HTTP $code)" } else { Add-Row "Net: $u" 'BLOCKED' 'unreachable' } }
}

# RAEA (optional)
$raea = Cmd 'raea'; if (-not $raea) { $p = Join-Path $HOME '.raea'; if (Test-Path $p) { $raea = $p } }
Add-Row 'RAEA (optional)' ($(if ($raea) {'READY'} else {'NOT TESTED'})) ($(if ($raea) {$raea} else {'not installed - optional benchmark only'}))

$out.Add("")
$out.Add("Statuses: VERIFIED = checked just now | READY = present, not exercised | LIMITED = works with caveats | NOT TESTED | BLOCKED")
$dest = Join-Path $PSScriptRoot 'AUDIT-REPORT.md'
$out | Set-Content -Path $dest -Encoding UTF8
Write-Host "Done. Report: $dest"
