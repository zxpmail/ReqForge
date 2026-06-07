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

## Step 6b: 自审回合（Self-review）

After smoke test passes, before release confirmation, perform a **single self-review pass** on the release artifacts.
Since the build output was just produced, attention is still hot — issues are easier to spot now than after switching context.

**自审指令**:
```
请评审你刚才生成的发布，重点关注：
1. 版本一致性：package.json / CHANGELOG / git tag 三者一致？
2. 缓存污染：有疑问时 rm -rf dist && rebuild 过？
3. 隐私泄漏：grep 确认无 /Users/、API_KEY、sk-ant-？
4. CHANGELOG.md 已更新发布说明？
5. 回滚策略已定义？（怎么回滚 + 几分钟 + 数据库迁移是否可逆）
```

**处理结果**：
- 发现可自修问题 → 在当前回合直接修复
- 发现需要阻塞的问题 → 退回修复后再发布
- 无问题 → 继续下一步

**注意**：自审不是 post-release verification 的替代品。它的目的是在发布前用热上下文捕获那些"出去后也能发现，但修复成本更高"的问题。

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
