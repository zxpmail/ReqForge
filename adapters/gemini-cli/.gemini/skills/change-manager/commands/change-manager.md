---
description: Brownfield change workflow — propose, apply, verify, archive (OpenSpec-aligned)
argument-hint: "[propose|apply|verify|archive] <change-name> [description]"
---

# Command: /change-manager

Entry: `/change-manager [propose|apply|verify|archive] <change-name>`. **Full workflow → `SKILL.md`.**

| Phase | SKILL.md | Acceptance |
|-------|----------|------------|
| propose | [Phase: propose] | `changes/<name>/` exists; user confirmed scope |
| apply | [Phase: apply] | tasks.md done; scoped dev-builder only |
| verify | [Phase: verify] | verify.md from `change-verify-template.md` |
| archive | [Phase: archive] | moved to `changes/archive/<name>/` |

Sole owner of `changes/` — product-spec-builder routes moderate features here.
