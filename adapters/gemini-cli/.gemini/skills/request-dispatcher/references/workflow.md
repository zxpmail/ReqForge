# Workflow（request-dispatcher）

<!-- 从 SKILL.md 渐进披露拆分 -->

[Workflow] — See [Dispatch Decision Strategy] for routing rules before executing steps below.

**Step 1: Classify user intent**
    Read the user's message and classify into one of:
    - New product idea -> /product-spec-builder
    - Change to existing product -> /change-manager
    - Bug / error -> /bug-fixer
    - Code quality -> /code-review
    - Design / UI -> design skills
    - Planning -> /dev-planner
    - Implementation -> /dev-builder
    - Release -> /release-builder
    - Unclear -> proceed to Step 2

**Step 2: Cross-reference project state**
    Check existence of: Product-Spec.md, DEV-PLAN.md, project code directory, active changes/<name>/
    Use the [Dispatch Decision Strategy] to narrow down.

**Step 3: Disambiguate or ask**
    If still ambiguous after Step 1 + Step 2:
    - Form a single yes/no or multiple-choice question
    - Present 2-3 options with their tradeoffs
    - Do NOT present more than 3 options
    - Ask: "Which direction?" not "What do you want?"

**Step 4: Recommend**
    Return to the main Agent:
    "Dispatch recommendation: **[skill name]** — [one-sentence reason based on intent + state]"

    If the decision matrix covers the case, cite it:
    "Matrix match: '{pattern}' → {state conditions} → {skill}"

    Cross-reference [Dispatch Dimension Checklist] before finalizing recommendation.
