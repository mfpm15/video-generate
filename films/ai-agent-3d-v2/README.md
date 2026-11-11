# AI Agent — custom Glass Signal 3D

Original fictional AI core, 12 seconds, 1080x1920 at 24fps, authored Indonesian captions and intentional silent AAC. Three.js renders real geometry/object/camera motion with 2x internal geometry supersampling. This is code rendering, not a text-to-video model.

Set LIB to a prepared official Lemo-Opuscar library and run `sh build.sh`. For this Linux cloud's software GPU, the verified invocation is `LIBGL_ALWAYS_SOFTWARE=1 LEMO_ANGLE=gl-egl sh build.sh`; a supported laptop should use its normal hardware backend. PLAYWRIGHT_CHROME can point to installed Chrome. Do not copy the cloud's sandbox-disabling browser wrapper to a laptop.

The native renderer writes a high-quality limited-range BT601 intermediate; build.sh converts real pixel values to limited BT709 before tagging them, rather than relabeling the colors. Final is H264 High level4.1, yuv420p, SAR1, silent AAC and faststart. SKIP_RENDER=1 reruns only mux/delivery from an existing completed intermediate.

STYLE-CONTRACT.md documents the custom direction's differences from the original Glass Product Render shader demo. CREDITS and UPSTREAM-LICENSE preserve attribution. Actual text-bound measurements and browser playback are technical evidence; artistic acceptance remains the user's judgment.
