---
description: Build, audit, and publish project to target channel
argument-hint: "[channel: web|desktop|cli]"
---

# Command: /release-builder

Entry: `/release-builder [channel]`. **Full workflow → `references/workflow.md`**.

| Phase | Reference | Acceptance |
|-------|-----------|------------|
| Gather | workflow.md Step 1 | Project type + channel known |
| Build | workflow.md Step 3 | Artifact in `[BUILD_DIR]` |
| Preflight | workflow.md Step 3b | `pnpm preflight` exit 0 |
| Audit | release-checklist.md | No secrets in artifact |
| Smoke | workflow.md Step 6 | Installed build works |
| Publish | release-strategy.md | Deployed / tagged per channel |
