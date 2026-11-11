"""make_timeline.py <film-dir>: the ONE timeline. Reads film.json + lines.json + voice/dur.json + voice/words.json (real audio timing)
and writes timeline.json: voice starts, word times, caption cues, scene windows, silences. Nothing here is hand-timed.
lines.json item: {"id","text","scene":{...} | "beats":[{"at":0,...scene},{"at":<word index>,...scene}],"pause":0.35,"silence":0}   pause = gap before the line; silence = extra digital-zero window before it (s).
Silences: every "silence" > 0, plus the last 0.5 s, plus (if fewer than 2) one 0.8 s window before the middle line."""
import json, os, sys
D = os.path.abspath(sys.argv[1]); F = json.load(open(f'{D}/film.json', encoding='utf-8'))
lines = json.load(open(f'{D}/lines.json', encoding='utf-8')); dur = json.load(open(f'{D}/voice/dur.json')); words = json.load(open(f'{D}/voice/words.json', encoding='utf-8'))
if sum(1 for L in lines if L.get('silence')) + 1 < 2 and len(lines) > 2: lines[len(lines) // 2]['silence'] = 0.8
def need(sc, beat=False):   # reading time the scene's texts require (readcheck rule: chars/15 + 1.5 s pad), so a scene is never cut short
    if not sc: return 0
    parts = [sc.get('head', ''), sc.get('sub', ''), sc.get('label', ''), sc.get('by', '')] + list(sc.get('items', [])) + ([f"{sc['value']:,}"] if 'value' in sc else [])
    base = max([len(x.replace('*', '').replace(' ', '')) / 15 + PAD for x in parts if x] + ([2.6 if beat else 4.2] if sc.get('visual') else []) or [0]) + 0.2
    items = sc.get('items') or []
    if items and 'kind' not in (sc.get('visual') or {}):   # list rows slide in one by one (0.9 s + 0.55 s each): the last one still needs its full reading time
        base = max(base, 1.4 + 0.55 * (len(items) - 1) + max(len(x.replace(' ', '')) / 15 + PAD for x in items) + 0.3)
    return base   # a scene with an illustration stays at least 4.2 s (2.6 s for a beat) so it can play out
PAD = 1.0 if F.get('engine') == '3d' else 1.5   # reading pad (s): short-form text is a reinforcement of the burned-in caption
t, sil, voice, notes, hold = 0.6, [], [], [], 0.0
for L in lines:
    i = L['id']; t = max(t + L.get('pause', 0.35), hold)
    if L.get('silence'): sil.append([round(t, 3), round(t + L['silence'], 3)]); t += L['silence'] + 0.15
    d = dur[i]; t0 = round(t, 3); disp = L['text'].split(' '); wt = words.get(i) if isinstance(words, dict) else None
    if wt and len(wt) == len(disp):
        ws, prev = [], 0.0
        for (w, s, e) in wt: s = max(0.0, s, prev); e = max(s + 0.05, min(e, d)); ws.append([s, e]); prev = s
        wa = [{'w': disp[k], 't0': round(t0 + s, 3), 't1': round(t0 + max(e, min(ws[k + 1][0] if k + 1 < len(ws) else d, e + .25)), 3)} for k, (s, e) in enumerate(ws)]
    else:
        notes.append(f'{i}: whisper tokens != words; even split used (LIMITED word timing)')
        wa = [{'w': w, 't0': round(t0 + d * k / len(disp), 3), 't1': round(t0 + d * (k + 1) / len(disp), 3)} for k, w in enumerate(disp)]
    beats = [dict(b) for b in L['beats']] if L.get('beats') else [dict(L.get('scene') or {}, at=0)]
    starts = [0.0 if not voice else round(t0 - 0.35, 3)]
    for b in beats[1:]: starts.append(max(starts[-1] + 1.6, round(wa[min(len(wa) - 1, int(b.get('at', 0)))]['t0'] - 0.12, 3)))
    for j in range(len(beats) - 1):
        if starts[j + 1] - starts[j] < need({kk: vv for kk, vv in beats[j].items() if kk != 'at'}, True) - 0.3: notes.append(f"{i} beat {j + 1}: only {starts[j + 1] - starts[j]:.1f} s for its text (move 'at' later or shorten the text)")
    voice.append({'id': i, 'text': L['text'], 't0': t0, 'dur': d, 't1': round(t0 + d, 3), 'words': wa, 'scene': {kk: vv for kk, vv in beats[0].items() if kk != 'at'}, 'beats': beats, 'starts': starts}); t = t0 + d
    hold = starts[-1] + need({kk: vv for kk, vv in beats[-1].items() if kk != 'at'}, len(beats) > 1) + 0.35
DUR = round(t + 1.2, 2); sil.append([round(DUR - 0.5, 2), DUR])
cues = []
for k, v in enumerate(voice):
    a = round(v['t0'] - .10, 3); b = round(max(v['t1'] + .6, a + 1.8), 3)
    if k + 1 < len(voice): b = min(b, round(voice[k + 1]['t0'] - .12, 3))
    cues.append({'t0': a, 't1': b, 'text': v['text'], 'id': v['id']})
scenes = []
for k, v in enumerate(voice):
    s_end = DUR if k + 1 == len(voice) else round(voice[k + 1]['t0'] - .35, 3)
    for j, bt in enumerate(v['beats']):
        scenes.append({'id': v['id'] if len(v['beats']) == 1 else f"{v['id']}b{j + 1}", 'line': k, 't0': v['starts'][j], 't1': v['starts'][j + 1] if j + 1 < len(v['beats']) else s_end, 'scene': {kk: vv for kk, vv in bt.items() if kk != 'at'}})
for s in scenes:   # a scene must not cover a digital-zero window start: keep as is (picture may continue in silence)
    pass
json.dump({'dur': DUR, 'fps': F['fps'], 'silences': sil, 'voice': voice, 'cues': cues, 'scenes': scenes}, open(f'{D}/timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'timeline: {DUR}s, {len(voice)} lines, silences {sil}'); [print('NOTE', n) for n in notes]
