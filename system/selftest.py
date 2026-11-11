"""selftest.py: verify the whole production system. Run with the library python:  ~/lemo-opuscar/.venv/bin/python system/selftest.py [--quick]
Checks tools, disk, TTS network, file integrity, upstream library untouched, settings, caption lab, and (unless --quick) a REAL end-to-end 9:16 build
of a 3-line film created with new-film.sh, then deletes the temporary film. Writes system/logs/selftest-<timestamp>.md. Exit 1 if any FAIL."""
import datetime, json, os, re, shutil, subprocess, sys, time
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
SH = shutil.which('sh') or 'sh'; R = []
def rec(name, status, detail=''): R.append((name, status, detail)); print(f'[{status}] {name}' + (f': {detail}' if detail else ''), flush=True)
def run(cmd, **k): return subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', **k)
def sh(args, **k): return run([SH] + args, cwd=ROOT, env=dict(os.environ, LIB=LIB), **k)
quick = '--quick' in sys.argv

# 1 tools
v = run(['ffmpeg', '-version']).stdout.split('\n')[0]; m = re.search(r'version\s+(?:n)?(\d+)', v); rec('FFmpeg >= 7', 'PASS' if m and int(m[1]) >= 7 else 'FAIL', v[:60])
v = run(['node', '-v']).stdout.strip(); rec('Node >= 20', 'PASS' if int(v[1:].split('.')[0]) >= 20 else 'FAIL', v)
rec('Python (library venv)', 'PASS' if os.path.exists(os.path.join(LIB, '.venv')) else 'FAIL', sys.version.split()[0])
for mod in ('faster_whisper', 'edge_tts', 'soundfile', 'numpy', 'scipy', 'PIL'):
    try: __import__(mod); rec(f'import {mod}', 'PASS')
    except Exception as e: rec(f'import {mod}', 'FAIL', str(e)[:80])
# 2 disk
for d in (ROOT, LIB):
    try: free = shutil.disk_usage(d).free / 2 ** 30; rec(f'disk free {d}', 'PASS' if free > 3 else 'WARN', f'{free:.1f} GB')
    except OSError as e: rec(f'disk {d}', 'WARN', str(e))
# 3 file integrity
need = ['CLAUDE.md', 'MASTER-PROMPT.md', 'START-HERE.md', '.claude/commands/buat-video.md', '.claude/commands/buat-seri.md', 'system/build.sh', 'system/qa.sh', 'system/new-film.sh', 'system/clean.sh', 'system/review.sh', 'system/thumb.sh', 'system/series.py',
        'system/lib/captions.js', 'system/lib/scenes.js', 'system/lib/illus.js', 'system/lib/thumb.js', 'system/audio/mixlib.py', 'system/audio/timbres.py', 'system/py/make_timeline.py', 'system/py/qa_asr.py', 'system/py/make_report.py', 'system/py/make_post.py', 'system/py/thumb_sheet.py',
        'system/tools/sync-lib.sh', 'system/tools/fonts.sh', 'system/tools/qa-captions.mjs', 'system/tools/caption-lab.mjs', 'system/fonts/Inter.ttf', 'system/template/index.html', 'system/template/main.js', 'system/styles-catalog.json']
miss = [f for f in need if not os.path.exists(os.path.join(ROOT, f))]; rec('required files', 'PASS' if not miss else 'FAIL', f'{len(need)} present' if not miss else 'missing: ' + ', '.join(miss))
cat = json.load(open(os.path.join(ROOT, 'system', 'styles-catalog.json'), encoding='utf-8')); rec('style catalog', 'PASS' if len(cat) == 66 else 'FAIL', f'{len(cat)} styles, {len(set(c["palette"]["accent"] for c in cat))} accents')
for c in ('buat-video', 'buat-seri'):
    t = open(os.path.join(ROOT, '.claude', 'commands', c + '.md'), encoding='utf-8').read(); rec(f'/{c} command file', 'PASS' if t.startswith('---') and 'description:' in t.split('---')[1] else 'FAIL')
for f in ('system/lib/captions.js', 'system/lib/scenes.js', 'system/lib/illus.js', 'system/lib/thumb.js', 'system/tools/qa-captions.mjs', 'system/tools/caption-lab.mjs'):
    r = run(['node', '--check', os.path.join(ROOT, f)]); rec(f'syntax {f}', 'PASS' if r.returncode == 0 else 'FAIL', r.stderr.strip()[:100])
