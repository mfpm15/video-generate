"""series.py: manage a multi-part series (one film per part, one locked style).
  init <slug> --title T --style S --parts N [--size 1080x1920] [--lang id] [--desc D]     create series/<slug>/ (series.json, RESEARCH.md, OUTLINE.md, pronunciation.json, posts/)
  scaffold <slug>                      create films/<slug>-pNN/ for every part that has a title in series.json (never touches an existing one)
  status <slug>                        one line per part
  build <slug> [--only 1,2] [--from N] build every scripted part not yet built (resumable); thumbnails; SERIES-REPORT.md. Keeps the PC awake while it runs.
  schedule <slug> [--start YYYY-MM-DD] [--times 12:00,19:00]   POST.md per part + SCHEDULE.md (2 posts a day). Times are suggestions only.
  clean <slug>                         clean.sh for every built part (frees disk; final/ and voice/ are kept)
Run with the library python:  ~/lemo-opuscar/.venv/bin/python system/series.py <command> ..."""
import argparse, ctypes, datetime, json, os, re, shutil, subprocess, sys, time, unicodedata
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
PY = os.path.join(LIB, '.venv', 'Scripts', 'python.exe') if os.path.exists(os.path.join(LIB, '.venv', 'Scripts', 'python.exe')) else sys.executable
SH = shutil.which('sh') or 'sh'
def sdir(slug): return os.path.join(ROOT, 'series', slug)
def load(slug): return json.load(open(os.path.join(sdir(slug), 'series.json'), encoding='utf-8'))
def save(slug, d): json.dump(d, open(os.path.join(sdir(slug), 'series.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
def pslug(slug, n): return f'{slug}-p{n:02d}'
def fdir(slug, n): return os.path.join(ROOT, 'films', pslug(slug, n))
def sh(args, env=None, log=None):
    e = dict(os.environ, LIB=LIB, **(env or {})); f = open(log, 'w', encoding='utf-8') if log else None
    r = subprocess.run([SH] + args, cwd=ROOT, env=e, stdout=f or None, stderr=subprocess.STDOUT if f else None); f and f.close(); return r.returncode

def init(a):
    slug = re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', a.slug).encode('ascii', 'ignore').decode().lower()).strip('-')
    d = sdir(slug)
    if os.path.exists(d): sys.exit(f'series/{slug} already exists (not touching it)')
    os.makedirs(os.path.join(d, 'posts'))
    S = dict(slug=slug, short=a.short or a.title, title=a.title, description=a.desc, style=a.style, size=a.size, lang=a.lang, total=a.parts, created=str(datetime.date.today()),
             schedule=dict(start='', times=['12:00', '19:00']), parts=[dict(n=i, slug=pslug(slug, i), title='', hook='', thumb_text='', status='planned') for i in range(1, a.parts + 1)])
    save(slug, S); json.dump({}, open(os.path.join(d, 'pronunciation.json'), 'w', encoding='utf-8'), indent=1)
    open(os.path.join(d, 'RESEARCH.md'), 'w', encoding='utf-8').write(f'# Research: {a.title}\n\nOne row per factual claim: claim | source URL | date/version | confidence (high/medium/low) | used in part.\nNo claim may appear in a script unless it has a row here.\n\n| Claim | Source | Date | Confidence | Part |\n|---|---|---|---|---|\n')
    open(os.path.join(d, 'OUTLINE.md'), 'w', encoding='utf-8').write(f'# Outline: {a.title}\n\n(parts, one idea each, hook + payoff + cliffhanger)\n')
    print(d)

def scaffold(a):
    S = load(a.slug); made = []
    for i, p in enumerate(S['parts']):
        if not p['title'] or os.path.exists(fdir(a.slug, p['n'])): continue
        nxt = S['parts'][i + 1]['title'] if i + 1 < len(S['parts']) else ''
        args = [os.path.join(ROOT, 'system', 'new-film.sh'), p['title'], '--slug', pslug(a.slug, p['n']), '--part', str(p['n']), '--of', str(S['total']), '--next', nxt, '--series', S['title'], '--series-short', S.get('short') or S['title'],
                '--style', S['style'], '--size', S['size'], '--lang', S['lang'], '--thumb-text', p.get('thumb_text') or p['title'], '--thumb-variant', str(S.get('thumb_variant', 2)), '--desc', p.get('hook', '')]
        if sh(args) == 0: made.append(p['n']); p['status'] = 'scaffolded'
    save(a.slug, S); print('scaffolded parts:', made or 'none new')

def stub(slug, n):
    p = os.path.join(fdir(slug, n), 'lines.json')
    if not os.path.exists(p): return True
    L = json.load(open(p, encoding='utf-8')); return len(L) < 2

def apply_pron(slug, n):
    pr = json.load(open(os.path.join(sdir(slug), 'pronunciation.json'), encoding='utf-8')); p = os.path.join(fdir(slug, n), 'lines.json'); L = json.load(open(p, encoding='utf-8')); ch = 0
    for it in L:
        t = it['text']; s = t
        for k, v in pr.items(): s = re.sub(rf'\b{re.escape(k)}\b', v, s, flags=re.I)
        if s != t: it['say'] = s; it['asr'] = s; ch += 1
    json.dump(L, open(p, 'w', encoding='utf-8'), indent=1, ensure_ascii=False); return ch

def qa_summary(slug, n):
    p = os.path.join(fdir(slug, n), 'final', 'QA-REPORT.md')
    if not os.path.exists(p): return 'no QA report'
    t = open(p, encoding='utf-8').read(); return f"{t.count('| VERIFIED')} VERIFIED, {sum(t.count(x) for x in ('| LIMITED',))} LIMITED, {t.count('| FAILED')} FAILED, {t.count('| NOT TESTED')} NOT TESTED"

def build(a):
    S = load(a.slug); only = set(int(x) for x in a.only.split(',')) if a.only else None; ES = 0x80000000 | 0x00000001
    try: ctypes.windll.kernel32.SetThreadExecutionState(ES)          # keep Windows awake while building (released when this process ends)
    except Exception: pass
    for p in S['parts']:
        n = p['n']
        if (only and n not in only) or (a.frm and n < a.frm): continue
        fd = fdir(a.slug, n); mp4 = os.path.join(fd, 'final', pslug(a.slug, n) + '.mp4')
        if not os.path.isdir(fd) or stub(a.slug, n): print(f'part {n}: not scripted yet, skipped'); continue
        if os.path.exists(mp4) and not a.force: print(f'part {n}: already built, skipped (use --force)'); continue
        print(f'part {n}/{S["total"]}: building {pslug(a.slug, n)} ...', flush=True); t0 = time.time(); ch = apply_pron(a.slug, n); rc = 1
        for attempt in (1, 2):
            rc = sh([os.path.join(ROOT, 'system', 'build.sh'), pslug(a.slug, n)], log=os.path.join(fd, 'out', f'build-attempt{attempt}.log'))
            if rc == 0 and os.path.exists(mp4): break
            print(f'  attempt {attempt} failed (rc={rc}); ' + ('retrying' if attempt == 1 else 'giving up'), flush=True)
        if os.path.exists(mp4):
            sh([os.path.join(ROOT, 'system', 'thumb.sh'), pslug(a.slug, n)], log=os.path.join(fd, 'out', 'thumb.log')); p['status'] = 'built'
        else: p['status'] = 'FAILED'
        p['built_s'] = round(time.time() - t0); p['qa'] = qa_summary(a.slug, n); save(a.slug, S); print(f"  -> {p['status']} in {p['built_s']} s | pronunciation fixes {ch} | {p['qa']}", flush=True)
    try: ctypes.windll.kernel32.SetThreadExecutionState(0x80000000)
    except Exception: pass
    report(a.slug)

def report(slug):
    S = load(slug); L = [f"# SERIES REPORT: {S['title']}", '', f'Generated {datetime.datetime.now():%Y-%m-%d %H:%M}. Style `{S["style"]}`, {S["size"]}, {S["total"]} parts.', '', '| Part | Title | Status | Build time | QA (from each QA-REPORT.md) |', '|---|---|---|---|---|']
    for p in S['parts']: L.append(f"| {p['n']} | {p['title']} | {p['status']} | {p.get('built_s', '')} s | {p.get('qa', '')} |")
    L += ['', 'Every part still needs a human to watch it with sound and to read RESEARCH.md for the facts. LIMITED usually means a word Whisper heard differently from the script (listen to that line).']
    open(os.path.join(sdir(slug), 'SERIES-REPORT.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')

def status(a):
    S = load(a.slug)
    for p in S['parts']:
        fd = fdir(a.slug, p['n']); built = os.path.exists(os.path.join(fd, 'final', p['slug'] + '.mp4')); post = os.path.exists(os.path.join(sdir(a.slug), 'posts', f"p{p['n']:02d}.json"))
        print(f"{p['n']:>2} {'scripted' if os.path.isdir(fd) and not stub(a.slug, p['n']) else 'no-script':9} {'BUILT' if built else '-':5} {'post.json' if post else '-':9} {p['title']}")

def schedule(a):
    S = load(a.slug); times = a.times.split(',') if a.times else S['schedule']['times']; start = datetime.date.fromisoformat(a.start) if a.start else (datetime.date.today() + datetime.timedelta(days=1))
    L = [f"# SCHEDULE: {S['title']}", '', f'You post manually. Start {start}, {len(times)} posts a day at {", ".join(times)} (suggestions: adjust to your own analytics once you have some). Nothing is published automatically.', '']
    for p in S['parts']:
        n = p['n']; pj = os.path.join(sdir(a.slug), 'posts', f'p{n:02d}.json'); fd = fdir(a.slug, n)
        if os.path.exists(pj) and os.path.isdir(fd): subprocess.run([PY, os.path.join(ROOT, 'system', 'py', 'make_post.py'), pj, os.path.join(fd, 'final', 'POST.md'), os.path.join(fd, 'film.json')], check=False)
    day = None
    for p in S['parts']:
        n = p['n']; d = start + datetime.timedelta(days=(n - 1) // len(times)); t = times[(n - 1) % len(times)]
        if d != day: L += [f'## Day {(n - 1) // len(times) + 1}: {d:%A %d %B %Y}', '']; day = d
        pm = os.path.join(fdir(a.slug, n), 'final', 'POST.md'); L += [f"### {t} | Part {n}/{S['total']}: {p['title']}", f"- Video: `films/{p['slug']}/final/{p['slug']}.mp4`  | Thumbnail: `films/{p['slug']}/final/thumbnail.jpg`", f"- Copy-paste text: `films/{p['slug']}/final/POST.md`" + ('' if os.path.exists(pm) else '  (NOT WRITTEN YET)'), '']
    open(os.path.join(sdir(a.slug), 'SCHEDULE.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n'); print('SCHEDULE.md written')

def clean(a):
    S = load(a.slug)
    for p in S['parts']:
        if os.path.exists(os.path.join(fdir(a.slug, p['n']), 'final', p['slug'] + '.mp4')): sh([os.path.join(ROOT, 'system', 'clean.sh'), p['slug']])

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    i = sp.add_parser('init'); i.add_argument('slug'); i.add_argument('--title', required=True); i.add_argument('--style', default='AUTO'); i.add_argument('--parts', type=int, default=14); i.add_argument('--size', default='1080x1920'); i.add_argument('--lang', default='id'); i.add_argument('--desc', default=''); i.add_argument('--short', default=''); i.set_defaults(f=init)
    for nm, f in (('scaffold', scaffold), ('status', status), ('clean', clean)): x = sp.add_parser(nm); x.add_argument('slug'); x.set_defaults(f=f)
    b = sp.add_parser('build'); b.add_argument('slug'); b.add_argument('--only'); b.add_argument('--from', dest='frm', type=int); b.add_argument('--force', action='store_true'); b.set_defaults(f=build)
    s = sp.add_parser('schedule'); s.add_argument('slug'); s.add_argument('--start'); s.add_argument('--times'); s.set_defaults(f=schedule)
    a = ap.parse_args(); a.f(a)
