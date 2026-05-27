<!-- forge: release-builder v1.0 -->
---
name: release-builder
description: Used when the user wants to package, deploy, publish, or go live, or when project development is complete and ready for delivery. Covers Web deployment, Desktop packaging, and CLI publishing, with built-in privacy audit and smoke testing.
version: 1.0.0
updated: 2026-05-26
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
    - `.forge/security-guidance.md` -> if present, **read before release** — privacy + security smoke must not violate team rules (install via `pnpm forge-install`)

<!-- end: dependency-check -->
<!-- begin: first-principles -->
[First Principles]
    **Dev Mode Passing != Package Works**: The development environment and the packaged runtime environment are completely different. Different paths, different dependency bundling methods, different permissions. Must test from the installed package, not just from dev mode.
    **Privacy is the Bottom Line**: Release artifacts must never contain personal data — database files, sessions, API Keys, developer paths, usernames. No exceptions, no exemptions.
    **Test After Installation**: Desktop: install from package to system directory then test. CLI: install globally then test. Web: deploy then test online. Do not test from the build output directory.
    **Web-First**: Package errors should be WebSearched first, especially electron-builder and Vercel CLI version compatibility and signing/notarization issues.

<!-- end: first-principles -->
<!-- begin: output-style -->
[Output Style]
    **Tone**:
    - Like a release engineer: execute each item on the checklist one by one, attach results to each step
    - Stop on failure, do not skip

    **Principles**:
    - X Never say "ready to ship" after only testing dev mode
    - X Never skip the privacy audit
    - X Never proceed with publishing if smoke tests have not passed
    - V Every step includes evidence (build output, grep results, test screenshots)
    - V Stop immediately and fix when a privacy leak is discovered

    **Typical Expressions**:
    - "pnpm build passed, output in .next/, total size 45MB."
    - "Privacy audit: grep '/Users/' found 2 developer paths in the build output. Stopping, fix first."
    - "DMG installed to /Applications, launched from system directory. Core functionality verified."

<!-- end: output-style -->
<!-- begin: file-structure -->
[File Structure]
    ```
    release-builder/
    └── SKILL.md                           # Main Skill definition (this file)
    ```

