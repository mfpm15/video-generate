"""Reject unfinished scaffolds before generating voices or rendering frames."""
import json
from pathlib import Path
import re
import sys


def check(d):
    d = Path(d)
    errors = []
    try:
        film = json.loads((d / 'film.json').read_text(encoding='utf-8'))
        lines = json.loads((d / 'lines.json').read_text(encoding='utf-8'))
        post = json.loads((d / 'post.json').read_text(encoding='utf-8'))
        if not isinstance(lines, list) or len(lines) < 2 or any(not x.get('id') or not x.get('text', '').strip() for x in lines):
            errors.append('Write the complete script; the one-line scaffold is not a film')
        if len({x['id'] for x in lines}) != len(lines):
            errors.append('Voice line IDs must be unique')
        if not post.get('title') or not post.get('caption') or not post.get('hashtags'):
            errors.append('Write post.json title, caption and hashtags before build')
        if film.get('audio') is False and film.get('narration') is not False:
            errors.append('Explicit silence requires narration:false as well as audio:false')
        if film.get('captions_required') is True and film.get('caption') in ('none', 'off', False):
            errors.append('Captions were requested but the caption profile is disabled')
        if film.get('render') not in ('template', 'custom'):
            errors.append('Select a valid render mode')
        if film.get('render') == 'custom':
            main = (d / 'main.js').read_text(encoding='utf-8')
            code = re.sub(r'//[^\n]*|/\*.*?\*/', '', main, flags=re.S).strip()
            if re.fullmatch(r"import\s*['\"]\./_lib/(e3d|scenes)\.js['\"];?", code):
                errors.append('Custom style still uses the unchanged template stub; author main.js first')
    except (OSError, ValueError, TypeError, KeyError, AttributeError) as e:
        errors.append(f'Invalid/missing production inputs: {e}')
    return errors


if __name__ == '__main__':
    errors = check(sys.argv[1])
    print('inputs: ' + ('; '.join(errors) if errors else 'complete'))
    raise SystemExit(bool(errors))
