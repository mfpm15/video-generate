"""mixlib.py: generic mixer. voice + foley (from picture events) + score + room tone -> out/mix.wav
Usage: python system/audio/mixlib.py <film-dir>      (reads film.json, timeline.json, events.json, voice/*.wav)

Four sound WORLDS (film.json "world"): neon (synth: whoosh, zaps, kick, saw bass + plucks + hats), glass (airy bells, soft whoosh, pad + bell plucks),
clay (boing, marimba, wood, pizzicato), cosmos (booms, risers, drones, sparse low plucks). Key, tempo and patterns vary per film (seed = crc32(slug)).

ANTI-DOUBLING RULES (enforced in code):
  1. One event type -> exactly one foley layer. The score never plays a pitched pluck within GUARD of a foley hit.
  2. Same event type closer than MIN_GAP[type] is dropped; at most MAX_PER_SEC foley sounds in any 1 s (lowest priority dropped first).
  3. Unknown event types are NOT sounded (no random effects); they are listed in the report.
  4. The score is ducked under the voice and dips under each foley hit.
Silences in timeline.json ("silences": [[a,b],...]) are digital zero on every track (>= 2 required by the brief)."""
import os, sys, json, zlib, numpy as np, soundfile as sf
from scipy.signal import resample_poly
from scipy.ndimage import uniform_filter1d
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from timbres import *

GUARD = 0.12; MAX_PER_SEC = 6
PRIORITY = {'scene': 4, 'emph': 3, 'open': 5, 'close': 5, 'impact': 5, 'riser': 4, 'item': 2, 'pop': 2, 'count': 1, 'ping': 1}
MIN_GAP = {'scene': .25, 'emph': .15, 'item': .12, 'pop': .14, 'ping': .3, 'count': .09, 'open': .5, 'close': .5, 'impact': .5, 'riser': .8}

# world palettes: event type -> (builder(e) -> [arrays], level, pan). One entry per type = one layer.
WPAL = {
    'neon': {'scene': (lambda e: [whoosh(.45, 400, 6000)], .30, 0), 'emph': (lambda e: [zap(900 + 150 * (e.get('i', 0) % 4))], .24, 0), 'item': (lambda e: [tick(1, 2100)], .24, 0),
             'pop': (lambda e: [zap(1500 + 100 * (int(e['t'] * 7) % 4))], .13, 0), 'ping': (lambda e: [glass(hz(88), .6, .5)], .12, 0), 'count': (lambda e: [tick(1, 2600)], .12, 0),
             'riser': (lambda e: [riser(1.5, .9)], .30, 0), 'impact': (lambda e: [kick(1), boom(.5, .8)], .40, 0), 'open': (lambda e: [riser(.9, .7), drop(.8)], .32, 0),
             'close': (lambda e: [glass(hz(69), 1, 1.6), glass(hz(76), 1, 1.6)], .24, 0)},
    'glass': {'scene': (lambda e: [whoosh(.5, 700, 9000, .8)], .22, 0), 'emph': (lambda e: [bell(hz(76 + (e.get('i', 0) % 3) * 2), 1, 1.2)], .22, 0), 'item': (lambda e: [bell(hz(81), .8, .5)], .14, 0),
              'pop': (lambda e: [bell(hz(84 + (int(e['t'] * 5) % 3) * 2), .8, .45)], .12, 0), 'ping': (lambda e: [glass(hz(93), .5, .7)], .10, 0), 'count': (lambda e: [tick(1, 3000)], .09, 0),
              'riser': (lambda e: [shimmer(1.5, .9)], .22, 0), 'impact': (lambda e: [boom(.6, .7), bell(hz(64), 1, 1.8)], .30, 0), 'open': (lambda e: [shimmer(1.2, .8), bell(hz(69), 1, 2)], .26, 0),
              'close': (lambda e: [bell(hz(64), 1, 2.2), bell(hz(71), 1, 2.2)], .22, 0)},
    'clay': {'scene': (lambda e: [boing(.9)], .22, 0), 'emph': (lambda e: [marimba(hz(76 + (e.get('i', 0) % 3) * 2), 1, .5)], .26, 0), 'item': (lambda e: [wood(220 + 25 * (e.get('i', 0) % 4))], .24, 0),
             'pop': (lambda e: [pop(1, 700 + 60 * (int(e['t'] * 7) % 4))], .17, 0), 'ping': (lambda e: [marimba(hz(88), .6, .3)], .12, 0), 'count': (lambda e: [wood(300)], .10, 0),
             'riser': (lambda e: [sweep(1.3, 300, 1500, .6)], .20, 0), 'impact': (lambda e: [drop(1, 70, 45, .5), felt(120, .6)], .34, 0), 'open': (lambda e: [boing(1), marimba(hz(76), 1, .6)], .26, 0),
             'close': (lambda e: [marimba(hz(69), 1, .9), marimba(hz(76), 1, .9)], .24, 0)},
    'cosmos': {'scene': (lambda e: [boom(.7, .9), whoosh(.6, 150, 2500, .5)], .26, 0), 'emph': (lambda e: [glass(hz(64 + (e.get('i', 0) % 3) * 3), 1, 1.0)], .22, 0), 'item': (lambda e: [felt(150, 1)], .22, 0),
               'pop': (lambda e: [felt(200 + 20 * (int(e['t'] * 7) % 4))], .15, 0), 'ping': (lambda e: [tick(1, 1600)], .10, 0), 'count': (lambda e: [tick(1, 1300)], .10, 0),
               'riser': (lambda e: [riser(1.6, .8)], .30, 0), 'impact': (lambda e: [boom(1, 1.4)], .42, 0), 'open': (lambda e: [riser(1.1, .7), boom(.8, 1.4)], .30, 0), 'close': (lambda e: [boom(1, 1.8)], .30, 0)},
}

