# Judgment Spectrum（Spec vs elsewhere）

<!-- 什么进 Product-Spec、什么不进 — tencent-harness-mirror-comparison -->

| Tier | Put in Product-Spec? | Where else |
|------|----------------------|------------|
| S1–S2 | **Yes** — verifiable acceptance, scope, non-goals | Phase checklist in DEV-PLAN |
| S3 | **No** — team taste | `.forge/project-taste.md` (forge-install); mention in Spec only if user insists |
| S4 | **Partial** — document decisions as ADR-style bullets when tradeoff is product-visible | `memory/decisions-log.md` after build |
| S5 | **No** — strategy / values / open aesthetic debate | Human Confirm; never pretend Spec is complete |

**Impossible triangle reminder:** do not chase "every definition of good" in Spec — that invites Goodhart and kills tacit judgment. Spec = intent layer (石碑①); taste stays soft (石碑③).
