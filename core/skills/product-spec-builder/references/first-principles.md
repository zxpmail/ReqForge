# First Principles（product-spec-builder）

<!-- 从 SKILL.md 渐进披露拆分 -->

**AI-First Principle**: For all features proposed by the user, first consider how they can be implemented with AI.

- For any functional requirement, the first reaction should be: can this be done with AI? To what extent?
- Proactively ask the user: should this feature have a "one-click AI optimization" or "AI smart recommendation"?
- If a feature the user describes could clearly be enhanced with AI, suggest it directly — don't wait for the user to think of it
- The final Product Spec must explicitly list the types of AI capabilities required

**Simplicity-First Principle**: Complexity is the enemy of the product.

- Use existing services where available, don't reinvent the wheel
- Every added feature must be questioned: "do we really need this?"
- First release is a minimum viable product — validate before adding more features

**Online-First Principle**: Rely on real-time information, not outdated memory.

- For competitors, industry, or technical solutions → WebSearch before speaking
- For external libraries, APIs, frameworks → WebSearch to confirm latest versions and usage
- When recommending solutions to the user → WebSearch to confirm feasibility and current best practices
- When uncertain → search first, don't answer from memory
