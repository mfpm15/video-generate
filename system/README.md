# system/: shared production code (edit here, never inside a film)

```
D:\content-video-generate
├─ CLAUDE.md  MASTER-PROMPT.md  START-HERE.md
├─ .claude/commands/buat-video.md      ← /buat-video: ONE video (title → one question → everything automatic)
├─ .claude/commands/buat-seri.md       ← /buat-seri: a series of 10-14 Shorts (one locked style, researched + fact-checked)
├─ series/<slug>/  series.json, RESEARCH.md, OUTLINE.md, FACTCHECK.md, pronunciation.json, posts/pNN.json, SCHEDULE.md, SERIES-REPORT.md
├─ films/<slug>/                       ← one folder per video, created automatically by new-film.sh
│   ├─ film.json    settings (size, fps, style, caption effect, sound mood, voice, palette)
│   ├─ lines.json   the script: one item per spoken line + the scene it shows
│   ├─ main.js      one line (imports system/lib/scenes.js) – or a hand-authored scene file (render: "custom")
│   ├─ final/       DELIVERABLES: <slug>.mp4, thumbnail.jpg (titled), POST.md (caption/hashtags/chapters), QA-REPORT.md, CREDITS (no .srt by user decision)
│   └─ voice/ out/ _lib/ fonts/ timeline.json events.json   GENERATED (clean.sh removes the heavy ones)
└─ system/
    ├─ new-film.sh   create a film folder    build.sh   build one film end to end    qa.sh   QA on the final mp4
    ├─ series.py     multi-part series (init, scaffold, build, status, schedule, clean)   thumb.sh   3 thumbnail variants
    ├─ review.sh     one frame per scene → out/review/sheet-*.jpg (look at them!)   clean.sh   free disk after DONE    make_catalog.py → styles-catalog.{md,json}  (66 styles from the library)
    ├─ lib/          captions.js (6 caption effects), scenes.js (template scene renderer), illus.js (13 illustrations + 28 icons)  → copied into films/<slug>/_lib at build
    ├─ audio/        mixlib.py (generic mixer, anti-doubling rules), timbres.py (original synthesis)
    ├─ py/           make_timeline.py (the ONE timeline), qa_asr.py, make_report.py
    ├─ tools/        sync-lib.sh, fonts.sh, qa-captions.mjs, caption-lab.mjs, audit/ (environment audit)
    ├─ template/     files copied into a new film (index.html, main.js stub)
    ├─ fonts/        Inter, Inter Tight, JetBrains Mono (OFL)         lab/  test pages (captions, webgl)     logs/  setup logs
```

## Daily use
Just type `/buat-video Judul` in Claude Code. It asks once (description + style), then does everything: research, script, build, visual review loop, QA, social pack. Manual steps below.
```
sh system/new-film.sh "Judul" --style <slug|nomor|AUTO> [--size 1080x1920] [--lang id|en] [--minutes 1.5]
# edit films/<slug>/lines.json  (or let Claude write it)
sh system/build.sh <slug>          # SKIP_VOICE=1 to reuse the voice (offline)
sh system/review.sh <slug>         # contact sheets of every scene
sh system/clean.sh <slug>          # after the film is finished
```

## Rules baked into the code (change them here, once)
- **One timeline** (`py/make_timeline.py`): voice starts, word times, caption cues, scene windows and silences. Scenes are stretched to the reading time `readcheck` requires. At least two real silences.
- **fps**: 60 if the style is a 60 fps style, else 30 (`new-film.sh`). Full HD: 1920x1080 default, 1080x1920 on request.
- **Captions**: effect from the style category (`make_catalog.py` → `film.json`); all six live in `lib/captions.js`; safe zones in `safeZone()`; per word, never per letter.
- **Sound** (`audio/mixlib.py`): one event type = one foley layer; same type closer than `MIN_GAP` dropped; max 6 sounds/s; score never plays on a foley hit and dips under it; unknown event types are not sounded; music ducked under voice. `mux.sh` does the −14 LUFS loudnorm (do not normalise again).
- **No plain .srt**: the animated caption is burned into the picture.
- **Reports are generated** from measurements (`py/make_report.py`). Anything needing ears or eyes is written as NOT TESTED.

