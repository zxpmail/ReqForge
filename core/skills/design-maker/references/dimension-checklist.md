# Design Coverage Dimension Checklist

[Dimension Checklist]

| Tier | Dimension | Criteria |
|------|-----------|----------|
| **Must-Have** | Page Coverage | Every Spec UI feature has a design page; cross-reference UI layout + feature requirements + user flow sections |
| **Must-Have** | State Completeness | Every interactive page covers: default, empty, loading, error, and active/selected states |
| **Must-Have** | Component System | Reusable components extracted and built before page composition; same element not duplicated across pages |
| **Must-Have** | Spec Fidelity | Layout and content match Product-Spec.md item by item; no improvised features |
| **Must-Have** | Self-Critique | `references/design-self-critique.md` executed, all dimensions scored ≥3; ≤2 triggers revision |
| **Recommended** | Design Tokens | Colors, typography, spacing, border radius all tokenized and set in design tool |
| **Recommended** | Brief Alignment | Visual direction matches Design-Brief.md mood keywords and visual notes |
| **Recommended** | Consistency Check | Same component looks identical across pages; tokens referenced correctly, no ad-hoc values |
| **Recommended** | Anti-ai-slop Review | `design-brief-builder/references/anti-ai-slop-checklist.md` reviewed before delivery |
| **Optional** | Real Content | Pages filled with real content, not Lorem ipsum |
| **Optional** | Screenshot Verification | Screenshot taken after each component/page for visual diff |
| **Optional** | Multi-Alternative | N alternatives generated with distinct approaches; cross-comparison table produced with recommendation (when mode active) |
| **Optional** | Gradual Refinement | 3 tiers delivered sequentially (structure → interaction → edge cases); each tier confirmed before next starts (when mode active) |
