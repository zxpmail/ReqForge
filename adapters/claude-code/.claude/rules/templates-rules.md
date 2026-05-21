---
description: Rules for editing Forge output templates
globs:
  - "core/templates/**"
  - ".claude/templates/**"
---

# Templates Directory Rules

- Template names MUST end with `-template.md` (e.g., `product-spec-template.md`)
- Templates MUST use `[placeholder]` syntax for user-specific values
- Templates MUST include all sections that the corresponding Skill expects to fill
- Do NOT hardcode technology choices in templates — use `[tech-stack]` placeholders
- Do NOT include example data without marking it as `[example]` — AI might treat it as real content
- Do NOT create templates for artifacts that don't have a corresponding Skill
- Include a comment at the top explaining which Skill uses this template
- Keep placeholders self-documenting: `[TBD: describe expected user flow]` not just `[TBD]`
