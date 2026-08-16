# forge-smoke — 框架仓库静态测试

> **性质**：ReqForge **本仓库**的 smoke 测试套件，不是 Harness 架构组件，也不跑在用户项目里。  
> **与 Vitest 分工**：`pnpm test` = 脚本逻辑单元测试；`pnpm forge-smoke` = 仓库结构/同步/文档/CI 的静态守门。

## 运行

```bash
pnpm forge-smoke          # 约 15–40 秒，16/16 为通过（含 test-demo 黄金路径）
node scripts/forge-smoke/run-all.mjs
```

CI：`.github/workflows/forge-smoke.yml`（push/PR，无 cron）。

## 16 项 smoke

| # | 脚本 | 测什么 |
|---|------|--------|
| 1 | `workflows-compliance.mjs` | `.github/workflows/` 无 schedule/cron；触发器合规 |
| 2 | `platform-compliance-doc.mjs` | `platform-compliance.md` 关键章节存在 |
| 3 | `machine-gates-doc.mjs` | `CLAUDE.md` 含四门 Machine Gates；Overstepping 程序式 vs hook deferred 表述诚实 |
| 4 | `package-integrity.mjs` | `package.json` 结构 + scripts/bin/files 引用存在 |
| 5 | `policy-witness-quorum.mjs` | `.forge/policy-version.json` + **3-of-4** 见证收据（f=1 交点）；第二根/缺收据挡绿 |
| 6 | `templates-present.mjs` | 核心输出模板存在且有关键章节 |
| 7 | `agents-complete.mjs` | `full` loadout 引用的 agent 均在 `core/agents/` |
| 8 | `hooks-wired.mjs` | `full` loadout 10 个 hook 在 `core/hooks/` 有实现 |
| 9 | `stop-gate-wired.mjs` | Stop 生命周期钩子接线完整 |
| 10 | `skill-fixtures.mjs` | `tests/skill-fixtures/` 静态探针对照 SKILL 正文 |
| 11 | `skill-bypass.mjs` | 带 command 的 Skill 在 `CLAUDE.md` Dispatch 可发现 |
| 12 | `loadouts-valid.mjs` | 4 个 loadout JSON 合法、引用存在、`scenarios[]` 合法 |
| 13 | `adapters-sync.mjs` | `core/skills` 与四端 adapter 技能目录名一致 |
| 14 | `skills-complete.mjs` | 15 个 Skill + `validate-skill.mjs` 通过 |
| 15 | `test-demo-golden-path.mjs` | `test-demo/` 黄金路径：Spec/Plan + todo-cli build/test/CLI 冒烟 |
| 16 | `grovel-baseline.mjs` | Grovel Index：文件存在 + JSON valid + 基线值范围（不调 LLM） |

跳过第 15 项（离线/无 pnpm）：`SKIP_TEST_DEMO_GOLDEN=1 pnpm forge-smoke`

每项在**独立子进程**运行，避免状态污染。

## 何时跑

| 场景 | 命令 |
|------|------|
| 改 `core/`、`adapters/`、loadout、forge-smoke 后 | `pnpm sync` → `pnpm forge-smoke` |
| 发版 / 合并 PR 前 | `pnpm test`（含 smoke **registry**）+ `pnpm forge-smoke`（执行 15 项） |
| 新增 GitHub workflow | 确保无 cron；跑 smoke 验证 |
| 增减 smoke 脚本 | 只改 `scripts/forge-smoke/lib.mjs` 的 `SMOKES`，并更新本表 |

## 不算什么的

- 不是用户项目的 TDD / 业务测试（那是 `dev-builder` + 用户 `pnpm test`）
- 不是 Harness 七层里的「运行时 hook」
- 不启动 AI 客户端、不调用 LLM
