# Original-quality baseline and danger-zone review

The user requires the upstream production standard, not a simplified look. Preserve identity consistency, detailed keyframes, believable motion/camera/contact, voice performance and reviewed lipsync, score/ducking, SFX, overlay and finishing. Do not silently downgrade provider, resolution, motion or encoding to finish faster. Establish a concrete visual baseline and inspect actual frames and normal-speed playback; synthetic toolkit tests do not verify generative quality.

Treat danger zones as both platform UI/crop regions and style-specific visual pitfalls. Derive target platforms and aspect ratio from the dynamic brief. Keep all critical text, captions, watermark, faces and actions clear of top UI, right-side controls and bottom posting/navigation UI, including crop variants. Measure final bounding boxes throughout animation/camera movement, not just anchors. Include stroke/shadow/glow and padding; prevent caption/title/face collisions. Background may bleed to the frame edges.

When no target mask exists, use a conservative portrait starting rectangle x=6%–82% of width, y=15%–72% of height for critical content, then validate against target UI. This is an internal fallback, not an official guarantee. Adapt it from the conversation/references automatically; never ask the user to edit a settings file. Check the longest captions, first/last frames, transitions, camera extremes and end card at phone size with a debug mask, then export a clean final.

Upstream `Steps::Shots` assembles 1920×1080 plates. A 9:16 request needs an actual Ruby project-side reframing/layout adjustment and new checks, not a metadata-only change or stretch. Explain this before paid vertical production. Swift VFX is optional on macOS only; do not claim to have applied it elsewhere. Do not confuse an export upscale with native detail.

In the containing video repository also read `system/QUALITY-GATES.md` for the shared baseline, tooling and legacy safe-zone limitations. Existing Opuscar caption margins do not validate anime overlays or faces.

Record in the QA report the baseline, inspected frame/clip paths, target safe rectangle/mask, measured format, failures, retakes and untested aspects. A frame review cannot establish sound/pacing/lipsync. If playback/listening is unavailable, mark it NOT TESTED and request human review in delivery. Do not label quality or safe zones verified without actual evidence. Fix failures within the approved retry allowance; an exhausted paid allowance requires a new concrete user decision.
