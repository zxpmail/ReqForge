---
description: Create a new Forge Skill with consistent structure
argument-hint: "[skill-name]"
---

# Command: /skill-builder

New Skill creation workflow. Full procedure in SKILL.md.

## Phase 1: Scaffold
**Goal**: Create skill directory and SKILL.md skeleton
- Read template from core/templates/skill-template.md
- Read 1-2 existing skills for style consistency
- Scaffold: `core/skills/<name>/SKILL.md` + `skill.json` + `commands/`
- **Acceptance**: All required files created, structure matches conventions

## Phase 2: Content
**Goal**: Fill all required sections
- [Task], [Not For], [Dependency Check], [First Principles], [Output Style]
- [File Structure], [Workflow], [Gotchas], [Initialization]
- Write decidable trigger description in frontmatter
- **Acceptance**: All 7 mandatory sections populated

## Phase 3: Quality Check
**Goal**: Score against 16 quality criteria (32-point scale)
- Minimum score 24/32 to pass
- Check: decidable triggers, action-forcing language, anti-rationalization checklist
- **Acceptance**: Quality score ≥ 24, user confirms new skill
