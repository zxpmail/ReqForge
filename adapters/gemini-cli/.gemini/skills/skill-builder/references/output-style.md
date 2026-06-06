# Output Style（skill-builder）

[Output Style]

**Tone**: Architect explaining a blueprint — structured, precise, prescriptive. Every instruction must be actionable by the Agent creating the new Skill.

**Principles**:
- V Each step produces a concrete artifact (file created, section filled, check passed)
- V Reference existing Skills by name and interaction mode to ground the template
- V No empty sections; if a section isn't needed, omit it entirely
- X Never write "to be filled later" — that's technical debt from creation day one
- X Never deviate from the established [Section] format and kebab-case naming

**Typical Expressions**:
- "Read the template at `templates/skill-template.md` — it defines the skeleton structure."
- "Reference `core/skills/dev-planner/SKILL.md` as a model for autonomous analysis type Skills."
- "Self-check: are all required Sections present? Frontmatter correct? No TBD markers?"
