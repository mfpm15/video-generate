"""Generate the QA report from current structured measurements; retain honest review limitations."""
import datetime, json, os, sys
from pathlib import Path
from run_qa import fingerprint
D = os.path.abspath(sys.argv[1]); d = Path(D)
F = json.loads((d / 'film.json').read_text(encoding='utf-8'))
results = json.loads((d / 'final/QA-RESULTS.json').read_text(encoding='utf-8'))
if results.get('video_sha256') != fingerprint(d / 'final' / (d.name + '.mp4')):
    raise SystemExit('QA results do not match the current final video; rerun QA')
def cell(value):
    return (value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)).replace('|', '/').replace('\n', ' ')[:1800]
rows = [f"| {cell(c['name'])} | {cell(c['detail'])} | {c['status']} |" for c in results['checks']]
report = [f"# QA REPORT: {F['title']}", '',
          f"Measured on {results['generated_at']} in the execution environment. Overall: **{results['overall']}**.",
          'Automated measurements do not verify visual style, all platform danger zones, listening or playback.', '',
          f"Requested style: {F.get('requested_style', F.get('style_name', '?'))}; render: {F.get('render', '?')}; {F['size']} @ {F['fps']} fps.", '',
          '| Check | Result | Status |', '|---|---|---|', *rows, '',
          '## Review still required',
          'Claude must inspect actual frames against the selected style and danger-zone mask and review playback/audio where supported. Record evidence separately; do not overwrite these measured results or claim unperformed checks.',
          'No content was published.']
(d / 'final/QA-REPORT.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
if os.path.exists(f'{D}/CREDITS'): open(f'{D}/final/CREDITS', 'w', encoding='utf-8').write(open(f'{D}/CREDITS', encoding='utf-8').read())
else: open(f'{D}/final/CREDITS', 'w', encoding='utf-8').write(f"""CREDITS: {F['title']}
Fonts: Inter, Inter Tight (Rasmus Andersson), JetBrains Mono (JetBrains): SIL Open Font License 1.1 (texts in the fonts folder of the project).
Voice: Microsoft Edge online text-to-speech via the edge-tts package ({F['voice']}). Unofficial endpoint: check Microsoft's terms before public or commercial use.
Music and sound effects: original synthesis by code (numpy), no samples, nothing third-party.
Rendering and loudness tools: Lemo-Opuscar render tools (github.com/lemomo-ai/lemo-opuscar), Playwright/Chromium, FFmpeg. Voice check: faster-whisper (QA only).
Style reference: {F['style_name']} ({F['style']}) from the Lemo-Opuscar style library (palette/caption/sound choices only for template films).
""")
print('final/QA-REPORT.md + final/CREDITS written')