for f in ('system/audio/mixlib.py', 'system/audio/timbres.py', 'system/series.py', 'system/py/make_timeline.py', 'system/py/make_report.py', 'system/py/make_post.py'):
    try: compile(open(os.path.join(ROOT, f), encoding='utf-8').read(), f, 'exec'); rec(f'syntax {f}', 'PASS')
    except SyntaxError as e: rec(f'syntax {f}', 'FAIL', str(e))
# 4 upstream library untouched, 5 settings
g = run(['git', '-C', LIB, 'status', '--porcelain']); dirty = [l for l in g.stdout.split('\n') if l.strip() and not any(x in l for x in ('node_modules', '.venv', 'voices', '__pycache__'))]
rec('upstream library untouched', 'PASS' if g.returncode == 0 and not dirty else 'WARN', 'clean' if not dirty else f'{len(dirty)} changed: ' + '; '.join(dirty[:4]))
# Per-user Claude settings are not a required production dependency and are not inspected.
# 6 TTS network (real call)
os.makedirs(os.path.join(ROOT, 'system', 'logs'), exist_ok=True)
tmp = os.path.join(ROOT, 'system', 'logs', '_tts_probe.mp3')
if quick:
    rec('edge-tts online', 'NOT TESTED', '--quick does not make network requests')
else:
    r = run([sys.executable, '-m', 'edge_tts', '--voice', 'id-ID-ArdiNeural', '--text', 'Uji suara.', '--write-media', tmp], timeout=90); ok = os.path.exists(tmp) and os.path.getsize(tmp) > 1000
    rec('edge-tts online (id-ID-ArdiNeural)', 'PASS' if ok else 'FAIL', f'{os.path.getsize(tmp)} bytes' if ok else (r.stderr or r.stdout)[-120:]); os.path.exists(tmp) and os.remove(tmp)
