# Dogfood #2 — reading-tracker 追踪表

**项目**：reading-tracker（读书追踪 Web 应用）
**目的**：验证 implementer 隔离临界点假设 + 顺带验证近期框架改动
**目录**：`C:\work\dogfood-02\`
**技术栈**：Vite + React + Node + SQLite
**范围**：单用户 + 多 Profile + CRUD + 笔记 + 标签 + 搜索 + 分页 + 导入 + 导出 + 趋势图
**预计规模**：4 Phases / ~15 Tasks / 5 天

---

## 真正要回答的 6 个问题

跑完每个 Phase 后回来填一笔。**这是 dogfood 的目的，不是产品本身。**

### Q1-Q3：核心验证 — implementer 隔离要不要加临界点检测？

| # | 问题 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | 最终判定 |
|---|---|---|---|---|---|---|
| Q1 | implementer 隔离**有没有**防住漂移？（主 session 是否仍清晰） | _待填_ | _待填_ | _待填_ | _待填_ | _待填_ |
| Q2 | UI 类代码 implementer 是否**反而拖慢**（要重新读组件上下文）？ | — | — | _待填_ | _待填_ | _待填_ |
| Q3 | 主 session 触发 `/clear` 几次？ | _待填_ | _待填_ | _待填_ | _待填_ | 0=过度 / ≥2=必要 |

**最终判定规则**：
- Q3 = 0 次 + Q2 = 拖慢 → implementer 隔离**需要加临界点检测**
- Q3 ≥ 2 次 + Q1 = 防住了 → 当前设计**正确**，不动
- 其他组合 → 写 case study 解释

### Q4-Q6：顺带验证近期改动

| # | 问题 | 验证对象 | 结果 |
|---|---|---|---|
| Q4 | surface-aware routing 在 Web UI 项目是否如预期触发 design-maker？ | `9c7fcd6` | _待填_ |
| Q5 | `spec-confirmed.json` + `plan-confirmed.json` 双 gate 在 5 天项目里是否仍是噪音？ | size detection (`064ba4e`) | _待填_ |
| Q6 | 强制 implementer + worktree 在每个 Phase 的开销占比？ | sub-agent-isolation 设计 | _待填_ |

---

## Phase 进度（跑完一个填一个）

### Phase 1 — 后端：DB schema + CRUD
- [ ] 完成
- 用时：___
- implementer 调用次数：___
- 主 session context 状态：___
- Q1 笔记：___
- 突发问题：___

### Phase 2 — 后端：搜索 / 分页 / 标签 / 导入
- [ ] 完成
- 用时：___
- implementer 调用次数：___
- 主 session context 状态：___
- Q1 笔记（隔离收益是否首次显著？）：___
- 突发问题：___

### Phase 3 — 前端：列表 + 详情 + 编辑器
- [ ] 完成
- 用时：___
- implementer 调用次数：___
- Q2 笔记（UI 代码 implementer 是否反拖？）：___
- 突发问题：___

### Phase 4 — 前端：统计页 + 趋势图 + 导出
- [ ] 完成
- 用时：___
- implementer 调用次数：___
- Q2 笔记：___
- 突发问题：___

---

## 最终 Dogfood 报告（全部跑完后填）

**总用时**：___ 天
**总 Phase 数**：___
**总 Task 数**：___

### 核心判定：implementer 隔离是否需要加临界点检测？

- [ ] **需要** — 跑数据证明小 Phase 隔离是纯开销
- [ ] **不需要** — 跑数据证明当前 MANDATORY 设计正确
- [ ] **存疑** — 需要更多 dogfood 数据

**证据**：___

### 框架改进提案（如果有）

1. ___
2. ___

### 写入 memory 的关键发现

> ___

---

## 启动步骤

1. `mkdir C:\work\dogfood-02` （或 `mkdir /c/work/dogfood-02`）
2. `cd C:\work\dogfood-02`
3. 启动 `/product-spec-builder`
4. 每完成一个 Phase，回来填一笔

---

## 副发现（Side Findings）

> 不属于上面 6 个核心问题，但 dogfood #2 流程中发现的真实框架问题。**每条都证明 dogfood 流程本身在产生价值。**

### S1 — `forge-install` Windows 默认检测失效（2026-06-25 启动阶段发现）

**现象**：在 Windows 上 `pnpm forge-install claude-code --target <dir>`（不带 `--windows`）后，`.claude/settings.json` 是 Unix 版（`bash` + `.sh`），所有 hook 静默失效。

**根因**：`scripts/install.ts:parseInstallArgs` 把 `windows` 默认设为 `false`，而 `installForge` 用 `options.windows ?? process.platform === "win32"` 想做平台 fallback —— `false` 不是 `undefined`，`??` 永远走不到 fallback。

**影响**：v1.14.2（2026-05-20）引入，到 v1.48.3 没人发现。任何在 Windows 上首次跑 forge-install 但没看文档加 `--windows` 的用户，hooks 全是死的（包括 spec-before-code gate、hallucination gate、phase-exit guard 等所有关卡）。

**为什么 1 个月没发现**：
- 测试 `install.test.ts` 只覆盖显式 `windows: true`，没测"省略 `--windows` 时默认行为"
- dogfood #1（gitlog2report）是 CLI 项目，可能根本没装 hooks 就跑了
- 框架自己的 ReqForge 仓库早就装好了，不会重新触发 install

**修复**：`parseInstallArgs` 默认改为 `process.platform === "win32"`（CLI 层）。+2 测试覆盖默认行为。已发 v1.48.4。

**对 dogfood 论点的支持**：这证明"dogfood 必须真跑用户路径"——开发者自己的环境永远是热缓存，跑不出首次安装问题。

---

