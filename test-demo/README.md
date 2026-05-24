# test-demo — ReqForge 黄金路径示范

> **性质**：框架仓库内的 **living demo**，对标 nanochat 的 `runs/speedrun.sh` —— 证明 Forge 工作流能产出可构建、可测试、可运行的产品。**不是** ReqForge 架构 Phase，也不随 `forge-install` 复制到用户项目。

---

## 这是什么

一个完整的 **Todo CLI** 示范工程，展示 Forge 从需求到可运行代码的典型产物：

| 工件 | 路径 | 对应 Skill |
|------|------|------------|
| 产品规格 | [Product-Spec.md](./Product-Spec.md) | `/product-spec-builder` |
| 开发计划 | [DEV-PLAN.md](./DEV-PLAN.md) | `/dev-planner` |
| 业务代码 | [todo-cli/](./todo-cli/) | `/dev-builder` |

Loadout 选型：**`cli-tool`**（无 UI 设计 Skill，含完整钩子）。

---

## 黄金路径（Forge 工作流）

```text
1. /product-spec-builder  →  Product-Spec.md
2. /dev-planner           →  DEV-PLAN.md
3. /dev-builder           →  todo-cli/（TypeScript + Vitest + Commander）
4. 验收                    →  pnpm test + CLI 冒烟（见下方守门脚本）
```

本目录 **已走完上述路径**，供维护者与贡献者对照 README Step 4，无需每次从零生成。

---

## 如何验证（守门脚本）

在 **ReqForge 仓库根目录**：

```bash
pnpm test-demo-golden-path
# 或
node test-demo/run-golden-path.mjs
```

脚本会：

1. 检查 `Product-Spec.md`、`DEV-PLAN.md`、`todo-cli/` 存在
2. 在 `todo-cli/` 执行 `pnpm install` → `pnpm build` → `pnpm test`
3. 在临时目录跑 CLI 冒烟：`add` → `list` → `complete` → `delete`（无需 AI API Key）

**CI**：`forge-smoke` 第 10 项 `test-demo-golden-path` 会调用本脚本（需 Node 22 + pnpm）。

---

## 目录结构

```text
test-demo/
├── README.md              ← 本文件
├── run-golden-path.mjs    ← 黄金路径守门（维护者跑）
├── Product-Spec.md        ← 需求真相
├── DEV-PLAN.md            ← Phase 与验收
└── todo-cli/              ← 可运行 CLI 项目
    ├── src/
    ├── package.json
    └── README.md          ← 用户向使用说明
```

`.claude/` 下若有 feedback/skills 片段，仅为进化示范，**不参与**黄金路径守门。

---

## 维护责任

| 变更类型 | 维护者动作 |
|----------|------------|
| 改 Forge Skill/模板导致 demo 过时 | 更新 Spec/Plan 或 `todo-cli/`，跑 `pnpm test-demo-golden-path` |
| 改 `test-demo/` 结构 | 同步更新 `scripts/forge-smoke/test-demo-golden-path.mjs` 与本文 |
| 发版 / 合并 PR（触及 demo） | `pnpm test` + `pnpm forge-smoke`（含本黄金路径） |

详见 [nanochat-comparison.md](../core/docs/nanochat-comparison.md)（speedrun 纪律）与 [scripts/forge-smoke/README.md](../scripts/forge-smoke/README.md)。

---

## 本地试用 todo-cli

```bash
cd test-demo/todo-cli
pnpm install
pnpm build
node dist/index.js add "我的第一个任务"
node dist/index.js list
```

AI 分类可选：设置 `AI_API_KEY`；未设置时默认 `feature` 类别。
