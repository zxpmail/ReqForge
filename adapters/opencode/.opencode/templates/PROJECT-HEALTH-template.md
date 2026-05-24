---
name: project-health-template
description: Auto-updated project status snapshot after each Phase completes. One-screen context for new sessions — complements memory/ without replacing it.
---

# PROJECT-HEALTH

> Last updated: [ISO date] · Phase [N] complete  
> Regenerate after each Phase four-step verification passes. **User projects only** — ReqForge framework repo typically skips this file.

---

## At a glance

| Signal | Status |
|--------|--------|
| **Overall** | 🟢 On track / 🟡 At risk / 🔴 Blocked |
| **Primary metric** (current Phase) | [command] → [pass/fail one line] |
| **Spec coverage** | [X/Y checklist items implemented] |
| **Tests** | [last command] → [N passed / failed] |
| **Open Must-fix** (from last review) | [0 or count + top item] |

---

## Spec completion (current scope)

| Area | Done | Notes |
|------|------|-------|
| [Feature or Phase name] | ✅ / ⚠️ / ❌ | [file or gap one line] |

---

## Recent activity (from task-history)

| Date | Type | Summary |
|------|------|---------|
| [date] | feat/fix | [one line] |

*(Keep last 5 rows; link full log: `memory/task-history.md`)*

---

## Known blockers

- [ ] [blocker or empty: none]

---

## Next

- **Phase [N+1]**: [name from DEV-PLAN]
- **Handoff**: see `memory/handoff.md` if session was long
