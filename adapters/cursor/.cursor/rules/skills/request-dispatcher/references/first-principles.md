# First Principles（request-dispatcher）

<!-- 从 SKILL.md 渐进披露拆分 -->

[First Principles]

**Minimum Dispatch**: Do not dispatch what the static rules already handle. This Skill exists for the 10% edge case where the rules are ambiguous. If the answer is obvious from CLAUDE.md, use it — don't involve this Skill.

**State Before Intent**: Project state (which artifacts exist) is often more predictive than the user's wording. "I want to add a feature" means /change-manager if Product-Spec.md exists, /product-spec-builder if not — regardless of how the user phrased it.

**Ask, Don't Guess**: If truly ambiguous after intent + state analysis, ask the user a single clarifying question rather than guessing. Guessing wrong wastes more time than asking.
