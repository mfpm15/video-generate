"""Builds system/styles-catalog.json + styles-catalog.md from the library (read-only). Run: python system/make_catalog.py"""
import json, re, os, glob, collections
LIB = os.path.expanduser('~/lemo-opuscar/styles'); OUT = os.path.dirname(os.path.abspath(__file__))
# caption effect auto-map by category (CLAUDE.md AUTO rules). Only 01 is VERIFIED; others are mapped but NOT TESTED.
CAP = {'Information & Keynote': '01', 'Evidence Films': '01', 'Edit & Documentary': '04', 'Hand-drawn & Painting': '06',
       'East Asian Traditions': '06', 'Print & Printmaking': '04', 'Graphic & Type': '03', 'Cartoon & Anime': '02',
       'Games': '05', 'Cinema & Eras': '04', 'Materials & 3D': '04'}
# template palettes + sound mood per category (the TEMPLATE look is palette-inspired only; a style's real rendering needs hand-authored scenes)
D1 = dict(pattern='grid'); 
PAL = {'Information & Keynote': (dict(bg1='#0A0B0F', bg2='#181B26', accent='#B7F34A', pattern='grid'), 'tech'),
       'Evidence Films': (dict(bg1='#0A1114', bg2='#16262C', accent='#4DD6C1', pattern='grid'), 'tech'),
       'Edit & Documentary': (dict(bg1='#101010', bg2='#232323', accent='#F2C14E', pattern='plain'), 'cinematic'),
       'Hand-drawn & Painting': (dict(bg1='#2A211B', bg2='#4A3A2E', accent='#F0B27A', pattern='plain'), 'organic'),
       'East Asian Traditions': (dict(bg1='#1B1614', bg2='#3A2A26', accent='#E0573D', pattern='plain'), 'organic'),
       'Print & Printmaking': (dict(bg1='#1C1A17', bg2='#35302A', accent='#E4572E', pattern='plain'), 'organic'),
       'Graphic & Type': (dict(bg1='#0E0E14', bg2='#22223A', accent='#FF4D6D', pattern='grid'), 'tech'),
       'Cartoon & Anime': (dict(bg1='#14122B', bg2='#2D2A5C', accent='#FFD166', pattern='plain'), 'organic'),
       'Games': (dict(bg1='#0C0F1F', bg2='#1E2550', accent='#7CF2A8', pattern='grid'), 'tech'),
       'Cinema & Eras': (dict(bg1='#12100D', bg2='#2A241B', accent='#D9A441', pattern='plain'), 'cinematic'),
       'Materials & 3D': (dict(bg1='#0F1013', bg2='#242830', accent='#8BB8FF', pattern='plain'), 'cinematic')}
import colorsys
def tint(t, base):   # per-style accent from the style's own STYLE.md colours (first clearly saturated hex), lightened for contrast on dark; bg tinted to that hue
    for h in re.findall(r'#([0-9A-Fa-f]{6})', t):
        r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)); H, L, S = colorsys.rgb_to_hls(r, g, b)
        if S > .45 and .25 < L < .8:
            L = max(L, .62); ar, ag, ab = colorsys.hls_to_rgb(H, L, min(1, S + .1)); f = lambda x: '%02X' % round(x * 255)
            c1 = colorsys.hls_to_rgb(H, .05, .30); c2 = colorsys.hls_to_rgb(H, .12, .28)
            return dict(base, accent='#' + f(ar) + f(ag) + f(ab), bg1='#' + ''.join(f(x) for x in c1), bg2='#' + ''.join(f(x) for x in c2))
    return base
WORLD = {'Information & Keynote': 'neon', 'Graphic & Type': 'neon', 'Games': 'neon', 'Evidence Films': 'glass', 'Materials & 3D': 'glass',
         'Hand-drawn & Painting': 'clay', 'East Asian Traditions': 'clay', 'Print & Printmaking': 'clay', 'Cartoon & Anime': 'clay', 'Edit & Documentary': 'cosmos', 'Cinema & Eras': 'cosmos'}
WCAP = {'neon': ['impact', 'pop'], 'glass': ['pop', 'karaoke'], 'clay': ['kinetic', 'pop'], 'cosmos': ['karaoke', 'impact']}
def hh(x):
    v = 2166136261
    for ch in x: v = ((v ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return v
rows = []
for j in sorted(glob.glob(f'{LIB}/*/style.json')):
    d = json.load(open(j, encoding='utf-8')); slug = d['slug']
    if not os.path.exists(f'{LIB}/{slug}/STYLE.md'): continue
    t = open(f'{LIB}/{slug}/STYLE.md', encoding='utf-8').read()
    m = re.search(r'(\d{2})\s*fps', t); fps = int(m.group(1)) if m else 30
    gl = bool(re.search(r'WebGL|three\.js|THREE\.', t))
    rows.append(dict(slug=slug, name=d['en'], category=d['category_en'], uses=d.get('uses', []), line=d['line'], style_fps=fps,
                     renderer='WebGL' if gl else 'Canvas2D', caption=CAP.get(d['category_en'], '01'),
                     palette=tint(t, PAL.get(d['category_en'], PAL['Information & Keynote'])[0]), mood=PAL.get(d['category_en'], PAL['Information & Keynote'])[1],
                     world=WORLD.get(d['category_en'], 'neon'), short_caption=WCAP[WORLD.get(d['category_en'], 'neon')][hh(slug) % 2]))
json.dump(rows, open(f'{OUT}/styles-catalog.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
by = collections.defaultdict(list)
for r in rows: by[r['category']].append(r)
n = 0; md = ['# Katalog style (otomatis dari library). World 3D = dunia 3D yang dipakai (neon, glass, clay, cosmos); warna aksen/latar mengikuti STYLE.md tiap style; Caption = efek caption pendek\n']
for c, rs in by.items():
    md.append(f'\n## {c}\n\n| No | Style | Cocok untuk | World 3D | Caption |\n|---|---|---|---|---|')
    for r in rs: n += 1; r['no'] = n; md.append(f"| {n} | **{r['name']}** (`{r['slug']}`) | {', '.join(r['uses'])} | {r['world']} | {r['short_caption']} |")
json.dump(rows, open(f'{OUT}/styles-catalog.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
open(f'{OUT}/styles-catalog.md', 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print(len(rows), 'styles;', collections.Counter(r['style_fps'] for r in rows), collections.Counter(r['renderer'] for r in rows))