def make_score(W, mus, DUR, SIL, ft, seedv):
    r = np.random.default_rng(seedv + 7); root = [45, 47, 48, 50, 52, 53][seedv % 6]; minor = [0, 3, 5, 7, 10]; major = [0, 2, 4, 7, 9]
    inSil = lambda t: any(a - .1 <= t <= b for a, b in SIL); near = lambda t: len(ft) and np.abs(ft - t).min() < GUARD
    if W == 'neon':
        b = 60 / (112 + seedv % 13); sc = [root + 12 + x for x in minor]; k = 0; t = 0.
        while t < DUR - .5:
            if not inSil(t):
                if k % 8 in (0, 3, 6): add(mus, saw_bass(hz(root), b * .45, 1), t, .20, 0)
                if k % 2 == 1: add(mus, hat(1), t, .10, float((k % 4 - 1.5) * .15))
                if k % 2 == 0 and k % 8 != 0 and not near(t): add(mus, pluck(hz(sc[(k * 3 + int(r.integers(0, 3))) % 5] + 12), .35, 1), t, .12, float((k % 3 - 1) * .3))
            t += b / 2; k += 1
        for bar in range(int(DUR / (b * 8)) + 1): add(mus, padnote2(hz(root + 12), b * 8 + 1, 1), bar * b * 8, .10, 0)
    elif W == 'glass':
        b = 60 / (96 + seedv % 9); sc = [root + 12 + x for x in major]; k = 0; t = 0.
        for bar in range(int(DUR / (b * 8)) + 1):
            for m in (root + 12, root + 16, root + 19): add(mus, padnote2(hz(m), b * 8 + 1.5, 1), bar * b * 8, .08, 0)
        while t < DUR - .5:
            if not inSil(t) and k % 2 == 0 and not near(t): add(mus, bell(hz(sc[int(r.integers(0, 5))] + 12), .8, 1.0), t, .10, float((k % 3 - 1) * .3))
            t += b; k += 1
    elif W == 'clay':
        b = 60 / (104 + seedv % 9); sc = [root + 24 + x for x in major]; k = 0; t = 0.; pat = [0, 2, 4, 2, 3, 1, 4, 3]
        while t < DUR - .5:
            if not inSil(t):
                if k % 4 == 0: add(mus, pluck(hz(root + 12), .4, 1), t, .16, 0)
                if k % 2 == 1 and not near(t): add(mus, marimba(hz(sc[pat[(k // 2) % 8]]), 1, .4), t, .12, float((k % 3 - 1) * .25))
            t += b / 2; k += 1
    else:
        b = 60 / (72 + seedv % 9); sc = [root + x for x in minor]; t = 0.; k = 0
        for bar in range(int(DUR / (b * 8)) + 1):
            for m in (root, root + 7, root + 12 + (3 if bar % 2 else 0)): add(mus, drone(hz(m), b * 8 + 2, 1), bar * b * 8, .16, 0)
        while t < DUR - .5:
            if not inSil(t) and k % 4 == 0 and not near(t): add(mus, pluck(hz(sc[int(r.integers(0, 5))] + 12), .9, 1), t, .12, float(r.uniform(-.3, .3)))
            t += b; k += 1

def mix_film(D):
    F = json.load(open(f'{D}/film.json', encoding='utf-8')); TL = json.load(open(f'{D}/timeline.json', encoding='utf-8'))
    EV = json.load(open(f'{D}/events.json'))['ev']; DUR = TL['dur']; SIL = TL.get('silences', []); N = int(DUR * SR)
    mood = F.get('mood', 'tech'); level = {'low': .6, 'medium': 1, 'high': 1.4}.get(F.get('sfx', 'medium'), 1)
    seedv = zlib.crc32(F['slug'].encode())
    W = F.get('world') or {'tech': 'neon', 'organic': 'clay', 'cinematic': 'cosmos'}.get(mood, 'neon'); pal = WPAL[W]
    vox = np.zeros((N, 2)); fol = np.zeros((N, 2)); mus = np.zeros((N, 2)); amb = np.zeros((N, 2))
    for L in TL['voice']:                                                            # voice
        y, sr = sf.read(f'{D}/voice/{L["id"]}.wav'); y = y if y.ndim == 1 else y.mean(1); y = resample_poly(y, SR, sr)
        add(vox, compress(y / (np.abs(y).max() + 1e-9) * .9, .3, 3.0), L['t0'], .9, 0)
    duck = np.ones(N); duckF = np.ones(N)
    for L in TL['voice']:
        s, e = int((L['t0'] - .08) * SR), int((L['t1'] + .22) * SR); duck[s:e] = 10 ** (-9 / 20); duckF[s:e] = 10 ** (-10 / 20)
    duck = uniform_filter1d(duck, int(.18 * SR)); duckF = uniform_filter1d(duckF, int(.10 * SR))
    kept, unknown, last, dropped = [], {}, {}, 0                                    # foley: map, dedupe, density-limit
    for e in sorted(EV, key=lambda e: e['t']):
        k = e['type']
        if k not in pal: unknown[k] = unknown.get(k, 0) + 1; continue
        if any(a <= e['t'] <= b for a, b in SIL): dropped += 1; continue
        if e['t'] - last.get(k, -9) < MIN_GAP.get(k, .1): dropped += 1; continue
        last[k] = e['t']; kept.append(e)
    final = []
    for e in kept:
        win = [x for x in kept if abs(x['t'] - e['t']) < .5]
        if len(win) > MAX_PER_SEC and sorted(win, key=lambda x: -PRIORITY.get(x['type'], 1))[:MAX_PER_SEC].count(e) == 0: dropped += 1; continue
        final.append(e)
    for e in final:
        build, v, pan = pal[e['type']]; xs = build(e); pn = pan() if callable(pan) else pan
        for j, x in enumerate(xs): add(fol, x, e['t'] + .012 * j, v * level * float(e.get('v', 1)), pn)
    ft = np.array([e['t'] for e in final]); make_score(W, mus, DUR, SIL, ft, seedv)
    dip = np.ones(N)
    for t in ft: dip[int(t * SR):int((t + .16) * SR)] = 10 ** (-5 / 20)
    dip = uniform_filter1d(dip, int(.05 * SR))
    fit = lambda x: np.pad(x, (0, max(0, N - len(x))))[:N]
    room = fit(lp(brown(DUR), 900)) * .04; amb[:, 0] += room; amb[:, 1] += np.roll(room, 37)
    mix = mus * .55 * (duck * dip)[:, None] + fol * .70 * duckF[:, None] + amb * (duck ** .5)[:, None] + vox
    z = np.ones(N)
    for a, b in SIL:
        ia, ib = int(a * SR), min(N, int(b * SR)); s0 = max(0, ia - int(.09 * SR)); z[s0:ia] = np.minimum(z[s0:ia], np.linspace(1, 0, ia - s0)); z[ia:ib] = 0
    mix *= z[:, None]
    for c in range(2): mix[:, c] = limit(mix[:, c], .93)
    os.makedirs(f'{D}/out', exist_ok=True); sf.write(f'{D}/out/mix.wav', mix.astype(np.float32), SR); sf.write(f'{D}/out/stem-voice.wav', vox.astype(np.float32), SR)
    rep = {'events': len(EV), 'sounded': len(final), 'dropped_by_rules': dropped, 'unmapped_types': unknown, 'mood': mood, 'world': W, 'sfx_level': level,
           'peak_dBFS': round(float(20 * np.log10(np.abs(mix).max())), 1), 'silences': SIL,
           'silence_peak': [round(float(np.abs(mix[int(a * SR) + 10:int(b * SR) - 10]).max()), 6) for a, b in SIL if int(b * SR) - 10 > int(a * SR) + 10]}
    json.dump(rep, open(f'{D}/out/mix-report.json', 'w'), indent=1); print(json.dumps(rep)); return rep

if __name__ == '__main__': mix_film(os.path.abspath(sys.argv[1]))
