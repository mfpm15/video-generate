# Integration with this video repository

These local rules take precedence over upstream workflow defaults for this repository. The toolkit's API/model schemas still apply.

## Routing and execution

- `/buat-anime` is the Indonesian intake command; `/make-an-anime` loads this project skill directly. `/buat-video` and `/buat-seri` continue to use Lemo-Opuscar unless the user explicitly requests the anime workflow.
- Use the current checkout root, never a hard-coded Windows drive. Keep the skill installation read-only during productions. Initialize each project under `anime/<slug>/`; do not initialize over the repo, `films/`, or an existing project.
- Use the Ruby CLI at `.claude/skills/make-an-anime/scripts/mv.rb`, with `--project` pointing at the anime project. A project skill does not install the upstream plugin's `anime` MCP server or sensitive option. The CLI uses `FAL_AI_API_KEY` from Claude Code's launching environment. Do not instruct the user to configure an uninstalled plugin. Never request, echo, commit or place the key in a prompt.
- Installing or studying this skill is not authorization for paid generation, media upload or `plan:approve`. First write a concrete plan with paid-call counts, retry allowance and costs, then obtain production authorization. Carry forward any actual bounded authorization already given; never invent it.
- The no-paid-API rule for ordinary Opuscar work remains in force. Fal is an explicit opt-in for anime production only.
- No publishing or external messages. Work serially for a short pilot; delegation is optional and must follow the user's scope and the host's available tools.

## Dynamic chat input

The user supplies the look, template, references and revisions in natural language in Claude Code. Accept free-form and mixed styles, not just presets. Never ask the user to open/edit a style file, YAML, JSON or renderer. The agent creates and updates all internal style/plan/prompt files automatically from the conversation; these files are production records, not required user-authored inputs. A clear style request needs no repeated catalog selection. For revisions, apply the latest requested look to affected shots while preserving unrelated approved choices; explain paid scope changes before running them.

Read [Quality and safe zones](quality-and-safe-zones.md) before planning and again before delivery. The user requires upstream-quality review and safe framing for both engines.

## Selected style is a production contract

- Resolve the requested style/template before production. If absent, offer a few concrete looks; do not choose one silently when the user has expressed a preference.
- A template is a reusable shot/overlay structure. An art style is the character design, linework, shading, palette, lighting, camera, motion, typography and sound direction. Do not claim they are equivalent.
- Write `config/style.md` as the style bible and `docs/STYLE-CONTRACT.md` with the selected name, source/reference, mode (`template` or `custom`), aspect ratio, fps, distinguishing visual features, constraints and a frame-review checklist. Include this in `docs/PLAN.md` before approval. Keep one style across the requested series.
- Bundled examples are workflow examples, not a catalog of supported art-style presets. Copy an example only when the user explicitly chooses it as a starting template; rewrite its cast, story, prompts and overlays for the user's brief.
- Use `{{STYLE}}` in image prompts. Read `prompts.md` for motion prompting: use a concise style sentence plus shot-specific light/location, not a whole multi-scene palette pasted into the motion prompt.
- Review representative keyframes before animating and compare finished shots against the style contract. Reject style drift within the approved retry allowance. Report any mismatch that remains; a preset name or changed palette is not evidence of fidelity.
- Default dialogue to the language of the user's brief. For this Shorts/Reels repository propose 9:16 and 24 fps, but preserve an explicitly selected template/aspect ratio. Configure and verify width/height in the project and provider schemas; never label 16:9 output as vertical. H3's generation resolution and a 1080p delivery export are separate facts.

## Capabilities and platform limits

The main workflow creates anime from a story, character/location sheets, keyframes and animated takes, then edits/composites them. Local tasks also cut, mux, concatenate and overlay existing footage. It is not a tested arbitrary live-action-video-to-anime filter. For that request, inspect the input, propose a shot-by-shot regeneration plan and explain what is reused versus generated before uploading or paying.

MiniMax H3 is the default video provider. Seedance is used only when explicitly requested. Ruby 3.2+, Bundler, FFmpeg/ffprobe, ImageMagick, Python 3, Node 22.12+ and Chrome/Chromium are required for the local media workflow. Swift/Core Image VFX is optional and macOS-only: skip it explicitly on Linux/WSL; never claim it ran. The runtime uses POSIX venv paths; use WSL on Windows unless native-Windows compatibility has been verified.

## Delivery and interoperability

Keep original/source media and clean anime output. Burn captions into the picture for repo deliverables; do not deliver an extra plain `.srt`. Include credits for the toolkit and generated/licensed assets, plan, style contract and honest QA evidence. Preserve the repository's `ngetehnology` branding using the anime overlay where applicable; Opuscar's brand renderer is not automatically executed here.

An anime output may be reused as an asset in a hand-authored Opuscar film, or an Opuscar clip may be edited locally using this toolkit. This requires explicit frame/aspect/fps/audio planning and a new output file. Do not run `system/build.sh` on an anime project or assume the two timeline formats are interchangeable. A bridge is not installed by copying this skill.
