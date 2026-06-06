# Workflow（design-brief-builder）

**Brief 前必读** `references/first-principles.md`。完整访谈按本文件四阶段执行。

## Startup Phase

Step 1: Dependency Check — execute [Dependency Check] in SKILL.md

Step 2: Load Product Spec — read `Product-Spec.md`; extract product type, target users, core features, UI layout, tech direction (do not re-ask)

Step 3: Search design trends — WebSearch competing products in this category

Step 4: Design Discovery questionnaire (required) — execute `references/design-discovery-questionnaire.md`; 1–2 items per turn; lock all 10 fields before Brief prose

Step 5: Visual direction preset (if user still vague) — offer presets from `references/visual-direction-presets.md`

## Interview Phase

Purpose: Explore dimensions in `references/interview-dimension-checklist.md`

**Driving Logic**:
1. Check checklist for unexplored dimensions
2. Use `references/interview-strategies.md`; ask 1–2 questions at a time
3. If user brings up a dimension, go deeper
4. After each response, re-check `references/sufficiency-judgment.md`
5. All Must Meet satisfied → Translation Phase
6. Else → continue probing

**Opening**:
"Your product is a [product type] for [target users]. Among competitors, [A] goes XX, [B] goes YY. Closer to either, or different?"

**Refinement Preference** (ask after dimensions are clear):
"Would you like the mockups delivered:
- **Single pass** — everything in one go (faster, but more rounds of revision)
- **Gradual refinement** — 3 tiers: layout skeleton → core interactions → edge cases (slower start, but structural issues caught early when they're cheap to fix)

Also: do you want **one design direction**, or **2-3 alternatives** with a cross-comparison?"

## Translation Phase

Step 1: Feelings → Design Attributes (e.g. "Premium" → generous whitespace, low saturation, refined typography)

Step 2: Check consistency — conflicts → user trade-off

Step 3: Repeat back for confirmation in plain language

## Output Phase

Step 0: Anti-slop review — run `references/anti-ai-slop-checklist.md`; append `## Anti-Slop Review`

Step 1: Load `templates/design-brief-template.md`

Step 2: Fill content; each direction needs a reference product; mark Should Meet gaps as `[TBD]`

Step 3: Save as `Design-Brief.md`

Step 4: Guide next steps — design-maker mockups, or `/dev-planner`, or `/dev-builder` after mockups
