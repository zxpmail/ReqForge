---
description: Scan feedback and generate evolution proposals for rule/skill upgrades
argument-hint: ""
---

# Command: /evolution-engine

Entry: `/evolution-engine` (usually via evolution-runner). **Full workflow → `SKILL.md`**.

| Phase | SKILL.md | Acceptance |
|-------|----------|------------|
| Scan | Feedback scan | Index processed; read `failure_class` when present |
| Detect | Signal detection | 3+ repeats / low scores / new patterns |
| Propose | Proposal generation | Each proposal has RED + GREEN + Predicted effect + Verify by; missing RED/Verify by omitted |
| Confirm | Post-confirmation | User Confirm/Skip; run Verify by after apply |
