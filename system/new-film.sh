#!/bin/sh
# Create a new film folder automatically.
#   sh system/new-film.sh "Judul Video" [--style <slug>|AUTO] [--size 1080x1920 (default)|1920x1080] [--engine 3d (default)|2d] [--lang id|en] [--voice <edge voice>] [--minutes 1.5] [--desc "..."]
# Makes films/<slug>/ with film.json (from the style catalog), lines.json (stub), main.js + index.html (template look), README.txt.
# fps rule (user decision): 60 if the style is a 60 fps style, otherwise 30. Caption effect and sound mood follow the style.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
. "$ROOT/system/tools/runtime.sh"
TITLE=${1:?usage: sh system/new-film.sh "Judul"}; shift
RENDER=template; REQUESTED_STYLE=""; STYLE=AUTO; SIZE=1080x1920; ENGINE=3d; LANGC=id; VOICE=""; MIN=1.5; DESC=""; SLUGO=""; PART=0; OF=0; NEXT=""; SERIES=""; THUMBTEXT=""; THUMBVAR=1; SSHORT=""; ART=auto
while [ $# -gt 0 ]; do case "$1" in --render) RENDER=$2;; --requested-style) REQUESTED_STYLE=$2;; --style) STYLE=$2;; --size) SIZE=$2;; --lang) LANGC=$2;; --voice) VOICE=$2;; --minutes) MIN=$2;; --desc) DESC=$2;; --engine) ENGINE=$2;; --slug) SLUGO=$2;; --part) PART=$2;; --of) OF=$2;; --next) NEXT=$2;; --series) SERIES=$2;; --series-short) SSHORT=$2;; --art) ART=$2;; --thumb-text) THUMBTEXT=$2;; --thumb-variant) THUMBVAR=$2;; *) echo "unknown option $1"; exit 2;; esac; shift 2; done
RENDER="$RENDER" REQUESTED_STYLE="$REQUESTED_STYLE" ENGINE="$ENGINE" ROOT="$ROOT" TITLE="$TITLE" STYLE="$STYLE" SIZE="$SIZE" LANGC="$LANGC" VOICE="$VOICE" MIN="$MIN" DESC="$DESC" SLUGO="$SLUGO" PART="$PART" OF="$OF" NEXT="$NEXT" SERIES="$SERIES" SSHORT="$SSHORT" ART="$ART" THUMBTEXT="$THUMBTEXT" THUMBVAR="$THUMBVAR" "$PY" - <<'PYEOF'
import os, re, json, shutil, sys, unicodedata
R = os.environ['ROOT']; title = os.environ['TITLE']; style = os.environ['STYLE']
cat = json.load(open(f'{R}/system/styles-catalog.json', encoding='utf-8'))
if style.upper() == 'AUTO': style = 'dark-keynote'
st = next((c for c in cat if c['slug'] == style or c['name'].lower() == style.lower() or str(c['no']) == style), None)
if not st: raise SystemExit(f'unknown style "{style}" (see system/styles-catalog.md)')
base = re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode().lower()).strip('-')[:48] or 'film'
slug, n = (os.environ['SLUGO'] or base), 2
if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug): raise SystemExit('slug must contain only lowercase letters, numbers and hyphens')
if os.environ['RENDER'] not in ('template', 'custom'): raise SystemExit('render must be template or custom')
if os.environ['ENGINE'] not in ('2d', '3d'): raise SystemExit('engine must be 2d or 3d')
if os.environ['SLUGO'] and os.path.exists(f"{R}/films/{slug}"): raise SystemExit(f'films/{slug} already exists (not touching it)')
while os.path.exists(f'{R}/films/{slug}'): slug = f'{base}-{n}'; n += 1
D = f'{R}/films/{slug}'; os.makedirs(f'{D}/final'); os.makedirs(f'{D}/out'); os.makedirs(f'{D}/voice')
lang = os.environ['LANGC']; voice = os.environ['VOICE'] or {'id': 'id-ID-ArdiNeural', 'en': 'en-US-GuyNeural'}.get(lang, 'id-ID-ArdiNeural')
fps = st['style_fps'] if st.get('style_fps') in (24, 25, 30, 50, 60) else 30
film = dict(slug=slug, title=title, description=os.environ['DESC'], lang=lang, size=os.environ['SIZE'], fps=fps, minutes=float(os.environ['MIN']),
            style=st['slug'], style_name=st['name'], style_native_fps=st['style_fps'], renderer=st['renderer'], render=os.environ['RENDER'], requested_style=os.environ['REQUESTED_STYLE'] or st['name'], engine=os.environ['ENGINE'], world=st['world'],
            caption=(st['short_caption'] if os.environ['ENGINE'] == '3d' else st['caption']), mood=st['mood'], sfx='medium', voice=voice, rate='+6%', asr_lang=lang, asr_model='small', palette=st['palette'])
if os.environ['ART'] == 'topic' or (os.environ['ART'] == 'auto' and os.environ['STYLE'].upper() == 'AUTO'):   # look from the TOPIC: palette + motifs always; world/caption/mood too when the style was left on AUTO (an explicit style keeps its world)
    import subprocess, zlib
    ad = json.loads(subprocess.run([sys.executable, f'{R}/system/py/art_director.py', title, os.environ['DESC']], capture_output=True, text=True, encoding='utf-8').stdout or '{}')
    if ad.get('palette'):
        film['palette'] = {k: v for k, v in ad['palette'].items() if k != 'contrast_accent_on_bg'}; film['register'] = ad['register']; film['motifs'] = ad['motifs']
        if os.environ['STYLE'].upper() == 'AUTO' and film['engine'] == '3d': film['world'], film['caption'], film['mood'] = ad['world'], ad['caption'], ad['mood']
part, of = int(os.environ['PART']), int(os.environ['OF'])
if part and of:   # a part of a series: badge, end card and a titled thumbnail with the series badge
    film['series'] = dict(name=os.environ['SERIES'] or title, short=(os.environ['SSHORT'] or (os.environ['SERIES'] or title))[:22], n=part, total=of, next=os.environ['NEXT']); film['minutes'] = min(film['minutes'], 1.0)
    film['thumb'] = dict(text=os.environ['THUMBTEXT'] or title, kicker=f'BAGIAN {part}/{of}', variant=int(os.environ['THUMBVAR']))
json.dump(film, open(f'{D}/film.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
json.dump([{'id': 'v1', 'text': title + '?', 'scene': {'type': 'title', 'head': title, 'sub': ''}}], open(f'{D}/lines.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
if os.environ['ENGINE'] == '3d': shutil.copy(f'{R}/system/template/main3d.js', f'{D}/main.js'); shutil.copy(f'{R}/system/template/index3d.html', f'{D}/index.html')
else:
    for f in ('main.js', 'index.html'): shutil.copy(f'{R}/system/template/{f}', f'{D}/{f}')
open(f'{D}/README.txt', 'w', encoding='utf-8').write(f"""{title}
Style: {st['name']} ({st['slug']}), {st['renderer']}, caption effect {st['caption']}, sound mood {st['mood']}, {film['size']} @ {fps} fps
Edit lines.json (the script + one scene per line), then:  sh system/build.sh {slug}
Output: final/{slug}.mp4, final/poster.jpg, final/QA-REPORT.md.   Generated (do not edit): _lib/ fonts/ voice/ out/ timeline.json events.json
""")
print(D)
PYEOF
