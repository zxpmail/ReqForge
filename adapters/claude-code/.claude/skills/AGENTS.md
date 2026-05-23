# skills/ — Forge Skill Definitions

## Purpose
Each subdirectory is an independent Skill with a `SKILL.md` as the entry point. Skills are the Guidance Layer of the Harness — they define methodology, workflow, and acceptance criteria for each development stage.

## Structure Convention
```
<skill-name>/           # kebab-case, lowercase
├── SKILL.md            # Required. Main skill definition
└── templates/          # Optional. Output templates for the skill
```

## Rules

### MUST
- Directory name MUST be kebab-case (e.g., `bug-fixer`, `dev-builder`)
- Every Skill MUST have a `SKILL.md` with frontmatter (`name` + `description`)
- Every Skill MUST have a `skill.json` with metadata (name, version, description, triggers, prerequisites)
- `SKILL.md` MUST include sections: [Task], [Dependency Check], [First Principles], [Not For], [File Structure], [Workflow], [Gotchas], [Initialization]
- `description` in frontmatter MUST be decidable — specify when to use, not just what it does (e.g., "Used when user reports error/bug" not "Helps with bugs")
- Templates MUST use `*-template.md` naming
- Skill commands MUST live in `commands/<name>.md` with frontmatter (description, argument-hint) when the skill exposes a slash command (`triggers.command`)

### MUST NOT
- Do NOT create implicit cross-skill dependencies — skills should not rely on hidden file paths or script side-effects from other skill directories
- Do NOT put executable scripts in skill directories — scripts belong in `scripts/` at repo root
- Do NOT hardcode absolute paths in SKILL.md — use relative paths from the user's project root
- Do NOT duplicate workflow steps that belong in another skill — reference by name instead

### SHOULD
- Include `[Output Style]` section with tone, principles, and typical expressions
- Include `[Gotchas]` section with domain-specific failure points
- Keep SKILL.md under 500 lines — if longer, split into sub-workflows or move detail to templates
- Use `!command` references for dynamic context when applicable
