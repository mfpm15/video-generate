# Authored evaluation scene

Independent original 12s portrait 3D scene. This is a reproducible example, not a fixed style users must edit. New videos start with `/buat-video` and a dynamic description.

After root Setup-FreeLocal.ps1, run `npm ci` here to install the pinned Three.js/GSAP. Then use the root HyperFrames CLI to inspect/check/render index.html at 24fps, quality high. Follow the proposal/checkpoint approvals for production; the recorded evaluation was explicitly delegated by the user. Caption timing is 0–3/3–6/6–9/9–12 seconds. All render assets are local. No media API, narration or music.

This source uses 2× internal WebGL resolution, PBR materials and shadows. Do not silently reduce quality for speed. The cloud-only Mesa browser wrapper used for the comparative software-render test is not a Windows dependency and is not shipped. The Windows laptop still needs an actual pilot render and playback test.

For this sample, run `python finish.py raw.mp4 final.mp4` after rendering. The mandatory finisher enlarges studio/kicker/stage labels to 28px and adds a contrasting stage badge, then encodes at CRF16 with silent AAC. The raw HyperFrames check correctly reports small-label/contrast warnings; they are resolved in this final finishing step, not hidden or waived. The intentional canvas-edge warning is retained.

Final delivery requires FFmpeg to create H264 yuv420p, limited BT709, SAR1, AAC and faststart; inspect input colors and actually convert the matrix/range where necessary before setting metadata. `scripts/verify-local-mp4.py` in the repo checks the encoded delivery and full decode; it does not judge art. See CREDITS and assets/Inter-OFL.txt and THREE-LICENSE.txt.
