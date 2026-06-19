---
description: Gather requirements and generate/update Product-Spec.md through structured interview
argument-hint: [product idea or feature description]
---

# Command: /product-spec-builder

Entry: `/product-spec-builder` or describe product idea. **Full workflow → `SKILL.md`**.

## Mode routing (read one workflow ref)

| Mode | Trigger | Read |
|------|---------|------|
| **Quick** | one sentence / "quick" / "fast" | `references/workflow-quick-mode.md` only |
| **Distillation** | distill / 蒸馏 / infer what I need | `references/distillation-mode.md` |
| **Light Grill** | grill me / 烤问 / stress-test | `references/light-grill-mode.md` |
| **0-to-1** | no Spec yet, full deep-dive | `references/workflow-0-to-1.md` |
| **Iteration** | Product-Spec.md exists | `references/workflow-iteration.md` |

Startup routing → `references/startup-check.md`.

## Phases (index)

| Phase | Reference | Acceptance |
|-------|-----------|------------|
| Discovery | workflow-0-to-1 | One-paragraph concept agreed |
| Detail / Interview | conversation-strategy | Spec sections fillable without guessing |
| Distillation | distillation-mode | 4-path inference + cross-validation; Distillation Map (✅/⚠️/❓); ❓ feeds 0-to-1/Quick clarifying questions |
| Critique Gate | critique-gate | Three structural signals scanned; findings resolved or marked [TBD] |
| Spec write | product-spec-template | Product-Spec.md confirmed (HARD-GATE lifts only after explicit user confirm) |
| Iteration | workflow-iteration | Major/minor → edit Spec; moderate scoped feature → **`/change-manager propose`** |
