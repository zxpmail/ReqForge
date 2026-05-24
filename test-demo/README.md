# test-demo — ReqForge 黄金路径示范

> **性质**：框架仓库内的 **living demo**，对标 nanochat 的 `runs/speedrun.sh` —— 证明 Forge 工作流能产出可构建、可测试、可运行的代码。**不是** ReqForge 架构 Phase，也不随 `forge-install` 复制到用户项目。

---

## 这是什么

本目录展示 **ReqForge 走完全流程后会留下什么**，而不是提供一个要你日常使用的工具。

| 工件 | 路径 | 怎么来的 |
|------|------|----------|
| 产品规格 | [Product-Spec.md](./Product-Spec.md) | `/product-spec-builder` |
| 开发计划 | [DEV-PLAN.md](./DEV-PLAN.md) | `/dev-planner` |
| **业务代码（产物）** | [todo-cli/](./todo-cli/) | `/dev-builder` 按 Spec + Plan **生成/实现** |

**`todo-cli/` 是什么**：`Product-Spec.md` + `DEV-PLAN.md` 经 ReqForge 开发流程后的 **示范产物**（示例 Todo 命令行程序）。  
**它有什么用**：对最终用户 **几乎没有独立价值** —— 不是 ReqForge 的 CLI，不是框架依赖，不需要安装使用。唯一用途是：

1. **对照**：看 Spec/Plan 落地后代码长什么样、放在哪个子目录  
2. **守门**：`pnpm test-demo-golden-path` / `forge-smoke` 用它验证「流程能交付可跑代码」

你要用的是 **Forge 本身**（复制 adapters、调 Skill）；`todo-cli` 只是仓库里的 **回归样例**，可忽略。

Loadout 选型（示范时）：**`cli-tool`**。

---

## 黄金路径（Forge 工作流）

```text
Product-Spec.md  ──product-spec-builder──┐
                                         ├──►  todo-cli/  （产物，非框架组件）
DEV-PLAN.md      ──dev-planner───────────┤
                                         │
                 ──dev-builder───────────┘
验收：pnpm test-demo-golden-path（build + test + CLI 冒烟）
```

本目录 **已走完上述路径**，供维护者与贡献者对照 README Step 4，无需每次从零生成。

---

## 如何验证（守门脚本）

在 **ReqForge 仓库根目录**（维护者 / CI）：

```bash
pnpm test-demo-golden-path
# 或
node test-demo/run-golden-path.mjs
```

脚本会：

1. 检查 `Product-Spec.md`、`DEV-PLAN.md`、`todo-cli/` 存在
2. 在 `todo-cli/` 执行 `pnpm install` → `pnpm build` → `pnpm test`
3. 在临时目录跑 CLI 冒烟：`add` → `list` → `complete` → `delete`（无需 AI API Key）

**CI**：`forge-smoke` 第 12 项会调用本脚本。

普通用户 **不必** 进入 `todo-cli/` 或使用 `todo` 命令。

---

## 目录结构

```text
test-demo/
├── README.md              ← 本文件
├── run-golden-path.mjs    ← 黄金路径守门（维护者 / CI）
├── Product-Spec.md        ← 需求输入（Forge 产物之一）
├── DEV-PLAN.md            ← 计划输入（Forge 产物之一）
└── todo-cli/              ← 代码产物（Forge 输出；无独立产品用途）
```

`.claude/` 下若有 feedback/skills 片段，仅为进化示范，**不参与**黄金路径守门。

---

## 维护责任

| 变更类型 | 维护者动作 |
|----------|------------|
| 改 Forge Skill/模板导致 demo 过时 | 更新 Spec/Plan 或 `todo-cli/`，跑 `pnpm test-demo-golden-path` |
| 改 `test-demo/` 结构 | 同步更新 `scripts/forge-smoke/test-demo-golden-path.mjs` 与本文 |
| 发版 / 合并 PR（触及 demo） | `pnpm test` + `pnpm forge-smoke`（含本黄金路径） |

详见 [nanochat-comparison.md](../core/docs/nanochat-comparison.md) 与 [scripts/forge-smoke/README.md](../scripts/forge-smoke/README.md)。
