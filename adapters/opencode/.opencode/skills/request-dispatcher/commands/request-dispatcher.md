---
description: Route ambiguous user requests to the correct Forge Skill
---

# Command: /request-dispatcher

Entry: `/request-dispatcher`. Analyzes user intent + project state → recommends target Skill.

| Step | Action |
|------|--------|
| 1 | Read user request, scan project state (Product-Spec, DEV-PLAN, code, active changes) |
| 2 | Apply [Dispatch Decision Strategy] from SKILL.md |
| 3 | Present recommendation with reasoning, or route directly if unambiguous |

**Full workflow → `SKILL.md`.**