## Two ways to make a film
1. **Template** (`render: "template"`): scenes from `lines.json` (title, statement, number, list, quote), palette/mood from the style category. Fast, consistent, *palette-inspired by the style, not the style's real rendering*.
2. **Custom** (`render: "custom"`): hand-authored `main.js` + optional own `mix.py`/`make_timeline.py` following the style's `STYLE.md` (see `films/kenapa-ai-pintar`). Same `build.sh`, same QA. Needed when the film must really look like the chosen style.

## Maintenance
- Upstream library `~/lemo-opuscar` is read-only for us. Update it with `git pull` there; re-run `python system/make_catalog.py` when styles change.
- After editing anything in `lib/` or `audio/`: run `node system/tools/caption-lab.mjs` (24 caption combos), then build one short film.
- Known: Whisper mishears some Indonesian words ("menebak"→"menembak", "router"); listen to flagged lines. A `say` field in lines.json changes how TTS reads a word; an `asr` field changes what the check expects.

## Scene vocabulary (template look)
Scene types: title, statement, number, list, quote. title/statement/quote can carry `visual:{kind,...}`: network, globe, cable, packets, bars, line, steps, neural, icons, ring, orbit, timeline, compare (parameters in the header of `lib/illus.js`). Every scene also gets drifting particles, an entrance light sweep, spark bursts + underline on `*emphasised*` words, and a progress bar along the top edge. `?thumb=1` renders the titled thumbnail.

## Series (`/buat-seri`)
One locked style per series (consistent look + series badge `BAGIAN n/N` top-left + end card `Berikutnya: Bagian n+1`). Parts are normal films `films/<series>-pNN/`. Flow: research (RESEARCH.md, >= 2 independent sources for key claims) -> outline -> scripts -> FACTCHECK.md -> `series.py build` (resumable, keeps Windows awake, retries once) -> visual review per part -> posts/pNN.json -> `series.py schedule` (POST.md per part + SCHEDULE.md, 2 posts/day suggestions). The user posts manually; nothing is auto-posted.
Thumbnails (`lib/thumb.js`): 3 variants (hero / giant keyword / numeral), `system/thumb.sh <slug> [variant]`, series badge, text <= 5 words.
Style looks in template mode: per-style accent colour + tinted background taken from each STYLE.md (46 distinct accents over 66 styles); layout, motion and illustrations are shared.

## 3D short-form engine (default since 2026-11-12)
`new-film.sh` now defaults to **9:16 1080x1920 and engine 3d**. `lib/e3d.js` (+ worlds.js, type3d.js, props3d.js, kinds3d.js, captionsShort.js) renders a three.js scene per film: world neon | glass | clay | cosmos (from the style), 3D word-by-word type, 26 props, 13 illustration kinds, per-scene camera moves, chunked captions inside the Shorts/Reels/TikTok safe zone (left 60, right 150, bottom limit 75 % of the height), per-world sound palettes. Scenes are built lazily and disposed to keep GPU memory small. Tools: `tools/texts3d.mjs` (projected text boxes), `tools/stills3d.sh` (quick stills), `review.sh`, `thumb.sh` (3D thumbnails, 3 variants, 9:16 only), `selftest.py`. The older flat 2D engine (`lib/scenes.js`) remains for `--engine 2d`.


## Skill anime dan pilihan style

Claude Code sekarang juga memiliki `/buat-anime` dan skill `/make-an-anime`; lihat [panduan anime](../docs/ANIME.md). Lemo-Opuscar tetap dipakai oleh `/buat-video` dan `/buat-seri`.

Sebelum produksi baca [kontrak template/style](STYLE-WORKFLOW.md). Renderer bersama 2D/3D di atas adalah template. Style resmi yang dipilih pengguna memerlukan implementasi custom berdasarkan STYLE.md dan review frame; nama style atau perubahan palet saja tidak membuktikan fidelity. Pilihan mode dan style dikunci untuk seluruh seri.
