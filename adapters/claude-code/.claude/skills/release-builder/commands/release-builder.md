---
description: Build, audit, and publish project to target channel
argument-hint: "[channel: web|desktop|cli]"
---

# Command: /release-builder

Entry: `/release-builder [channel]`. **Full workflow → `SKILL.md`**.

| Phase | SKILL.md | Acceptance |
|-------|----------|------------|
| Build | Version & build | Artifact builds clean |
| Audit | Security | No secrets in artifact |
| Smoke | Smoke test | Installed build works |
| Publish | Publish | Deployed / tagged per channel |
