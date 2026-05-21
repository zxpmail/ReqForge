# templates/ — Forge Output Templates

## Purpose
Templates are structured starting points for Forge's output artifacts. They ensure consistent format across projects and reduce the chance of missing required sections.

## Rules

### MUST
- Template names MUST end with `-template.md` (e.g., `product-spec-template.md`)
- Templates MUST use `[placeholder]` syntax for user-specific values
- Templates MUST include all sections that the corresponding Skill expects to fill

### MUST NOT
- Do NOT hardcode technology choices in templates — use `[tech-stack]` placeholders
- Do NOT include example data without marking it as `[example]` — AI might treat it as real content
- Do NOT create templates for artifacts that don't have a corresponding Skill

### SHOULD
- Include a comment at the top explaining which Skill uses this template
- Keep placeholders self-documenting: `[TBD: describe expected user flow]` not just `[TBD]`