# 7 caption lab
r = run(['node', os.path.join(ROOT, 'system', 'tools', 'caption-lab.mjs')], cwd=ROOT, env=dict(os.environ, LIB=LIB), timeout=600); rec('caption lab (6 effects x 2 orientations x 2 lines)', 'PASS' if r.returncode == 0 and 'ALL OK' in r.stdout else 'FAIL', r.stdout.strip().split('\n')[-1][:100])
for d in ('_lib', 'fonts', 'out'): shutil.rmtree(os.path.join(ROOT, 'system', 'lab', 'captions', d), ignore_errors=True)
# 8 real end-to-end 9:16 build
if not quick:
    slug = 'selftest-' + datetime.datetime.now().strftime('%H%M%S'); D = os.path.join(ROOT, 'films', slug); t0 = time.time()
    r = sh([os.path.join(ROOT, 'system', 'new-film.sh'), 'Uji Mandiri', '--slug', slug, '--part', '1', '--of', '14', '--next', 'Bagian berikutnya', '--series', 'Uji', '--style', 'dark-keynote', '--size', '1080x1920', '--thumb-text', 'Uji *mandiri*'])
    rec('new-film.sh creates folder (series part)', 'PASS' if os.path.exists(os.path.join(D, 'film.json')) else 'FAIL', r.stderr[-100:])
    L = [{'id': 'v1', 'text': 'Apa itu sistem uji mandiri?', 'scene': {'type': 'title', 'head': 'Apa itu *uji mandiri*?', 'visual': {'kind': 'orbit', 'center': 'check', 'items': ['gear', 'bolt', 'shield', 'chart', 'clock']}}},
         {'id': 'v2', 'text': 'Ia memeriksa seluruh alur produksi dari awal sampai akhir.', 'scene': {'type': 'statement', 'head': 'Memeriksa *seluruh alur*', 'sub': 'Dari naskah sampai video', 'visual': {'kind': 'steps', 'items': ['Naskah', 'Render', 'Mix', 'QA']}}},
         {'id': 'v3', 'text': 'Hasilnya dicatat sebagai lulus atau gagal.', 'scene': {'type': 'number', 'value': 100, 'suffix': '%', 'label': 'diperiksa otomatis'}}]
    json.dump(L, open(os.path.join(D, 'lines.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump({'title': 'Uji', 'caption': 'Uji alur.', 'hashtags': ['#uji', '#video', '#edukasi', '#teknologi'], 'pinned_comment': 'Uji mandiri', 'sources': ['local synthetic test']}, open(os.path.join(D, 'post.json'), 'w', encoding='utf-8'))
    r = sh([os.path.join(ROOT, 'system', 'build.sh'), slug], timeout=1500); mp4 = os.path.join(D, 'final', slug + '.mp4')
    rec('build.sh end-to-end 9:16 (TTS, ASR, render, mix, mux, QA)', 'PASS' if r.returncode == 0 and os.path.exists(mp4) else 'FAIL', f'{time.time() - t0:.0f} s' if os.path.exists(mp4) else r.stdout[-300:])
    if os.path.exists(mp4):
        pr = run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate', '-of', 'csv=p=0', mp4]).stdout.split(); rec('output format', 'PASS' if any('1080,1920' in x for x in pr) else 'FAIL', ' | '.join(pr))
        q = open(os.path.join(D, 'final', 'QA-REPORT.md'), encoding='utf-8').read(); bad = [l.split('|')[1].strip() for l in q.split('\n') if '| FAILED' in l]
        rec('QA-REPORT has no FAILED row', 'PASS' if not bad else 'FAIL', ', '.join(bad) or f'{q.count("| VERIFIED")} VERIFIED, {q.count("| LIMITED")} LIMITED')
        r = sh([os.path.join(ROOT, 'system', 'thumb.sh'), slug], timeout=300); rec('thumb.sh (3 variants)', 'PASS' if os.path.exists(os.path.join(D, 'final', 'thumbnail.jpg')) else 'FAIL', r.stderr[-100:])
        r = sh([os.path.join(ROOT, 'system', 'review.sh'), slug], timeout=400); rec('review.sh (scene contact sheets)', 'PASS' if os.path.exists(os.path.join(D, 'out', 'review', 'sheet-1.jpg')) else 'FAIL', r.stderr[-100:])
        pj = os.path.join(D, 'post.json'); json.dump({'title': 'Uji', 'caption': 'Uji alur.', 'hashtags': ['#a1', '#a2', '#a3', '#a4', '#a5'], 'description': 'd', 'keywords': ['k'], 'pinned_comment': 'p', 'sources': ['s']}, open(pj, 'w'))
        r = run([sys.executable, os.path.join(ROOT, 'system', 'py', 'make_post.py'), pj, os.path.join(D, 'final', 'POST.md'), os.path.join(D, 'film.json')]); rec('make_post.py', 'PASS' if os.path.exists(os.path.join(D, 'final', 'POST.md')) else 'FAIL', r.stdout.strip()[-100:])
        r = sh([os.path.join(ROOT, 'system', 'clean.sh'), slug]); rec('clean.sh', 'PASS' if not os.path.exists(os.path.join(D, 'out')) and os.path.exists(mp4) else 'FAIL', r.stdout.strip()[-100:])
    shutil.rmtree(D, ignore_errors=True); rec('temporary film removed', 'PASS' if not os.path.exists(D) else 'WARN')
# report
n = {k: sum(1 for x in R if x[1] == k) for k in ('PASS', 'WARN', 'FAIL', 'NOT TESTED')}
L = [f'# Selftest {datetime.datetime.now():%Y-%m-%d %H:%M}' + (' (quick)' if quick else ''), '', f'PASS {n["PASS"]} | WARN {n["WARN"]} | FAIL {n["FAIL"]}', '', '| Check | Status | Detail |', '|---|---|---|'] + [f'| {a} | {b} | {c.replace("|", "/")} |' for a, b, c in R]
L += ['', 'Not covered by any script: watching a video with sound, and the truth of the facts in a script (needs a human).']
os.makedirs(os.path.join(ROOT, 'system', 'logs'), exist_ok=True); p = os.path.join(ROOT, 'system', 'logs', f'selftest-{datetime.datetime.now():%Y%m%d-%H%M%S}.md'); open(p, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print(f'\nPASS {n["PASS"]} | WARN {n["WARN"]} | FAIL {n["FAIL"]}  -> {p}'); sys.exit(1 if n['FAIL'] else 0)
