"""qa_asr.py <film-dir>: transcribe the FINAL mp4 audio (faster-whisper) and compare with the script; check cue starts against heard words.
Language and model come from film.json (asr_lang, asr_model)."""
import json, os, re, subprocess, sys, difflib
D = os.path.abspath(sys.argv[1]); F = json.load(open(f'{D}/film.json', encoding='utf-8')); slug = F['slug']
wav = f'{D}/out/final-audio.wav'
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', f'{D}/final/{slug}.mp4', '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
from faster_whisper import WhisperModel
m = WhisperModel(F.get('asr_model', 'small'), device='cpu', compute_type='int8')
segs, _ = m.transcribe(wav, language=F.get('asr_lang', 'id'), beam_size=5, word_timestamps=True)
heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
TL = json.load(open(f'{D}/timeline.json', encoding='utf-8'))
norm = lambda s: re.sub(r'[^\w ]', '', s.lower())
want = ' '.join(norm(v['text']) for v in TL['voice']).split(); got = [norm(w) for w, _, _ in heard]
sm = difflib.SequenceMatcher(None, want, got)
print('script words', len(want), '| heard words', len(got), '| word-level match ratio', round(sm.ratio(), 3))
miss = [(' '.join(want[a:b]), ' '.join(got[c:d])) for op, a, b, c, d in sm.get_opcodes() if op != 'equal']
print('differences (script -> heard):', miss[:15])
print('cue start vs first heard word of the line (cue_start - heard_start; want about -0.35..0.00; Whisper word times are only +/-0.2 s):')
for v, c in zip(TL['voice'], TL['cues']):
    first = norm(v['words'][0]['w']); cand = [h for h in heard if abs(h[1] - v['t0']) < 0.8 and norm(h[0]) == first] or [h for h in heard if abs(h[1] - v['t0']) < 0.8]
    print(f"  {v['id']}: cue {c['t0']:.2f} heard {cand[0][1]:.2f} delta {c['t0'] - cand[0][1]:+.2f}" if cand else f"  {v['id']}: no heard word near {v['t0']}")

# exact check: cue start vs the real voice onset measured in the voice-only stem (Whisper word times are not accurate enough for this)
import numpy as np, soundfile as sf
if os.path.exists(f'{D}/out/stem-voice.wav'):
    y, sr = sf.read(f'{D}/out/stem-voice.wav'); y = np.abs(y.mean(1) if y.ndim > 1 else y); d = []
    for k, (v, c) in enumerate(zip(TL['voice'], TL['cues'])):
        lo = max(v['t0'] - 0.2, TL['voice'][k - 1]['t1'] if k else 0); a = int(lo * sr); seg = y[a:a + sr]; d.append(c['t0'] - (np.argmax(seg > 0.02 * seg.max()) + a) / sr)
    print(f'cue start - real voice onset (stem): min {min(d):.2f} max {max(d):.2f} s over {len(d)} lines')
