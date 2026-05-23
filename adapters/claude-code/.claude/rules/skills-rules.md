---
description: Rules for editing Forge skill definitions
globs:
  - "core/skills/**"
  - ".claude/skills/**"
---

# Skills Directory Rules

- Directory name MUST be kebab-case (e.g., `bug-fixer`, `dev-builder`)
- Every Skill MUST have a `SKILL.md` with frontmatter (`name` + `description`)
- Every Skill MUST have a `skill.json` with metadata (name, version, description, triggers, prerequisites)
- Skill commands MUST live in `commands/<name>.md` with frontmatter (description, argument-hint)
- `description` in frontmatter MUST be decidable — specify when to use, not just what it does
- SKILL.md MUST include sections: [Task], [Dependency Check], [First Principles], [File Structure], [Workflow], [Gotchas], [Initialization]
- Keep SKILL.md under 500 lines — if longer, split into sub-workflows or move detail to templates
- Do NOT create implicit cross-skill dependencies — skills should not rely on hidden file paths from other skill directories
- Do NOT put executable scripts in skill directories — scripts belong in `scripts/` at repo root
- After changing any SKILL.md, run `pnpm sync` to propagate to all adapters
