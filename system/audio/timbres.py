"""timbres.py: shared sound building blocks (original synthesis on top of the library's core/audio/sfx helpers).
No samples, nothing third-party. Imported by mixlib.py and by film-specific mix.py files."""
import os, sys, numpy as np
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, add, compress, limit
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def sine(f, d, tau, ph=0.0): return np.sin(2 * np.pi * f * t_(d) + ph) * env_exp(d, tau)
def fade(x, a=.004, b=.01):
    n = len(x); i = min(int(a * SR), n // 2); o = min(int(b * SR), n // 2); x = x.copy()
    if i: x[:i] *= np.linspace(0, 1, i)
    if o: x[-o:] *= np.linspace(1, 0, o)
    return x

# ─────────── timbres (own code, built on sfx helpers) ───────────
def tick(v=1.0, f=2100):                    # clean UI tick
    d = .03; return norm(bp(noise(d), 1500, 3400) * env_exp(d, .0025) + sine(f, d, .004) * .6) * v
def felt(f=320, v=1.0):                     # felt tock (the model's material)
    d = .12; return norm(sine(f, d, .03) + lp(noise(d), 1400) * env_exp(d, .006) * .6 + sine(f * 2.01, d, .012) * .3) * v
def glass(f, v=1.0, d=.9, bright=1.0):      # glass ting
    x = sine(f, d, d * .35) + sine(2 * f, d, d * .18) * .3 * bright + sine(2.76 * f, d, d * .1) * .18 * bright + hp(noise(d), 5000) * env_exp(d, .002) * .2
    return fade(norm(x) * v, .002, .05)
def marimba(f, v=1.0, d=.5):
    return fade((sine(f, d, .16) + .4 * sine(4 * f, d, .04) + .12 * sine(10 * f, d, .015)) * v, .002, .03)
def vibes(f, v=1.0, d=1.2):
    x = (sine(f, d, .7) + .18 * sine(4 * f, d, .25)) * (1 + .12 * np.sin(2 * np.pi * 4.8 * t_(d)))
    return fade(x * v, .003, .08)
def pop(v=1.0, f=900):
    d = .12; tt = t_(d); fr = f * (1 + .6 * np.exp(-tt / .01)); return norm(np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(d, .03)) * v
def plop(v=1.0):
    d = .08; tt = t_(d); f = 320 * (1 - .5 * tt / d); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .02) + bp(noise(d), 2000, 6000) * env_exp(d, .003) * .4) * v
def flick(v=1.0):
    d = .09; return norm(bp(noise(d), 2200, 7500) * np.sin(np.pi * t_(d) / d) ** .6 * env_exp(d, .05)) * v
def drop(v=1.0, f0=55, f1=40, d=.55):       # felt mallet + sine drop: the "press"/"hit" weight
    tt = t_(d); f = f1 + (f0 - f1) * np.exp(-tt / .12); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .18)
    m = felt(110, .5); x[:len(m)] += m[:len(x)] * .6
    return fade(norm(x) * v, .001, .04)
def sweep(d, f0, f1, v=1.0):
    tt = t_(d); f = f0 * (f1 / f0) ** (tt / d); return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * v * np.sin(np.pi * tt / d) ** .8, .01, .03)
def shimmer(d=1.4, v=1.0):
    n = bp(noise(d), 3000, 9000) * np.sin(np.pi * t_(d) / d) ** 2; return norm(n + sum(sine(f, d, d * .5) * .15 for f in (1760, 2217, 2637))) * v

# ── extra timbres for non-tech palettes ──
def wood(f=190, v=1.0):                     # organic tap
    d = .10; return norm(sine(f, d, .025) + bp(noise(d), 600, 2500) * env_exp(d, .006) * .7) * v
def paper(v=1.0):                           # paper / cloth swish
    d = .16; return norm(bp(noise(d), 1800, 6500) * np.sin(np.pi * t_(d) / d) ** .7) * v
def bell(f, v=1.0, d=1.4):                  # softer than glass
    x = sine(f, d, d * .4) + sine(2.0 * f, d, d * .2) * .25 + sine(3.0 * f, d, d * .1) * .1
    return fade(norm(x) * v, .003, .08)
def boom(v=1.0, d=1.2):                     # cinematic low impact
    tt = t_(d); f = 38 + 60 * np.exp(-tt / .09); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .35) + lp(noise(d), 300) * env_exp(d, .05) * .5
    return fade(norm(x) * v, .001, .08)
def riser(d=1.0, v=1.0):                    # filtered-noise riser, ends before the beat it announces
    tt = t_(d); n = bp(noise(d), 500, 7000) * (tt / d) ** 2; return fade(norm(n) * v, .02, .02)

# ── v2 timbres (worlds: neon / glass / clay / cosmos) ──
def whoosh(d=.5, f0=300, f1=5000, v=1.0):         # airy pass-by: band-passed noise swelling and fading
    tt = t_(d); x = bp(noise(d), f0, f1) * np.sin(np.pi * tt / d) ** 1.6; return fade(norm(x) * v, .02, .06)
def zap(f=1200, v=1.0):                           # digital blip with a falling pitch
    d = .12; tt = t_(d); fr = f * (1 + 1.4 * np.exp(-tt / .02)); return fade(norm(np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(d, .04)) * v, .001, .02)
def kick(v=1.0):
    d = .38; tt = t_(d); f = 42 + 130 * np.exp(-tt / .03); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .13) + hp(noise(d), 3000) * env_exp(d, .004) * .12; return fade(norm(x) * v, .001, .04)
def hat(v=1.0):
    d = .05; return norm(hp(noise(d), 7000) * env_exp(d, .011)) * v
def saw_bass(f, d=.3, v=1.0):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 7)); return fade(lp(x, 900) * env_exp(d, d * .6) * v, .003, .05)
def pluck(f, d=.5, v=1.0):
    return fade((sine(f, d, .18) + .5 * sine(2 * f, d, .1) + .25 * sine(3 * f, d, .06)) * v, .002, .03)
def boing(v=1.0):
    d = .32; tt = t_(d); f = 320 * (1 + .8 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt / .12)); return fade(norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .1)) * v, .002, .03)
def drone(f, d, v=1.0):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * (1 + dt) * tt) for dt in (0, .004, -.005)) / 3 + .5 * np.sin(2 * np.pi * f / 2 * tt); return lp(x, 700) * np.minimum(1, tt / 1.5) * np.minimum(1, (d - tt) / 1.5) * v
def padnote2(f, d, v=1.0):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * (1 + dt) * tt) for dt in (0, .003, -.004)) / 3; return lp(x, 1500) * np.minimum(1, tt / 1.2) * np.minimum(1, (d - tt) / 1.2) * v
