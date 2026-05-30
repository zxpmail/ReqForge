# change-manager — OpenSpec + Superpowers Handoff

> apply 阶段与 dev-builder / dev-planner 边界。详解 → [shuge-openspec-superpowers-comparison.md](../../../docs/shuge-openspec-superpowers-comparison.md)。

| User intent | Forge command | Not |
|-------------|---------------|-----|
| Create change + delta specs | **propose** | dev-builder |
| Implement scoped change from `changes/<name>/` | **apply** → dev-builder (Change-Scoped) | OpenSpec `/opsx:apply` alone |
| Fill tasks / design for a change | **apply** Step 2 → dev-planner | product-spec-builder creating `changes/` |
| 0→1 Phase backlog | dev-planner → dev-builder (Phase mode) | change-manager |

**Explicit paths on apply** (do not rely on Agent to "discover" OpenSpec-style dirs):

- `changes/<change-name>/proposal.md`
- `changes/<change-name>/specs.md` (Delta + acceptance)
- `changes/<change-name>/design.md`
- `changes/<change-name>/tasks.md`
- Optional: `DEV-PLAN.md` — add **one Phase entry** for this change only, not whole-repo backlog

When invoking dev-builder from apply, pass **`change-name=<change-name>`** in the user message so Loading Phase reads the folder above.

Positioning: `core/docs/openspec-comparison.md` (Forge vs OpenSpec).
