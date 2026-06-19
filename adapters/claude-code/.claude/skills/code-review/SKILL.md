<!-- forge: code-review v2.1 -->
---
name: code-review
description: Used when the user wants to review code, check quality, verify feature completeness, or needs to validate code implementation against Spec and design mockups. Outputs a structured review report with evidence for each conclusion.
version: 2.1.0
updated: 2026-05-30
requires: []
---

<!-- begin: task -->
[Task]
    Review code implementation completeness and quality against Product-Spec.md and design mockups.
    Output a structured review report. Fixes are executed by the main Agent using dev-builder or bug-fixer Skill after receiving the report.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Fixing bugs -> use /bug-fixer instead
    - Writing new features -> use /dev-builder instead
    - Requirements gathering -> use /product-spec-builder instead

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Automatically executed as the first step when the Skill starts:

    Required:
    - Product-Spec.md -> if missing, prompt to call /product-spec-builder first
    - Project code exists -> if no code, prompt to call /dev-builder first

    Optional (enhances review capability):
    - `.forge/security-guidance.md` -> if present, **must read** for moderate/complex reviews or when `code-reviewer-security` runs
    - DEV-PLAN.md -> if available, cross-reference Phase delivery checklist
    - Design-Brief.md -> if available, cross-reference visual specifications
    - Design tool MCP -> if available, extract design values and compare with code
    - Playwright plugin -> if available, automate UI interaction testing
    - git -> if available, use git diff to trace change scope

<!-- end: dependency-check -->
<!-- begin: shared-discipline -->
[Shared Discipline]
    Review 时重点查 Surgical Changes + Simplicity First → `../_shared/karpathy-discipline.md`

<!-- end: shared-discipline -->
<!-- begin: first-principles -->
[First Principles]
    **Review 前必读** `references/first-principles.md`
    **Tech Stack**: 审查前读 `.forge/dev-map.md` 的技术栈节，按语言选择审查维度（Java 侧重 import/异常/DI；Python 侧重 import/类型标注；JS/TS 侧重类型/async/import 路径）。
    **Code Standards**: 审查时同时加载 `.forge/code-standards/<language>.md`，对照规范逐项检查（命名、异常处理、依赖注入模式等）。

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    code-review/
    ├── SKILL.md
    ├── commands/code-review.md
    └── references/
        ├── first-principles.md
        ├── output-style.md
        ├── judgment-spectrum.md
        ├── anti-rationalization.md
        ├── anti-ai-slop-checklist.md
        ├── review-dimension-checklist.md
        ├── review-strategy.md
        ├── multi-perspective-dispatch.md   # 4 维审查的平台无关分发（Mode A/B）
        ├── workflow.md                 # Step 1–5（必读）
        └── yolo-mode.md
    ../_shared/
    ```

<!-- end: file-structure -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Review report** (screen output) — parallel agent review results with aggregated findings

<!-- end: output-artifacts -->
<!-- begin: judgment-spectrum -->
[Judgment Spectrum]
    → `references/judgment-spectrum.md`

<!-- end: judgment-spectrum -->
<!-- begin: review-dimension-checklist -->
[Dimension Checklist]
    See [references/review-dimension-checklist.md](references/review-dimension-checklist.md) for the full review dimension checklist.

    Must-have dimensions:
    - **Functional Completeness**: every Spec requirement has a code implementation
    - **Surgical Changes Audit**: every changed line traces to the original request
    - **Simplicity First Audit**: no over-engineering or speculative abstraction
    - **Security Scan**: hardcoded credentials, XSS, SQL injection, path leakage
    - **Type Safety**: no `any`, `@ts-ignore`, unsafe casts

[Review Dimension Checklist]
    Moderate/complex → 4-dimension parallel review (Mode A dispatch; see `workflow.md` Step 2 + `references/multi-perspective-dispatch.md`). Simple → aggregator quick pass only.
    **按需读取** `references/review-dimension-checklist.md`

<!-- end: review-dimension-checklist -->
<!-- begin: gotchas -->
[Gotchas]
    **Surface-level review**: Every line traceable to Spec; drift flagged.
    **Evidence-less conclusions**: Every finding needs file:line.
    **Confidence inflation**: Honest uncertainty beats false 100%.
    **Regression blind spot**: Use `dep-graph affected <file>` if available.
    **Skipping compilation verification**: Run compile every time.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`

<!-- end: anti-rationalization-checklist -->
<!-- begin: review-strategy -->
[Review Strategy]
    **按需读取** `references/review-strategy.md`

<!-- end: review-strategy -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    10-item, 20 point scoring system. Ship threshold: **>= 16** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Coverage depth | 2 | YES | 2 = Every relevant file/function reviewed with substantive analysis; 1 = Most key files covered but some sections superficial; 0 = Large gaps, review misses entire subsystems |
    | 2 | Spec alignment checking | 2 | YES | 2 = Every finding cross-referenced to Product-Spec.md requirement; 1 = Some findings linked to Spec but others lack traceability; 0 = Review does not reference Spec at all |
    | 3 | Evidence quality | 2 | YES | 2 = Every finding includes specific file:line references and explanation; 1 = Most findings have references but some are vague; 0 = Conclusions stated without any code evidence |
    | 4 | False positive discipline | 2 | -- | 2 = Reports only actionable issues, no style-nitpicking as blockers; 1 = Some trivial items mixed in but correctly de-emphasized; 0 = Review drowned in style/preference nits |
    | 5 | Actionable findings | 2 | YES | 2 = Every issue includes a concrete fix suggestion; 1 = Most findings have suggestions but some are vague; 0 = "This is wrong" with no guidance on how to fix |
    | 6 | Security awareness | 2 | -- | 2 = Actively checks for OWASP Top 10 patterns relevant to codebase; 1 = Checks obvious security issues but misses subtle ones; 0 = No security consideration at all |
    | 7 | Performance awareness | 2 | -- | 2 = Identifies N+1 queries, unnecessary rerenders, large bundle risks; 1 = Catches obvious issues but misses systemic ones; 0 = No performance consideration |
    | 8 | Blast radius consideration | 2 | -- | 2 = Suggested changes evaluated for impact on other modules; 1 = Mentions some risks but does not fully explore impact; 0 = Suggestions made without regard for side effects |
    | 9 | Review report structure | 2 | -- | 2 = Clear summary, severity (critical/major/minor), actionable next steps; 1 = Report has structure but missing severity or unclear next steps; 0 = Unstructured stream of observations |
    | 10 | Reproducibility | 2 | YES | 2 = Every finding includes reproduction steps or input that triggered it; 1 = Some findings reproducible, others not; 0 = Findings cannot be independently verified |

    **Scoring**: Run `pnpm validate-skill --score core/skills/code-review` to compute.

<!-- end: quality-rubric -->
<!-- begin: workflow -->
[Workflow]
    1. Run [Dependency Check]
    2. Read `references/first-principles.md`
    3. **必须先 Read `references/workflow.md`** — Step 1–5（baseline → dispatch → scan → aggregate → report）
    4. 维度与方法 → `review-dimension-checklist.md` + `review-strategy.md`
    5. 交付 report 前执行 `references/anti-ai-slop-checklist.md` 自检
    6. `FORGE_MODE=yolo` → `references/yolo-mode.md`

<!-- end: workflow -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    → `references/yolo-mode.md`

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Workflow] — start at `references/workflow.md` Step 1

<!-- end: initialization -->
