# Upstream provenance

- Repository: https://github.com/makevoid/claude-make-an-anime
- Commit: `adc1a76eb4e77df47f42160c2c166350a76ad849`
- Plugin version at import: `0.6.0`
- License: MIT, copyright (c) 2026 makevoid; retained in `LICENSE` and `scripts/LICENSE`.
- Imported: the complete `skills/make-an-anime/` tree (instructions, references, assets, four examples, Ruby toolkit, media backends, lockfiles and tests).
- Local changes: `SKILL.md` links to `references/repository-integration.md`; that reference defines repository defaults and standalone credential handling. Runtime source and upstream dependency lockfiles are unchanged.
- Plugin/marketplace manifests are intentionally not installed: this is a project skill discovered through `.claude/skills/`, using the standalone Ruby CLI. No global Claude configuration or MCP registration is needed.

To update, inspect an upstream diff against this commit, preserve the repository integration reference and entry link, retain the license copies, and rerun the core and supported media tests. Do not copy `.git`, credentials, installed dependencies or generated outputs.
