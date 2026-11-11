"""lint_script.py <film-dir>: retention checklist for a script (lines.json + timeline.json). Prints PASS / WARN lines; never blocks the build.
Rules come from short-form retention practice (vendor-reported, directional): strong hook in the first seconds with a visual from frame 1, a visual/pattern change every ~3-5 s,
variety of visuals, one idea per line, facts/numbers shown, and an ending that loops back to the opening."""
import json, os, re, sys
D = os.path.abspath(sys.argv[1]); L = json.load(open(f'{D}/lines.json', encoding='utf-8'))
TL = json.load(open(f'{D}/timeline.json', encoding='utf-8')) if os.path.exists(f'{D}/timeline.json') else None
res = []; ok = lambda m: res.append(('PASS', m)); bad = lambda m: res.append(('WARN', m))
words = lambda s: re.findall(r"[\w'-]+", s, re.U)
scenes = []
for it in L:
    for sc in ([it['scene']] if isinstance(it.get('scene'), dict) else []) + list(it.get('beats') or []): scenes.append((it, sc))
first = L[0]; hw = len(words(first['text']))
(ok if hw <= 10 else bad)(f'hook length: {hw} words (want <= 10)')
filler = re.match(r'^(hari ini|halo|hai|selamat datang|pada kesempatan|di video ini|kali ini)', first['text'].strip().lower())
(bad if filler else ok)('hook opens without throat-clearing' if not filler else 'hook starts with filler ("hari ini", "halo", ...): cut it')
power = re.search(r'\?|\d|ternyata|bahaya|jangan|rahasia|salah|bohong|curi|gratis|tapi|kenapa|bagaimana|bisa', first['text'].lower())
(ok if power else bad)('hook has tension (question / number / contrast / stakes)' if power else 'hook lacks tension: add a question, number, contrast or stake')
f0 = (first.get('beats') or [first.get('scene') or {}])[0]
(ok if (f0.get('visual') or f0.get('type') == 'number') else bad)('first scene has a visual (frame 1 is not empty)' if (f0.get('visual') or f0.get('type') == 'number') else 'first scene has no visual')
lens = [len(words(i['text'])) for i in L]; off = [i['id'] for i, n in zip(L, lens) if not 5 <= n <= 18]
(ok if not off else bad)('lines are 5-18 words' if not off else f'lines outside 5-18 words: {off}')
vis = [s for _, s in scenes if s.get('type') not in ('number', 'list')]; cov = sum(1 for s in vis if s.get('visual')) / max(1, len(vis))
(ok if cov >= .7 else bad)(f'visual coverage {cov:.0%} (want >= 70%)')
kinds = [(s.get('visual') or {}).get('kind') for _, s in scenes]; rep = [i for i in range(1, len(kinds)) if kinds[i] and kinds[i] == kinds[i - 1]]
(ok if not rep else bad)('no visual kind repeated back-to-back' if not rep else f'same visual kind twice in a row at scenes {[r + 1 for r in rep]}')
nk = len(set(k for k in kinds if k)); (ok if nk >= min(6, max(3, len(scenes) // 3)) else bad)(f'{nk} distinct visual kinds')
nums = any(re.search(r'\d', i['text']) or re.search(r'\b(ratus|ribu|juta|miliar|persen|puluh)\b', i['text'].lower()) for i in L); hasnum = any(s.get('type') == 'number' for _, s in scenes)
(ok if (hasnum or not nums) else bad)('numbers are shown as a number scene' if hasnum or not nums else 'script mentions numbers but has no number scene')
if TL:
    sc = TL['scenes']; durs = [s['t1'] - s['t0'] for s in sc]; avg = sum(durs) / len(durs); slow = [s['id'] for s, d in zip(sc, durs) if d > 6.5 and (s.get('scene') or {}).get('type') != 'list']
    (ok if avg <= 5.2 else bad)(f'average scene {avg:.1f} s (want <= 5.2; use "beats" for long lines)')
    (ok if not slow else bad)('no scene longer than 6.5 s' if not slow else f'scenes longer than 6.5 s: {slow}')
    (ok if TL['dur'] <= 92 else bad)(f"duration {TL['dur']:.0f} s (Reels limit 90 s; series parts 35-60 s recommended)")
w1 = set(w.lower() for w in words(first['text']) if len(w) >= 5); w2 = set(w.lower() for w in words(L[-1]['text']) if len(w) >= 5)
(ok if (w1 & w2) else bad)('ending echoes the opening (loop)' if (w1 & w2) else 'ending does not echo a word of the hook: add a callback so the video loops')
post = os.path.exists(f'{D}/post.json'); (ok if post else bad)('post.json present' if post else 'post.json missing: CAPTION.txt/POST.md cannot be generated (write films/<slug>/post.json)')
for s, m in res: print(f'  [{s}] {m}')
print(f"script lint: {sum(1 for s, _ in res if s == 'WARN')} warning(s)")
