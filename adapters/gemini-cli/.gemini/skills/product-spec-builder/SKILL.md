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
    │   ├── distillation-mode.md            # 需求蒸馏（反讨好·需求阶段）
    │   ├── requirements-dimensions.md
    │   ├── conversation-strategy.md
    │   ├── hard-gate-rationalization.md
    │   ├── multi-stakeholder-review.md  # 四视角扫描 + 输出格式
    │   ├── critique-gate.md            # 反讨好偏见批判 gate（三个结构信号）
    │   └── pm-frameworks-*.md
    │   └── multi-stakeholder-review.md  # 四视角扫描 + 输出格式
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
    **Cross-phase redundancy**: Questions asked in Exploration may be re-asked verbatim in Clarifying or Refinement. Track what's been covered: after each phase, note covered topics; before next phase, scan that list. Do not ask what was already asked.
    **Single-pass validation is insufficient**: Step 6 Final Validation must run **at least 3 full scan→fix cycles**, not just "until clean". One pass misses 30-50% of issues. Use an explicit counter and re-read the full Spec each cycle — incremental diffs accumulate blind spots.
    **No cross-phase dedup before generation**: Exploration, Clarifying, and Refinement phases each produce interview notes with overlapping content. Before Document Generation, do a structured dedup pass across all phases' notes — merge duplicate requirements, flag contradictions across phases, consolidate scattered decisions. Redundancy baked into the Spec is much harder to remove after generation.
    **Multi-Stakeholder Review ≠ Critique Gate ≠ Step 7**: MS Review asks "should we build this?" Critique Gate asks "what are we getting wrong?" Step 7 asks "is the Spec sound?" Three different gates — do not merge them.
    **Product size → gate level**: Small products (CLI, ≤4 features, no auth/DB) get recommended `light` gate level via `forge-size-detect`. Full gates for larger products. User may override in `.forge/gate-config.json`.
    **Critique Gate evidence rule**: Every finding in the Critique Gate Summary must cite Evidence as `§section` or `"spec quote"`. Findings without evidence do not count toward the density quota — unfalsifiable criticisms are the easiest to fake.
    **Critique Gate verdict thresholds**: 0 findings + proceed → re-scan mandatory (highest sycophancy risk). <3 evidence-backed findings → re-scan once. ≥3 evidence-backed findings → proceed/clarify/blocked per stop rules. Full procedure in `references/critique-gate.md`.

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
    → Spec 输出必须附加 `../_shared/output-status-protocol.md`

<!-- end: output-style -->
<!-- begin: requirements-dimension-checklist -->
[Dimension Checklist]
    See [references/requirements-dimensions.md](references/requirements-dimensions.md) for the full requirements dimension checklist.

    Must-have dimensions:
    - **Product Positioning**: what this is, what problem it solves
    - **Target Users**: who will use it and why
    - **Core Features**: essential features that define the product
    - **User Flow**: complete path from opening to task completion
    - **AI Capability Needs**: which features need AI and what type

[Anti-Rationalization Checklist]
    → `references/hard-gate-rationalization.md`
    在 Product-Spec.md 保存且用户确认前，禁止进入 /dev-planner 或 /dev-builder。

[Requirements Dimension Checklist]
    访谈需收集的维度 + 信息充分性判定。
    **0-to-1 / Iteration 提问时读取** `references/requirements-dimensions.md`。

[Judgment Spectrum]
    → `references/judgment-spectrum.md`

[Conversation Strategy]
    开场、提问、方案与 AI/平台/技术引导、搜索与确认。
    **0-to-1 / Iteration 对话阶段读取** `references/conversation-strategy.md`（含 CoT 模板）

<!-- end: requirements-dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    10-item, 20 point scoring system. Ship threshold: **>= 16** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | User need depth | 2 | YES | 2 = Captures real user problem, distinguishes need from assumed solution; 1 = Good problem description but occasionally conflates solution with need; 0 = Spec is just a feature list with no user-need context |
    | 2 | Completeness | 2 | YES | 2 = Covers all functional areas, edge cases, error states, empty states; 1 = Main flows covered but edge cases and error states missing; 0 = Large feature areas or states missing entirely |
    | 3 | Clarity | 2 | YES | 2 = Every requirement unambiguous with testable acceptance criteria; 1 = Most requirements clear but some vague or untestable; 0 = Requirements open to broad interpretation |
    | 4 | Priority clarity | 2 | -- | 2 = Must-have vs nice-to-have clearly separated with rationale; 1 = Priorities present but blurred or missing rationale; 0 = Everything listed as equal priority |
    | 5 | Technical feasibility awareness | 2 | -- | 2 = Spec avoids impossible or impractical requirements; technical risks flagged; 1 = Mostly feasible but some speculative requirements; 0 = Spec includes clearly infeasible requirements |
    | 6 | Consistency | 2 | YES | 2 = No contradictions between sections; terminology is uniform; 1 = Minor inconsistencies but resolvable; 0 = Contradictions between different sections |
    | 7 | Stakeholder coverage | 2 | -- | 2 = All user roles/personas considered with distinct needs; 1 = Primary user covered, secondary roles missed; 0 = Only one perspective represented |
    | 8 | Iteration readiness | 2 | -- | 2 = Spec structured for incremental delivery; clear Phase-1 scope; 1 = Some structuring but not cleanly sliceable; 0 = Monolithic spec with no incremental path |
    | 9 | Conflict detection | 2 | -- | 2 = In iteration mode, proactively detects and flags conflicts with existing Spec; 1 = Detects conflicts only when obvious; 0 = New requirements added without cross-referencing existing Spec |
    | 10 | Precision of language | 2 | -- | 2 = Requirements use precise, measurable language (not "fast", "good", "modern"); 1 = Mostly precise but some subjective terms remain; 0 = Requirements rely on vague qualitative terms |

    **Scoring**: Run `pnpm validate-skill --score core/skills/product-spec-builder` to compute.

<!-- end: quality-rubric -->
<!-- begin: workflow-0-to-1-mode -->
[Workflow (0-to-1 Mode)]
    从零到一完整阶段（探索 → 澄清 → 细化 → 多视角评审 → 批判 Gate → 生成 Spec）。
    默认含 Multi-Stakeholder Review 和 Critique Gate（Quick Mode 跳过，用户可手动跳过）。
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
<!-- begin: workflow-distillation-mode -->
[Workflow (Distillation Mode)]
    **Trigger**: User says distill / 蒸馏 / infer what I need（模糊一句话，要 AI 推断而非问答）。
    **反讨好「需求阶段」**：多路推断（不依赖用户回答）→ 交叉验证 → ✅/⚠️/❓ 蒸馏输出。
    **按步执行** `references/distillation-mode.md`

<!-- end: workflow-distillation-mode -->
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
