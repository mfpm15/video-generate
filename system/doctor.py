"""Noninteractive local prerequisite check for Claude before production. Never prints secret values."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--engine', choices=['opuscar', 'anime', 'anime-local'], default='opuscar')
    ap.add_argument('--silent', action='store_true', help='No narration: do not require online TTS/ASR packages')
    a = ap.parse_args()
    root = Path(__file__).resolve().parents[1]
    lib = Path(os.environ.get('LIB') or os.environ.get('LEMO_OPUSCAR_HOME') or Path.home() / 'lemo-opuscar')
    runtime = lib if a.engine == 'opuscar' else root / '.claude/skills/make-an-anime/scripts'
    checks = []

    def check(name, ok, detail, required=True):
        checks.append({'name': name, 'ok': bool(ok), 'required': required, 'detail': detail})

    def output(command, cwd=None):
        try:
            p = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=30)
            return p.returncode == 0, p.stdout + p.stderr
        except (OSError, subprocess.TimeoutExpired) as e:
            return False, str(e)

    for name, cmd, minimum in [('Node', ['node', '--version'], (22, 12) if a.engine != 'opuscar' else (20, 0)),
                               ('FFmpeg', ['ffmpeg', '-version'], (7, 0))]:
        ok, text = output(cmd)
        v = re.search(r'(?:version\s+n?|v)(\d+)\.(\d+)', text)
        check(name, ok and v and tuple(map(int, v.groups())) >= minimum, text.splitlines()[0] if text else 'not found')
    for binary in (['ffprobe', 'git', 'sh', 'npm'] + (['ruby', 'bundle', 'magick'] if a.engine != 'opuscar' else [])):
        check(binary, shutil.which(binary), 'available' if shutil.which(binary) else 'missing')
    check('Python >= 3.11', sys.version_info >= (3, 11), platform.python_version())
    check('Workspace disk', shutil.disk_usage(root).free >= 3 * 2**30, f'{shutil.disk_usage(root).free / 2**30:.1f} GiB free')
    required_file = runtime / ('core/render/video.mjs' if a.engine == 'opuscar' else 'mv.rb')
    check('Engine runtime', required_file.is_file(), str(runtime))
    py = os.environ.get('VIDEO_PYTHON') or next((str(p) for p in [runtime/'.venv/bin/python', runtime/'.venv/Scripts/python.exe'] if p.is_file()), sys.executable)
    modules = ['numpy', 'PIL'] + ((['scipy', 'soundfile'] + ([] if a.silent else ['edge_tts', 'faster_whisper'])) if a.engine == 'opuscar' else [])
    ok, text = output([py, '-c', 'import ' + ', '.join(modules)])
    check('Python packages', ok, {'interpreter': py, 'modules': modules, 'error': text[-500:] if not ok else None})
    for package in (['playwright-core', 'three'] if a.engine == 'opuscar' else ['p5', 'puppeteer-core']):
        check('Node package ' + package, (runtime/'node_modules'/package/'package.json').is_file(), 'run the engine dependency setup if missing')
    browser = os.environ.get('PLAYWRIGHT_CHROME' if a.engine == 'opuscar' else 'CHROME_PATH')
    if not browser and a.engine == 'opuscar' and (runtime / 'node_modules/playwright-core').exists():
        ok, path = output(['node', '--input-type=module', '-e', "import {chromium} from 'playwright-core'; process.stdout.write(chromium.executablePath())"], cwd=runtime)
        browser = path.strip() if ok else None
    if not browser and a.engine != 'opuscar':
        browser = next((shutil.which(b) for b in ['google-chrome', 'chromium', 'chrome'] if shutil.which(b)), None)
        if not browser and Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome').is_file():
            browser = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    check('Browser executable', browser and Path(browser).is_file(), 'launch/render smoke is still required; file presence alone is not a render test')
    if a.engine == 'anime':
        check('Fal credential binding', bool(os.environ.get('FAL_AI_API_KEY')), 'presence only; paid generation and network not tested')
    if a.engine != 'opuscar':
        check('Swift VFX', platform.system() == 'Darwin' and shutil.which('swift'), 'optional; macOS only', required=False)
        ok, v = output(['ruby', '--version']); match = re.search(r'ruby (\d+)\.(\d+)', v)
        check('Ruby >= 3.2', ok and match and tuple(map(int, match.groups())) >= (3, 2), v.strip())
    success = all(c['ok'] for c in checks if c['required'])
    print(json.dumps({'engine': a.engine, 'platform': platform.platform(), 'status': 'PREREQUISITES_PRESENT' if success else 'BLOCKED',
                      'note': 'This checks the current executor, not a remote laptop. It does not verify media quality, model access or browser launch.', 'checks': checks}, indent=2))
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())
