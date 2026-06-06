# Skill Quality Dimension Checklist

[Dimension Checklist]

| Tier | Dimension | Criteria |
|------|-----------|----------|
| **Must-Have** | Decidable Triggers | description specifies when to use AND when not to use; clear boundary conditions |
| **Must-Have** | Workflow Executability | Each step specifies concrete action; "figure it out" is not a step |
| **Must-Have** | Gotchas from Practice | ≥3 specific failure points with "what to do instead" guidance |
| **Must-Have** | Boundary Clarity | [Not For] section with explicit exclusion conditions; prevents misrouting |
| **Must-Have** | Dependency Check | Required deps have failure guidance; optional deps have degraded mode |
| **Must-Have** | Output Artifacts Listed | Explicit artifact list with file paths; no "TBD" items |
| **Recommended** | First Principles | 3-5 domain-specific principles with concrete implications |
| **Recommended** | Anti-Rationalization | ≥3 rationalizations enumerated with correct response |
| **Recommended** | Dimension Checklist | Domain checklist with must-have/recommended/optional tiers |
| **Recommended** | Quality Rubric | Scoring dimensions with ship threshold and critical-item-zero rule |
| **Recommended** | Eval Packs | `eval/triggers.json` (4 cases: 2 positive + 2 near-miss) and `eval/cases.json` (output assertions) |
| **Optional** | Cross-Reference Consistency | Workflow references Strategy, Strategy references Checklist |
| **Optional** | Template Alignment | Follows skill-template.md structure |
| **Optional** | File Size Discipline | SKILL.md ≤500 lines |