<!-- end: file-structure -->
<!-- begin: gotchas -->
[Gotchas]
    **Privacy leaks in build artifacts**: API keys, local paths, env files, debug logs — all can end up in the bundle. Always grep for `/Users/`, `C:\Users\`, `API_KEY`, `sk-ant-` before packaging. A leak in the build is a leak in production.
    **Skipping smoke test**: "It compiles, so it ships" — no. Compilation means the types are right, not that the app works. Run the binary, hit the homepage, verify the core flow. 30 seconds of smoke testing saves a rollback.
    **Version tag mismatch**: package.json version, git tag, and release artifact name must match. Inconsistency here creates confusion that takes hours to untangle.
    **Build cache pollution**: CI or local caches can mask build failures. Always do `rm -rf dist &&` before the final build command. A cached success is not proof of a clean build.

<!-- end: gotchas -->
<!-- begin: output-artifacts -->
[Output Artifacts]
    - **Build artifacts** — .next/, dist/, release/ and other build output directories
    - **Deployment URL** (Web) — production environment access address
    - **npm package publish** (CLI) — version on npm registry
    - **Git tag** — v[version] tag + GitHub Release (optional)

[Finishing Branch Checklist] (Superpowers `finishing-a-development-branch` alignment)
    Before merge / publish / tag, user chooses one path — do not assume:

    | Option | When | Agent actions |
    |--------|------|-----------------|
    | **Merge** | Feature branch clean, tests green | Merge to target branch, delete worktree if any |
    | **Open PR** | Team review required | Push branch, open PR with Spec/Plan summary |
    | **Keep branch** | Experiment or pause | Document branch name + next step in `memory/decisions-log.md` |
    | **Discard** | Wrong approach | Revert or abandon branch; log ADR why |

    Verify: tests/lint/typecheck evidence attached; no open `.forge/phase-exit-block`; code-review completed for this release scope.

<!-- end: output-artifacts -->
<!-- begin: release-checklist -->
[Release Checklist]
    Items common to all project types.

<!-- end: release-checklist -->
    <!-- begin: version-management -->
    [Version Management]
        - Confirm package.json version field is updated (semver)
        - Confirm CHANGELOG is updated (if it exists)
        - Working directory is clean (git status has no uncommitted changes)

    <!-- end: version-management -->
    <!-- begin: build-verification -->
    [Build Verification]
        - Build command completes with zero errors
        - Artifact files exist and are of reasonable size. The Agent should judge the expected range based on project type and dependency scale. If suspiciously large, investigate whether unintended items were bundled.

    [Privacy Audit] (absolute baseline)
        First determine the build output directory (varies by project):
        - Next.js -> .next/ or out/
        - Vite -> dist/
        - Electron -> release/ or out/ or dist/mac/
        - CLI -> dist/ or build/

        Then execute checks on the build output directory:
        - No personal paths (check macOS/Windows/Linux developer paths)
        - No database files: `find [BUILD_DIR]/ -name "*.db" -o -name "*.db-shm" -o -name "*.db-wal"`
        - No environment variable files: `find [BUILD_DIR]/ -name ".env*"`
        - No credential files: `find [BUILD_DIR]/ -name "credentials*" -o -name "*.pem" -o -name "*.key"`
        - No user data: `find [BUILD_DIR]/ -name ".forge-data" -o -name "workspaces"`
        - No hardcoded credentials: `grep -rn "sk-ant-\|sk-proj-\|ANTHROPIC_API_KEY\|OPENAI_API_KEY\|password.*=.*['\"]" [BUILD_DIR]/`
        If any item is found -> stop immediately, fix, then rebuild.

        Check developer paths based on the current system:
        - macOS/Linux -> `grep -rn "/Users/" [BUILD_DIR]/`
        - Windows -> `grep -rn "C:\\Users\\" [BUILD_DIR]/`

    <!-- end: build-verification -->
    <!-- begin: dependency-integrity -->
    [Dependency Integrity]
        - npm audit has no critical vulnerabilities
        - Build process has no MODULE_NOT_FOUND errors

    <!-- end: dependency-integrity -->
    <!-- begin: git-check -->
    [Git Check]
        - git author does not expose personal information
        - .gitignore covers all data files (.env*, *.db, .forge-data/)

    <!-- end: git-check -->
<!-- begin: release-strategy -->
[Release Strategy]
    Select the release flow based on project type.

    **Web Project Release**
    1. Build
       The Agent determines the correct build command and output directory based on the project's framework and version. Build methods may differ across framework versions; check project configuration before executing.
    2. Privacy audit: execute the [Privacy Audit] checklist
    3. Configure production environment variables
       - Vercel: `vercel env add [NAME]` or set in the Vercel dashboard
       - Netlify: set in netlify.toml or the dashboard
       - Confirm sensitive variables like API Keys are configured on the platform, not in code
    4. Deploy
       - Vercel: `vercel --prod`
       - Netlify: `netlify deploy --prod --dir=[BUILD_DIR]`
       - Static hosting: remind the user to upload [BUILD_DIR] to the hosting service
       - Record the deployment URL
    5. Online verification: visit the deployment URL, confirm the page loads with no white screen
    6. Smoke test: if Product-Spec.md exists -> test each core feature against the list

    **Desktop Project Release (Electron)**
    1. Build: `pnpm build` -> verify frontend artifacts
    2. Package
       - macOS: check signing configuration (mac.identity / mac.notarize in electron-builder.json)
       - If no signing certificate -> inform the user "unsigned apps on macOS will show 'cannot verify developer' warning; users need to right-click -> Open to bypass"
       - If signed -> WebSearch to confirm the current electron-builder version's signing and notarization configuration
       - Execute packaging: `pnpm package:mac` (or the project's actual packaging command)
       - Windows: `pnpm package:win`
       - Linux: `pnpm package:linux`
    3. Privacy audit: execute [Privacy Audit] on the packaged output directory
    4. Installation test (prompt the user to take action)
       - macOS: "Please drag from DMG into /Applications to install (do not use cp -R), then launch the app from /Applications"
       - Windows: "Please run the installer, then launch the app from the Start Menu"
       - After providing guidance, pause and wait for the user to confirm whether startup was successful
       - User confirms success -> proceed to smoke test
       - User reports failure -> investigate and repackage
    5. Functional smoke test
       - If Product-Spec.md exists -> test each core feature against the list
       - If not -> verify the app opens normally, main pages load, core operations execute
       - If Playwright is available -> automate critical flow testing

    **CLI Project Release**
    1. Build: `pnpm build` -> verify artifacts
    2. Privacy audit: execute the [Privacy Audit] checklist
    3. Publish
       - npm: confirm npm login (`npm whoami`) -> `npm publish`
       - Binary: use pkg or esbuild to bundle into an executable
    4. Installation test: `npm install -g [package-name]` -> verify the command runs
    5. Functional smoke test: execute each core command one by one, verify correct output

<!-- end: release-strategy -->
<!-- begin: rollback-strategy -->
[Rollback Strategy]
    Rollback methods when issues are discovered after release:

    **Web**:
    - Vercel: `vercel rollback` or roll back to a previous deployment in the dashboard
    - Netlify: select a previous successful deployment in the dashboard and restore
    - Other: re-deploy the previous version's build artifacts

    **Desktop**:
    - Cannot remotely roll back already distributed installation packages
    - Fix -> repackage -> bump version -> re-release
    - If GitHub Release exists -> delete the problematic release, upload the new version

    **CLI**:
    - `npm deprecate [package]@[version] "known issue, please use [new-version]"`
    - Severe issues: `npm unpublish [package]@[version]` (within 72 hours)
    - After fix, bump version and re-publish

[Workflow] — see [Release Strategy] for release methodology and [Rollback Strategy] for recovery.
<!-- end: rollback-strategy -->
    <!-- begin: step-1:-requirements-gathering -->
    [Step 1: Requirements Gathering]
        Ask questions first, then act:

        1. Detect project type (automatic)
           Scan project structure to determine:
           - Has electron-builder config -> Desktop
           - Has next.config / vite.config + no electron -> Web
           - Has bin field in package.json + no frontend framework -> CLI
           - Mixed type (e.g., Electron + Next.js) -> Desktop
           - Cannot determine -> ask the user

        2. Ask the goal
           "Do you want to package or publish?
            - **Package**: only generate build artifacts/installers, do not deploy
            - **Publish**: build + deploy / publish to registry"

        3. Ask the channel (if publishing)
           Web project: "Where do you want to deploy? Vercel / Netlify / Self-hosted / Other?"
           CLI project: "Publish to npm? Or bundle into a binary for distribution?"
           Desktop project: "Upload to GitHub Release? Or some other distribution channel?"

        4. Ask the platform (if Desktop)
           "Which platforms? macOS / Windows / Linux / All platforms?"

        After gathering information, execute [Dependency Check] (only check the tools actually needed).

    <!-- end: step-1:-requirements-gathering -->
    <!-- begin: step-2:-version-confirmation -->
    [Step 2: Version Confirmation]
        Read package.json version
        Ask the user if they need to update the version number
        If yes -> modify package.json -> commit

    <!-- end: step-2:-version-confirmation -->
    <!-- begin: step-3:-build -->
    [Step 3: Build]
        Execute the build command (select the correct command based on project type)
        Verify that build artifacts exist and have no errors
        If there is a packaging step (Desktop) -> execute packaging
        Record the build artifact directory path

    <!-- end: step-3:-build -->
    <!-- begin: step-4:-privacy-audit -->
    [Step 4: Privacy Audit]
        Execute the [Privacy Audit] checklist using the actual artifact directory recorded in Step 3
        Any item fails -> stop, report the issue, wait for fix
        All pass -> continue

    <!-- end: step-4:-privacy-audit -->
    <!-- begin: step-5:-installation-test -->
    [Step 5: Installation Test]
        Web -> visit URL after deployment
        Desktop -> prompt the user to install from the package to the system directory and launch (AI cannot operate DMG installation)
        CLI -> install globally then run

    <!-- end: step-5:-installation-test -->
    <!-- begin: step-6:-smoke-test -->
    [Step 6: Smoke Test]
        Test core features according to project type and Product-Spec.md (if available)
        If Playwright is available -> automate critical flow testing
        Each test includes results

    <!-- end: step-6:-smoke-test -->
    <!-- begin: step-7:-release-confirmation -->
    [Step 7: Release Confirmation]
        Report all test results to the user:
        "**Release Ready Check**

         **Project Type**: [Web / Desktop / CLI]
         **Version**: [version]
         **Build**: Passed, artifact [BUILD_DIR], size [SIZE]
         **Privacy Audit**: No leaks
         **Installation Test**: [installation method] startup normal
         **Smoke Test**: [X/Y] items passed

         Confirm release?"

        After user confirmation:
        - git tag v[version] -> git push --tags
        - If gh CLI available -> create GitHub Release
        - Web -> deploy to production (if not yet deployed)
        - CLI -> npm publish
        - Desktop -> upload installer to GitHub Release or other distribution channel

    <!-- end: step-7:-release-confirmation -->
    <!-- begin: step-8:-post-release-verification -->
    [Step 8: Post-Release Verification]
        - Web -> visit production URL again, confirm it is usable
        - CLI -> `npm install -g [name]@[version]` to install the latest version and verify
        - Desktop -> confirm user installation test passed
        - If issues -> execute [Rollback Strategy]

    <!-- end: step-8:-post-release-verification -->
<!-- begin: yolo-mode -->
[YOLO Mode]
    When FORGE_MODE=yolo, all user confirmation gates use defaults and write reports:

    **Step 1 (Requirements Gathering)** -> Skip questions. Auto-detect project type and use defaults:
        - Package only (no publish)
        - Web: Vercel deploy (if vercel.json exists)
        - CLI: package only, no npm publish
        - Desktop: package all platforms

    **Step 2 (Version Confirmation)** -> Use current version, do not ask.

    **Step 5 (Installation Test)** -> Skip desktop installation wait. Proceed to smoke test.

    **Step 7 (Release Confirmation)** -> Write `changes/release-report.md`:
        Build results, privacy audit results, smoke test results.
        Confirm release automatically. Write tag info to report file.

<!-- end: yolo-mode -->
<!-- begin: initialization -->
[Initialization]
    Execute [Step 1: Requirements Gathering]

<!-- end: initialization -->