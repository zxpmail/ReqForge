---
id: evo-mq0q7t9b-product-spec-builder-optimizat
type: skill-optimization
source_skill: product-spec-builder
target: core/skills/product-spec-builder/SKILL.md
threshold: "avg scores P3.0 C2.5 E2.5 S2.0"
created: 2026-06-05
status: applied
applied: 2026-06-06
---

# Evolution Proposal: skill-optimization

**RED**: 2 feedback entries with low average scores

**GREEN**:
- Review `core/skills/product-spec-builder/SKILL.md` for applicable section ([Gotchas], [Workflow], or [First Principles])
- Add guidance addressing the recurring issue

**Predicted Effect**: Reduced occurrence count for this failure class

**Verify By**: After applying, run `pnpm forge-evolve status` and confirm no further candidates for this topic

---
## Source Feedback

- product-spec-builder may introduce redundancy and errors during requirements gathering, lacks formal review step
- User reports one pass of product-spec-builder final validation is insufficient - typically needs 3 iterations to fix all issues
