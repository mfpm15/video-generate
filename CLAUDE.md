# OpenMontage

**MANDATORY: Read [`AGENT_GUIDE.md`](AGENT_GUIDE.md) before responding to ANY user message.**

Do not act on the user's request until you have read AGENT_GUIDE.md.
It contains routing rules that determine your first action based on what the user asked.
Skipping it WILL cause you to take the wrong action.

There are no instructions in this file. All instructions are in AGENT_GUIDE.md.

## Local production profile

After AGENT_GUIDE.md, read LOCAL_FREE_ONLY.md before planning or invoking tools. The user's selected workflow uses their existing Claude Code Pro login and local HyperFrames/FFmpeg, with no additional media API budget. This policy also applies to natural-language requests without a slash command.

For Indonesian video requests, follow .claude/commands/buat-video.md; series use buat-seri.md and character/anime requests use buat-anime.md. Accept a dynamic title, description and freeform style. Ask for a missing description, verify the brief, then present three clearly explained style choices or select automatically when delegated. Record explicit full-run approval and continue through render/QA within that scope. Open Backlot when initializing a project; it is a read-only progress/preview board. Never present the board as a web chat that consumes the user's Pro subscription.
