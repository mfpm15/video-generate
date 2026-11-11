"""Check nonempty deliverables and current, non-failed QA before declaring a build complete."""
import json
from pathlib import Path
import sys
from run_qa import fingerprint

def check(d):
    d = Path(d); fin = d / 'final'
    need = [f'{d.name}.mp4', 'thumbnail.jpg', 'CAPTION.txt', 'HASHTAGS.txt', 'POST.md', 'QA-REPORT.md', 'QA-RESULTS.json', 'CREDITS']
    errors = [f'Missing/empty: {n}' for n in need if not (fin/n).is_file() or (fin/n).stat().st_size == 0]
    try:
        qa = json.loads((fin / 'QA-RESULTS.json').read_text(encoding='utf-8'))
        if qa.get('schema') != 1 or qa.get('overall') not in ('VERIFIED', 'LIMITED') or not qa.get('checks'):
            errors.append('QA is missing, incomplete or failed')
        if any(c.get('status') == 'FAILED' for c in qa.get('checks', [])):
            errors.append('A required QA check failed')
        for name in ('film.json', 'lines.json', 'timeline.json', 'main.js'):
            if qa.get('source_sha256', {}).get(name) != fingerprint(d/name):
                errors.append(f'QA is stale: {name} changed')
        if qa.get('video_sha256') != fingerprint(fin / f'{d.name}.mp4'):
            errors.append('QA is stale: final video bytes changed')
    except (OSError, ValueError, TypeError):
        errors.append('Current QA evidence unavailable or invalid')
    return errors

if __name__ == '__main__':
    errors = check(sys.argv[1])
    print('deliverables: ' + ('; '.join(errors) if errors else 'ALL PRESENT; automated QA complete; visual/audio review remains required'))
    raise SystemExit(bool(errors))
