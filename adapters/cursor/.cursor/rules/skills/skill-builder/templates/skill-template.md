---
name: skill-template
description: Skeleton template for new Skills. When creating a new Skill, copy this template and replace [placeholders] with actual content. Required Sections must not be deleted. Recommended Sections should be kept or removed as needed. On-Demand Sections should be added based on actual circumstances.
version: 1.1.0
updated: 2026-06-04
---

# Skill Skeleton Template

When creating a new Skill, copy the content below, replace [placeholders], and delete any optional Sections that are not needed.

---

## Required Sections

```markdown
---
name: [skill-name]
description: [Decidable trigger: "Used when the user does X or says Y. Produces Z." Avoid "helps with" / "supports" / "assists with"]
version: 1.0.0
updated: [YYYY-MM-DD]
requires: []
---

[Task]
    [One sentence describing what this Skill does. If there are multiple modes, describe each.]

[Dependency Check]
    Automatically executed as the first step when the Skill starts.

    Required:
    - [prerequisite file] -> if missing, prompt to guide the user's next action
    - [system tool] -> if missing, the Agent installs autonomously

    Optional:
    - [optional dependency] -> if missing, mark degraded mode and continue working

    Installation strategy:
    - When a required dependency is missing or its version is insufficient, the Agent autonomously determines the installation method and installs directly
    - When user permission or user interaction is needed, prompt the user to take action
    - When an optional dependency is missing, mark degraded mode and do not block the flow

[First Principles]
    **[Principle Name]**: [One-sentence explanation]
    **[Principle Name]**: [One-sentence explanation]
    **[Principle Name]**: [One-sentence explanation]
    **Web-First**: When external knowledge is involved, WebSearch to confirm before acting.

[Not For]
    - [Scenario where this Skill should NOT be used, and what to use instead]
    - [Another exclusion boundary]

[File Structure]
    ```
    [skill-name]/
    ├── SKILL.md
    └── references/
        ├── first-principles.md       # (recommended) extracted from [First Principles]
        ├── dimension-checklist.md    # (recommended) must-have/recommended/optional
        ├── anti-rationalization.md   # (recommended) Rationalization|Reality table
        └── workflow.md               # (recommended) extracted from [Workflow]
    ```

[Quality Rubric]
    N-item, N*2-point scoring system. Ship threshold: **≥ T** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | [dimension] | 2 | YES/no | 2 = [best]; 1 = [acceptable]; 0 = [fail] |
    | ... | ... | ... | ... | ... |

    **Scoring**: Run `pnpm validate-skill --score core/skills/<name>` to compute.

[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`

    | Rationalization | Reality |
    |---|---|
    | "[common excuse for skipping steps]" | "[correct response]" |
    | "[another excuse]" | "[correct response]" |

[Workflow]
    [Step 1: XXX]
        [Specific action]

    [Step 2: XXX]
        [Specific action]

    [Step N: XXX]
        [Specific action]

[Initialization]
    Execute [Step 1: XXX]
```

## Recommended Sections

```markdown
[Output Style]
    → `references/output-style.md`
    **Tone**:
    - [Describe the speaking style of this Skill]

    **Principles**:
    - x [what NOT to do]
    - v [what TO do]

    **Typical Expressions**:
    - "[example sentence 1]"
    - "[example sentence 2]"

[XXX Dimension Checklist]
    → `references/dimension-checklist.md`
    [Name based on domain: Requirements Dimension Checklist / Review Dimension Checklist / Development Rule Checklist / ...]
    [List must-have items with must-have/recommended/optional tiers]

[XXX Strategy]
    [Name based on domain: Dialogue Strategy / Review Strategy / Development Strategy / ...]
    [Describe the execution methodology — how to do it]

[Quality Rubric]
    [N-item, N*2-point scoring system. Ship threshold with critical-item-zero rule.]
    [Include domain-specific scoring dimensions with 2/1/0 criteria.]

[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    [3-5 Rationalization|Reality pairs specific to this Skill's failure patterns.]

[Anti-ai-slop Checklist]
    → `references/anti-ai-slop-checklist.md`
    [7-9 item pass/fail self-check for output-producing skills. Pre-delivery only.]

[Gotchas]
    **Common Pitfall 1**: [What Claude gets wrong, and what to do instead]
    **Common Pitfall 2**: [Another failure point accumulated from practice]
    **Common Pitfall 3**: [Another lesson learned the hard way]
    Gotchas are the highest-signal content in a Skill. Add failure points as you discover them. If you're not adding to this section, you're repeating mistakes.
```

## On-Demand Sections

```markdown
[Information Sufficiency Check]
    Used by collection/analysis type Skills. Determines when enough information has been gathered to produce output.

    Must satisfy:
    - [condition]
    Nice to have:
    - [condition]

[Rollback Strategy]
    Used by release/deployment type Skills. How to roll back when things go wrong.

[Phase Completion Check]
    Used by development type Skills. Verification criteria for Phase completion.

[Multi-Mode Workflow]
    If the Skill has multiple execution modes, write each separately:
    [Workflow (Mode A)]
    [Workflow (Mode B)]
```

---

## Quick Reference

| Item | Convention |
|------|-----------|
| Skill name | kebab-case (e.g., skill-builder, dev-planner) |
| Directory location | skills/[skill-name]/ (relative to framework root) |
| Main file | SKILL.md |
| Reference files | references/ first-principles / dimension-checklist / anti-rationalization / workflow / output-style / anti-ai-slop |
| Template files | templates/ subdirectory (if any) |
| Section title | [Title] format |
| Content indentation | 4 spaces |
| Frontmatter | name, description, version, updated, requires |
| Language | Chinese |
| Required sections | Task, Dependency Check, First Principles, Not For, File Structure, Workflow, Initialization |
| Recommended sections | Output Style, Dimension Checklist, Quality Rubric, Anti-Rationalization, Anti-ai-slop, Strategy, Gotchas |
