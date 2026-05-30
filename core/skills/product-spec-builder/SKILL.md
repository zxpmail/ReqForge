<!-- forge: product-spec-builder v1.1 -->
---
name: product-spec-builder
description: Used when the user says they want to build a product, application, or tool, or when they want to add features, change requirements, or adjust UI. Collects requirements through in-depth conversation, generates or updates Product-Spec.md.
version: 1.1.0
updated: 2026-05-30
requires: []
---

<!-- begin: task -->
[Task]
    **0-to-1 Mode**: Collect product requirements from the user through in-depth conversation, using direct even pointed questioning to force the user to think clearly, ultimately generating a structurally complete, detail-rich Product Spec document suitable for direct AI development, and output it as a .md file for the user.

    **Iteration Mode**: When the user proposes new features, requirement changes, or iterative ideas during development, use questioning to help the user clarify the change, detect conflicts with the existing Spec, directly update the Product Spec file, and automatically record the changelog.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Creating development plans -> use /dev-planner instead
    - Writing code -> use /dev-builder instead
    - Designing visual style -> use /design-brief-builder instead
    - Fixing bugs -> use /bug-fixer instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Executed automatically as the first step when the Skill starts. All checks must pass before entering the main workflow.

    This skill has no external dependencies, only pre-requisite file checks:
    - 0-to-1 Mode: No pre-requisite files required
    - Iteration Mode: Product-Spec.md must exist

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Spec 前必读** `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Karpathy 四原则 → `../_shared/karpathy-discipline.md`

<!-- end: shared-discipline -->
<!-- begin: hard-gate -->
[HARD-GATE]
    Until `Product-Spec.md` is saved **and** the user explicitly confirms it (0-to-1) or confirms the iteration delta (Iteration Mode):

    - **MUST NOT** invoke `/dev-planner` or `/dev-builder`
    - **MUST NOT** create or edit application source under `src/`, `app/`, `lib/`, `packages/`
    - **MUST NOT** treat "rough agreement in chat" as confirmation — user must confirm the written Spec (or changelog delta)

    Session-start iron laws reinforce this via `templates/forge-bootstrap.md` (injected by `check-evolution` hook).

    Rationalizations → `references/hard-gate-rationalization.md`

<!-- end: hard-gate -->
<!-- begin: file-structure -->
[File Structure]
    ```
    product-spec-builder/
    ├── SKILL.md                           # 入口（本文件）
    ├── references/
    │   ├── first-principles.md
    │   ├── output-style.md
    │   ├── skills-capabilities.md
    │   ├── judgment-spectrum.md
    │   ├── startup-check.md               # 模式路由
    │   ├── workflow-quick-mode.md         # Quick 路径（短 prompt）
    │   ├── workflow-0-to-1.md
    │   ├── workflow-iteration.md
    │   ├── light-grill-mode.md
    │   ├── requirements-dimensions.md
    │   ├── conversation-strategy.md
    │   ├── hard-gate-rationalization.md
    │   └── pm-frameworks-*.md
    └── templates/
        ├── product-spec-template.md
        └── changelog-template.md
    ../_shared/
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Skipping WebSearch**: "I know this domain well" → WebSearch anyway. Competitors, frameworks, and best practices change fast.
    **Accepting vague requirements**: "users will like it", "good UX", "modern design" → keep pressing until specifics.
    **Over-scoping**: Every "nice to have" is scope creep unless explicitly cut. After collecting requirements, proactively trim: "What can we cut from v1?"
    **Missing conflict detection**: In iteration mode, cross-reference existing Spec before finalizing changes.
    **Duplicating change-manager**: Do not create `changes/<name>/` here — scoped features use `/change-manager` only.
    **Chat agreement is not HARD-GATE lift**: Require explicit confirm of the **saved file**. See `references/hard-gate-rationalization.md`.
    **Quick Mode loading wrong refs**: Quick path → read **`workflow-quick-mode.md` only**; do not load full 0-to-1 interview chain.

<!-- end: gotchas -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Product-Spec.md** — Product Requirements Document (created in 0-to-1 mode, updated in iteration mode)
    - **Product-Spec-CHANGELOG.md** — Requirements Changelog (appended in iteration mode)
    - **changes/** — NOT created by this skill. Scoped features use `/change-manager` only

<!-- end: output-artifacts -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`（Spec 访谈人格；与 `_shared/output-style-concise` 不同）

<!-- end: output-style -->
<!-- begin: requirements-dimension-checklist -->
[Requirements Dimension Checklist]
    访谈需收集的维度 + 信息充分性判定。
    **0-to-1 / Iteration 提问时读取** `references/requirements-dimensions.md`。

[Judgment Spectrum]
    → `references/judgment-spectrum.md`

[Conversation Strategy]
    开场、提问、方案与 AI/平台/技术引导、搜索与确认。
    **0-to-1 / Iteration 对话阶段读取** `references/conversation-strategy.md`（含 CoT 模板）

<!-- end: requirements-dimension-checklist -->
<!-- begin: workflow-0-to-1-mode -->
[Workflow (0-to-1 Mode)]
    从零到一完整阶段（探索 → 澄清 → 细化 → 生成 Spec）。
    **进入 0-to-1 后按步执行** `references/workflow-0-to-1.md`

<!-- end: workflow-0-to-1-mode -->
<!-- begin: workflow-iteration-mode -->
[Workflow (Iteration Mode)]
    存量 Spec 迭代与 change-manager 路由。
    **Iteration Mode 完整步骤** `references/workflow-iteration.md`

<!-- end: workflow-iteration-mode -->
<!-- begin: startup-check -->
[Startup Check]
    **Skill 启动时必读** `references/startup-check.md`（模式路由：Quick / Light Grill / 0-to-1 / Iteration）

<!-- end: startup-check -->
<!-- begin: workflow-light-grill-mode -->
[Workflow (Light Grill Mode)]
    **Trigger**: User wants alignment / stress-test before Product-Spec (Matt Pocock `grill-me`).
    **按步执行** `references/light-grill-mode.md`

<!-- end: workflow-light-grill-mode -->
<!-- begin: workflow-quick-mode -->
[Workflow (Quick Mode)]
    **Quick 路径必读** `references/workflow-quick-mode.md` — 勿加载 `workflow-0-to-1` / `conversation-strategy` / pm-frameworks 全文

<!-- end: workflow-quick-mode -->
<!-- begin: machine-gate-markers -->
[Machine Gate Markers]
    After **explicit user confirm** of Product-Spec.md (0-to-1, Quick, or Iteration delta confirm), MUST write `.forge/spec-confirmed.json`. Template: `core/templates/forge-markers/spec-confirmed.template.json`.

<!-- end: machine-gate-markers -->
<!-- begin: initialization -->
[Initialization]
    1. Execute [Startup Check] → read `references/startup-check.md`
    2. Read mode-specific workflow reference (Quick → `workflow-quick-mode.md`; 0-to-1 → `workflow-0-to-1.md`; etc.)
    3. Read `references/first-principles.md` before questioning or generating Spec

<!-- end: initialization -->
