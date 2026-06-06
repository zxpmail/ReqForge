# Workflow（release-builder）

**Release 前必读** `references/first-principles.md`。按序执行以下步骤；策略细节见 `references/release-strategy.md`。

## Step 1: Requirements Gathering

Ask questions first, then act:

1. Detect project type (automatic) — electron-builder → Desktop; next/vite without electron → Web; bin field only → CLI; mixed → Desktop; unclear → ask user
2. Ask goal — **Package** (artifacts only) vs **Publish** (deploy/registry)
3. Ask channel if publishing — Web: Vercel/Netlify/self-hosted; CLI: npm or binary; Desktop: GitHub Release or other
4. Ask platform if Desktop — macOS / Windows / Linux / all

After gathering, execute [Dependency Check] for tools actually needed.

## Step 2: Version Confirmation

Read package.json version; ask if bump needed; if yes → run `pnpm forge-release version [patch|minor|major]` to auto-bump → commit

## Step 3: Build

Run build (and Desktop packaging if applicable); verify artifacts; record `[BUILD_DIR]`

## Step 3b: Preflight Gate

```bash
pnpm preflight --build-dir [BUILD_DIR]
```

- Exit **0** → continue. Exit **1** → **stop**, fix, rebuild, re-run
- Customize via `.forge/preflight.json`
- Do **not** publish or tag while preflight is blocked

## Step 4: Privacy Audit

Execute `references/release-checklist.md` § Privacy Audit on `[BUILD_DIR]`. Any fail → stop and fix.

## Step 5: Installation Test

- Web → visit URL after deployment
- Desktop → user installs from package to system directory and launches
- CLI → `npm install -g` then run

## Step 6: Smoke Test

Test core features per Product-Spec.md if available; Playwright if available; record each result

## Step 7: Release Confirmation

Report Release Ready Check to user; after confirm:
- Run `pnpm forge-release tag` to create git tag + push
- gh CLI → GitHub Release if available
- Web → production deploy if not yet done
- CLI → `npm publish`
- Desktop → upload installer

## Step 8: Post-Release Verification

Re-verify production/install; on failure → `references/rollback-strategy.md`

**YOLO path** → `references/yolo-mode.md`

**Branch finish options** → `references/finishing-branch-checklist.md`
