"""Measured final-video QA. Preserve tool failures; never turn missing data into PASS."""
import argparse
import datetime
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
from fractions import Fraction


def fingerprint(path):
    with open(path, 'rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()


def assess_format(probe, film, timeline):
    video = next((s for s in probe.get('streams', []) if s.get('codec_type') == 'video'), {})
    audio = next((s for s in probe.get('streams', []) if s.get('codec_type') == 'audio'), {})
    try:
        fps = float(Fraction(video.get('avg_frame_rate', '0/1')))
        duration = float(probe['format']['duration'])
        expected = float(timeline['dur'])
        size = f"{video['width']}x{video['height']}"
        ok = (video.get('codec_name') == 'h264' and audio.get('codec_name') == 'aac'
              and video.get('pix_fmt') == 'yuv420p' and size == film['size']
              and abs(fps - float(film['fps'])) < .01 and duration > 0
              and abs(duration - expected) <= max(.2, 2 / fps))
        return ok, {'size': size, 'fps': fps, 'duration': duration, 'expected_duration': expected,
                    'video': video.get('codec_name'), 'audio': audio.get('codec_name'), 'pix_fmt': video.get('pix_fmt')}
    except (KeyError, ValueError, ZeroDivisionError, TypeError):
        return False, {'error': 'Missing or invalid stream, frame rate or duration measurements'}


def assess_loudness(output):
    # Use the final ebur128 summary, never a progress line or a default zero.
    loud = re.findall(r'I:\s+(-?[\d.]+|[-+]?inf) LUFS', output)
    peaks = re.findall(r'Peak:\s+(-?[\d.]+|[-+]?inf) dBFS', output)
    if not loud or not peaks:
        return False, {'error': 'No integrated loudness/true-peak measurement'}
    lufs, peak = float(loud[-1]), float(peaks[-1])
    ok = math.isfinite(lufs) and math.isfinite(peak) and abs(lufs + 14) < .6 and peak <= -1
    return ok, {'integrated_lufs': str(lufs), 'true_peak_dbfs': str(peak), 'target_lufs': -14, 'peak_limit_dbfs': -1}


def assess_captions(data):
    ok = (data.get('samples', 0) > 0 and not data.get('outsideSafe') and not data.get('overlaps')
          and not data.get('outsideContentSafe') and data.get('noBox') == 0 and data.get('perCue')
          and all(c.get('samples', 0) > 0 for c in data['perCue']))
    return bool(ok), {k: data.get(k) for k in ('samples', 'noBox', 'outsideSafe', 'outsideContentSafe', 'overlaps', 'perCue')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('film_dir', type=Path)
    args = parser.parse_args()
    d = args.film_dir.resolve()
    film = json.loads((d / 'film.json').read_text(encoding='utf-8'))
    timeline = json.loads((d / 'timeline.json').read_text(encoding='utf-8'))
    lib = Path(os.environ.get('LIB', Path.home() / 'lemo-opuscar')).resolve()
    root = Path(__file__).resolve().parents[2]
    video = d / 'final' / f'{d.name}.mp4'
    (d / 'out').mkdir(exist_ok=True)
    (d / 'final').mkdir(exist_ok=True)
    checks = []
    results = {'schema': 1, 'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'video_sha256': fingerprint(video) if video.is_file() else None,
               'source_sha256': {n: fingerprint(d/n) for n in ('film.json', 'lines.json', 'timeline.json', 'main.js') if (d/n).is_file()}, 'checks': checks}

    def record(name, ok, detail, failure='FAILED'):
        checks.append({'name': name, 'status': 'VERIFIED' if ok else failure, 'detail': detail})

    with (d / 'out/qa-run.log').open('w', encoding='utf-8') as log:
        def run(name, command, cwd=None):
            log.write(f'== {name}\n'); log.flush()
            try:
                r = subprocess.run([str(x) for x in command], cwd=cwd, capture_output=True,
                                   text=True, encoding='utf-8', errors='replace', timeout=900)
                output = r.stdout + r.stderr
                log.write(output + '\n'); log.flush()
                if r.returncode:
                    record(name, False, {'exit_code': r.returncode, 'error': output[-1200:]})
                return r.returncode == 0, output
            except (OSError, subprocess.TimeoutExpired) as e:
                record(name, False, {'error': str(e)})
                log.write(str(e) + '\n'); log.flush()
                return False, ''

        ok, out = run('ffprobe', ['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', video])
        if ok:
            try:
                record('Format / duration', *assess_format(json.loads(out), film, timeline))
            except ValueError:
                record('Format / duration', False, 'ffprobe returned invalid JSON')
        ok, out = run('ebur128', ['ffmpeg', '-hide_banner', '-nostats', '-i', video,
                                '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-'])
        if ok:
            if film.get('audio') is False:
                peaks = re.findall(r'Peak:\s+(-?[\d.]+|[-+]?inf) dBFS', out)
                record('Intentional silent audio', bool(peaks) and float(peaks[-1]) <= -80, {'measured_peak_dbfs': peaks[-1] if peaks else None})
            else:
                record('Loudness / true peak', *assess_loudness(out))
        ok, out = run('blackdetect', ['ffmpeg', '-hide_banner', '-nostats', '-i', video,
                                    '-vf', 'blackdetect=d=0.05:pic_th=0.98', '-an', '-f', 'null', '-'])
        if ok:
            black = re.findall(r'black_start:[^\n]+', out)
            record('Black frames', not black, black or 'No black segment >= 0.05 s', failure='LIMITED')
        ok, out = run('silencedetect', ['ffmpeg', '-hide_banner', '-nostats', '-i', video,
                                      '-af', 'silencedetect=n=-55dB:d=0.3', '-vn', '-f', 'null', '-'])
        if ok:
            silences = re.findall(r'silence_duration:\s*([\d.]+)', out)
            record('Real silences', len(silences) >= 2 or film.get('audio') is False, {'count': len(silences), 'durations': silences, 'intentional_silent_film': film.get('audio') is False})
        pad = ['--pad', '1.0'] if film.get('engine') == '3d' else []
        ok, out = run('readcheck', ['node', lib / 'core/render/readcheck.mjs', d, '--size', film['size'], *pad], cwd=lib)
        if ok:
            meaningful = any(line.startswith('OK ') for line in out.splitlines())
            record('Reading time', meaningful, 'Measured text passes' if meaningful else 'No timed readable text measured')
        if film.get('narration') is False:
            cap_path = d / 'out/qa-captions.json'
            cap_path.unlink(missing_ok=True)
            ok, _ = run('content danger-zone checker', ['node', root / 'system/tools/qa-captions.mjs', d])
            if ok:
                try:
                    data = json.loads(cap_path.read_text(encoding='utf-8'))
                    record('Critical text / brand safe area', *assess_captions(data))
                except (OSError, ValueError):
                    record('Critical text / brand safe area', False, 'Current measurements unavailable')
            checks.append({'name': 'Narration ASR / spoken captions', 'status': 'NOT APPLICABLE', 'detail': 'Explicit silent/non-narrated brief; on-screen text still requires readcheck and visual review'})
        else:
            # Remove old measurements: a failed new check may not reuse a previous green file.
            cap_path = d / 'out/qa-captions.json'
            cap_path.unlink(missing_ok=True)
            ok, _ = run('caption checker', ['node', root / 'system/tools/qa-captions.mjs', d])
            if ok:
                try:
                    record('Caption safe zone / overlap', *assess_captions(json.loads(cap_path.read_text(encoding='utf-8'))))
                except (OSError, ValueError):
                    record('Caption safe zone / overlap', False, 'Current caption measurements missing or invalid')
            ok, out = run('ASR final mix', [sys.executable, root / 'system/py/qa_asr.py', d])
            if ok:
                match = re.search(r'match ratio ([\d.]+)', out)
                record('Voice vs script', bool(match) and float(match[1]) >= .97,
                       out.strip())
                onset = re.search(r'cue start - real voice onset \(stem\): min (-?[\d.]+) max (-?[\d.]+)', out)
                record('Caption vs measured voice onset', bool(onset) and -.30 <= float(onset[1]) and float(onset[2]) <= 0,
                       onset.group(0) if onset else 'Voice-onset measurements unavailable')
        record('Visual fidelity / all danger zones / playback and listening', False,
               'Claude must inspect actual review frames and playback where supported. Caption checks do not validate faces/brand or style.',
               failure='NOT TESTED')
    results['overall'] = 'FAILED' if any(c['status'] == 'FAILED' for c in checks) else 'LIMITED'
    text = json.dumps(results, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    for path in (d / 'out/qa-results.json', d / 'final/QA-RESULTS.json'):
        path.write_text(text, encoding='utf-8')
    print(f"QA: {results['overall']}; " + '; '.join(f"{c['name']}: {c['status']}" for c in checks))
    return 1 if results['overall'] == 'FAILED' else 0


if __name__ == '__main__':
    raise SystemExit(main())
