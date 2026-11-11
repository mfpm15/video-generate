"""Render review and UI-danger-zone sheets; use argument arrays so paths with spaces work."""
import json
import os
from pathlib import Path
import subprocess
import sys
from PIL import Image, ImageDraw


def main():
    d = Path(sys.argv[1]).resolve()
    lib = Path(os.environ.get('LIB', Path.home() / 'lemo-opuscar')).resolve()
    film = json.loads((d/'film.json').read_text(encoding='utf-8'))
    timeline = json.loads((d/'timeline.json').read_text(encoding='utf-8'))
    out = d/'out/review'; out.mkdir(parents=True, exist_ok=True)
    for p in [*out.glob('f_*.jpg'), *out.glob('sheet-*.jpg'), *out.glob('safe-*.jpg')]:
        p.unlink()
    times = sorted(set(round(max(s['t0'], min(s['t0'] + 2.4, s['t1'] - .3)), 2) for s in timeline['scenes']))
    if not times:
        raise SystemExit('No scenes to review')
    subprocess.run(['node', str(lib/'core/render/still.mjs'), str(d), *map(str, times), '--size', film['size'], '--out', str(out), '--prefix', 'f_'], cwd=lib, check=True)
    files = sorted(out.glob('f_*.jpg'))
    if len(files) != len(times):
        raise SystemExit('Review render did not produce every requested frame')
    for i in range(0, len(files), 6):
        subprocess.run([sys.executable, str(lib/'core/render/sheet.py'), str(out/f'sheet-{i//6+1}.jpg'),
                        *map(str, files[i:i+6]), '--cols', '2', '--w', '540'], check=True)
    for p in files:
        image = Image.open(p).convert('RGBA'); w, h = image.size
        area = film.get('safe_zone') or ({'x0': 60/1080, 'y0': 210/1920, 'x1': 930/1080, 'y1': .75} if h > w else
                                        {'x0': 110/1920, 'y0': 60/1080, 'x1': 1-110/1920, 'y1': 1-110/1080})
        x0, y0, x1, y1 = [round(area[k] * scale) for k, scale in [('x0', w), ('y0', h), ('x1', w), ('y1', h)]]
        overlay = Image.new('RGBA', image.size, (255, 0, 0, 85)); draw = ImageDraw.Draw(overlay)
        draw.rectangle((x0, y0, x1, y1), fill=(0, 0, 0, 0), outline=(0, 255, 100, 255), width=max(2, w//200))
        Image.alpha_composite(image, overlay).convert('RGB').save(out/('safe-'+p.name), quality=95)
    safe = sorted(out.glob('safe-f_*.jpg'))
    for i in range(0, len(safe), 6):
        subprocess.run([sys.executable, str(lib/'core/render/sheet.py'), str(out/f'safe-sheet-{i//6+1}.jpg'),
                        *map(str, safe[i:i+6]), '--cols', '2', '--w', '540'], check=True)
    print(f'Review sheets and separate danger-zone masks: {out}. Inspect them; generation alone is not a visual pass.')


if __name__ == '__main__':
    main()
