---
description: Build, audit, and publish project to target channel
argument-hint: "[channel: web|desktop|cli]"
---

# Command: /release-builder

Entry: `/release-builder [channel]`. **Full workflow → `SKILL.md`**.

| Phase | SKILL.md | Acceptance |
|-------|----------|------------|
| Build | Version & build | Artifact builds clean |
| Preflight | `pnpm preflight --build-dir …` | Exit 0; `.forge/preflight.json` rules pass |
| Audit | Security | No secrets in artifact |
| Smoke | Smoke test | Installed build works |
| Publish | Publish | Deployed / tagged per channel |
