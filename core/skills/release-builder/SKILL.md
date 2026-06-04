<!-- forge: release-builder v1.1 -->
---
name: release-builder
description: Used when the user wants to package, deploy, publish, or go live, or when project development is complete and ready for delivery. Covers Web deployment, Desktop packaging, and CLI publishing, with built-in privacy audit and smoke testing.
version: 1.1.0
updated: 2026-05-30
requires: []
---

<!-- begin: task -->
[Task]
    Execute the full build-package-test-publish lifecycle according to project type.
    Ensure the release artifact: can be installed, can run, has no privacy leaks, has no security vulnerabilities.

<!-- end: task -->
<!-- begin: not-for -->
[Not For]
    - Writing code or features -> use /dev-builder instead
    - Fixing bugs found during testing -> use /bug-fixer instead
    - Reviewing code quality -> use /code-review instead
    - Projects with no code yet -> use /dev-builder first

<!-- end: not-for -->
<!-- begin: dependency-check -->
[Dependency Check]
    Executed on demand after requirements gathering, based on the user's chosen release channel.

    Basic checks:
    - Project code exists -> if no code, prompt to call /dev-builder first
    - git available
    - Build tools available
    - package.json exists

    Channel checks:
    - Based on the user's chosen release channel, check the required CLI tools and authentication status for that channel
    - User only wants to package (not publish) -> skip deployment tool checks

    Installation strategy:
    - Missing tools: the Agent autonomously determines the installation method and installs directly
    - Operations requiring user login/authentication: prompt the user to complete authentication
    - When user-specific assets like signing certificates are missing, explain what is needed and guide the user to prepare

    Optional:
    - Product-Spec.md -> if available, cross-reference features for smoke testing
    - `.forge/security-guidance.md` -> if present, **read before release**
    - `.forge/preflight.json` -> if present, **run `pnpm preflight`** before publish; exit code 1 = blocked (see `core/docs/external-publish-preflight.md`)

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Release 前必读** `references/first-principles.md`

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    → `references/output-style.md`（发布工程师风格）

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    release-builder/
    ├── SKILL.md
    ├── commands/release-builder.md
    └── references/
        ├── first-principles.md
        ├── output-style.md
        ├── workflow.md                 # Step 1–8（必读）
        ├── release-checklist.md        # 版本/构建/隐私/依赖/Git
        ├── release-strategy.md         # Web / Desktop / CLI
        ├── rollback-strategy.md
        ├── finishing-branch-checklist.md
        ├── anti-rationalization.md
        ├── anti-ai-slop-checklist.md
        └── yolo-mode.md
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Privacy leaks in build artifacts**: Always grep for `/Users/`, `C:\Users\`, `API_KEY`, `sk-ant-` before packaging.
    **Skipping smoke test**: Run the binary / hit homepage / verify core flow — compilation ≠ shippable.
    **Version tag mismatch**: package.json, git tag, and artifact name must match.
    **Build cache pollution**: `rm -rf dist &&` before final build when in doubt.

<!-- end: gotchas -->
<!-- begin: anti-rationalization-checklist -->
[Anti-Rationalization Checklist]
    → `references/anti-rationalization.md`
    遇 skipping smoke test / skipping privacy audit / skipping rollback plan 时读取。

<!-- end: anti-rationalization-checklist -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Build artifacts** — .next/, dist/, release/ and other build output directories
    - **Deployment URL** (Web) — production environment access address
    - **npm package publish** (CLI) — version on npm registry
    - **Git tag** — v[version] tag + GitHub Release (optional)

[Finishing Branch Checklist]
    → `references/finishing-branch-checklist.md`

<!-- end: output-artifacts -->
<!-- begin: release-checklist -->
[Release Checklist]
    **审计阶段读取** `references/release-checklist.md`

<!-- end: release-checklist -->
<!-- begin: release-strategy -->
[Release Strategy]
    **按项目类型读取** `references/release-strategy.md`

<!-- end: release-strategy -->
<!-- begin: rollback-strategy -->
[Rollback Strategy]
    → `references/rollback-strategy.md`

<!-- end: rollback-strategy -->
<!-- begin: release-dimension-checklist -->
[Dimension Checklist]
    See [references/release-dimension-checklist.md](references/release-dimension-checklist.md) for the full dimension checklist.

    Must-have dimensions:
    - **Build Artifact Integrity**: complete build, no debug artifacts in production
    - **Environment Parity**: aligned OS, runtime, and dependency versions
    - **Configuration/Secrets Management**: runtime injection, startup validation
    - **Database Migration Readiness**: backward-compatible, reversible, idempotent
    - **Dependency Vulnerability Scan**: no critical/high unfixable vulns in prod deps
    - **Rollback Strategy**: one-command revert, data-preserving
    - **Smoke Test Plan**: primary user flow verified end-to-end

<!-- end: release-dimension-checklist -->
<!-- begin: quality-rubric -->
[Quality Rubric]
    8-item, 16-point scoring system. Ship threshold: **≥ 12** with no critical item scoring 0.

    | # | Dimension | Pts | Critical | Scoring |
    |---|-----------|-----|----------|---------|
    | 1 | Build integrity | 2 | YES | 2 = Clean build, no debug artifacts, minified for production; 1 = Build succeeds but has warnings or debug artifacts; 0 = Build fails |
    | 2 | Smoke test | 2 | YES | 2 = Core user flow verified end-to-end; 1 = Partial check (compilation only); 0 = No smoke test |
    | 3 | Privacy audit | 2 | — | 2 = Grepped for paths/keys/credentials, none leaked; 1 = Checked but missed something benign; 0 = Not audited |
    | 4 | Dependency vulnerability scan | 2 | — | 2 = No critical/high vulnerabilities in production deps; 1 = Vulnerabilities found but mitigated; 0 = Not scanned |
    | 5 | Version consistency | 2 | YES | 2 = package.json + git tag + artifact name all match; 1 = One mismatch; 0 = Multiple mismatches |
    | 6 | Rollback plan | 2 | — | 2 = One-command revert defined, data-preserving; 1 = Plan exists but manual; 0 = No rollback strategy |
    | 7 | Environment parity | 2 | — | 2 = OS/runtime/dependency versions aligned with target; 1 = Checked but minor drift; 0 = "Works on my machine" |
    | 8 | Changelog + tag | 2 | — | 2 = CHANGELOG updated, git tag created, release notes drafted; 1 = Partial; 0 = Missing |

    **Scoring**: Run `pnpm validate-skill --score core/skills/release-builder` to compute.
<!-- end: quality-rubric -->
<!-- begin: workflow -->
[Workflow]
    1. Read `references/first-principles.md`
    2. **必须先 Read `references/workflow.md`** — Step 1–8 完整发布链
    3. 策略分支 → `references/release-strategy.md`；失败回滚 → `references/rollback-strategy.md`
    4. 发布前执行 `references/anti-ai-slop-checklist.md` 自检
    5. `FORGE_MODE=yolo` → `references/yolo-mode.md`

<!-- end: workflow -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    → `references/yolo-mode.md`

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Workflow] — start at `references/workflow.md` Step 1

<!-- end: initialization -->
