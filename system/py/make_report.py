"""make_report.py <film-dir>: writes final/QA-REPORT.md and final/CREDITS from MEASURED results (out/qa-run.log, out/mix-report.json, film.json).
Status words are assigned by rule from the numbers; anything needing a human ear/eye is written as NOT TESTED. Never edit the report by hand: re-run the build."""
import json, os, re, sys, datetime
D = os.path.abspath(sys.argv[1]); F = json.load(open(f'{D}/film.json', encoding='utf-8')); slug = F['slug']
log = open(f'{D}/out/qa-run.log', encoding='utf-8', errors='replace').read()
mixr = json.load(open(f'{D}/out/mix-report.json')) if os.path.exists(f'{D}/out/mix-report.json') else {}
cap = json.load(open(f'{D}/out/qa-captions.json')) if os.path.exists(f'{D}/out/qa-captions.json') else {}
TL = json.load(open(f'{D}/timeline.json', encoding='utf-8'))
g = lambda pat, d='?': (re.search(pat, log) or [None, d])[1]
lufs, lra, tp = g(r'I:\s+(-?[\d.]+) LUFS'), g(r'LRA:\s+([\d.]+) LU'), g(r'Peak:\s+(-?[\d.]+) dBFS')
vid = re.search(r'h264,(\w+),video,(\d+),(\d+),(\w+),(\w+),([\d/]+),([\d.]+)', log); aud = re.search(r'aac,\w+,audio,(\d+),(\d+)', log)
sil = re.findall(r'silence_start: ([\d.]+)', log); sild = re.findall(r'silence_duration: ([\d.]+)', log)
black = len(re.findall(r'black_start', log)); bad = len(re.findall(r'^BAD', log, re.M)); never = len(re.findall(r'never fully visible', log))
ratio = g(r'match ratio ([\d.]+)'); diffs = g(r'differences \(script -> heard\): (.*)', '[]')
st = lambda ok: 'VERIFIED' if ok else 'FAILED'
rows = []
if vid: rows.append(('Format', f"H.264 {vid[1]}, {vid[2]}x{vid[3]}, {vid[4]} ({vid[5]} range), {vid[6]} fps, {float(vid[7]):.2f} s; AAC {aud[1] if aud else '?'} Hz {aud[2] if aud else '?'} ch", st(vid[2] + 'x' + vid[3] == F['size'] and vid[6].startswith(str(F['fps'])))))
rows.append(('Loudness (mux.sh two-pass)', f'{lufs} LUFS integrated, LRA {lra} LU, true peak {tp} dBFS (target -14, limit -1)', st(lufs != '?' and abs(float(lufs) + 14) < 0.6 and float(tp) <= -1.0)))
rows.append(('Real silences', f"{len(sil)} found at {', '.join(sil)} s (durations {', '.join(sild)} s); planned {mixr.get('silences')}; peak inside planned windows {mixr.get('silence_peak')}", st(len(sil) >= 2)))
rows.append(('Black frames', f'{black} segment(s) longer than 0.05 s', 'VERIFIED' if black == 0 else 'LIMITED (check it is intended)'))
rows.append(('Reading time (readcheck)', f'{bad} text(s) shown too briefly, {never} never fully visible', st(bad == 0 and never == 0)))
if cap: rows.append(('Caption safe zone / overlap', f"{cap['samples']} samples: {len(cap['outsideSafe'])} outside the safe zone, {len(cap['overlaps'])} overlapping other text, {cap['noBox']} cue samples without a caption box", st(not cap['outsideSafe'] and not cap['overlaps'])))
rows.append(('Voice vs script (Whisper on the final mix)', f'word match ratio {ratio}; differences {diffs[:200]}', 'VERIFIED' if ratio != '?' and float(ratio) >= 0.97 else 'LIMITED (listen to the lines listed)'))
m = re.search(r'real voice onset \(stem\): min (-?[\d.]+) max (-?[\d.]+) s over (\d+)', log)
if m: rows.append(('Caption cue start vs real voice onset (voice stem)', f'{m[3]} lines, caption starts {m[1]}..{m[2]} s relative to the voice (want -0.30..0)', st(-0.30 <= float(m[1]) and float(m[2]) <= 0.0)))
rows.append(('Caption word timing', 'per-word highlight times come from Whisper (about +/-0.2 s accuracy)', 'LIMITED'))
rows.append(('Sound rules (one event = one layer, density cap)', f"{mixr.get('events', '?')} events, {mixr.get('sounded', '?')} sounded, {mixr.get('dropped_by_rules', '?')} dropped by rules, unmapped types {mixr.get('unmapped_types', '-')}" if mixr else 'custom mixer (this film has its own mix.py)', 'VERIFIED' if mixr else 'n/a'))
rows.append(('Listened to the mix / watched at full speed', 'cannot be done by the build tools', 'NOT TESTED (needs a human)'))
rep = [f"# QA REPORT: {F['title']}", '', f"Generated {datetime.date.today()} by `system/build.sh` on this laptop from measured output (`out/qa-run.log`). Re-run the build to refresh; do not edit by hand.", '',
       f"Style **{F['style_name']}** ({'hand-authored scenes' if F.get('render') == 'custom' else 'template scenes, palette from the style'}), caption effect {F['caption']}, sound mood {F['mood']}, {F['size']} @ {F['fps']} fps, {TL['dur']} s, voice {F['voice']}.", '',
       '| Check | Result | Status |', '|---|---|---|'] + [f'| {a} | {b} | {c} |' for a, b, c in rows] + ['',
       '## Caveats', '- Edge-TTS is an unofficial Microsoft online endpoint: check Microsoft terms before public or commercial use.',
       '- Any on-screen numbers/claims come from the script, not from measurements, unless the script says so.', '- Nothing was published anywhere.']
open(f'{D}/final/QA-REPORT.md', 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
if os.path.exists(f'{D}/CREDITS'): open(f'{D}/final/CREDITS', 'w', encoding='utf-8').write(open(f'{D}/CREDITS', encoding='utf-8').read())
else: open(f'{D}/final/CREDITS', 'w', encoding='utf-8').write(f"""CREDITS: {F['title']}
Fonts: Inter, Inter Tight (Rasmus Andersson), JetBrains Mono (JetBrains): SIL Open Font License 1.1 (texts in the fonts folder of the project).
Voice: Microsoft Edge online text-to-speech via the edge-tts package ({F['voice']}). Unofficial endpoint: check Microsoft's terms before public or commercial use.
Music and sound effects: original synthesis by code (numpy), no samples, nothing third-party.
Rendering and loudness tools: Lemo-Opuscar render tools (github.com/lemomo-ai/lemo-opuscar), Playwright/Chromium, FFmpeg. Voice check: faster-whisper (QA only).
Style reference: {F['style_name']} ({F['style']}) from the Lemo-Opuscar style library (palette/caption/sound choices only for template films).
""")
print('final/QA-REPORT.md + final/CREDITS written')
