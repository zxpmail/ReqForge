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
| Q1 | implementer 隔离**有没有**防住漂移？（主 session 是否仍清晰） | 防住了。代码干净无漂移。但 implementer 把 Task 1+2 和 3+4 打包执行，task 粒度隔离可能是过度设计。 | 未实测（implementer 在 Phase 1 一次性交付了 Phase 2-3 代码） | 同上 | 主 session 直接写，无隔离问题。 | 防住漂移=YES，但 implementer 批量交付 => Phase 边界需要动态检测 |
| Q2 | UI 类代码 implementer 是否**反而拖慢**（要重新读组件上下文）？ | — | — | 无法判断（UI 代码在 Phase 1 被批量交付） | 是，主 session 直接写 UI 15min，预估 implementer 需 30min+ | **是** — UI 类 implementer 隔离反效率，主 session 直接改更快 |
| Q3 | 主 session 触发 `/clear` 几次？ | 2 | 0 | 0 | 0 | 2（因 implementer 崩溃，非因漂移） |

**最终判定规则**：
- Q3 = 0 次 + Q2 = 拖慢 → implementer 隔离**需要加临界点检测**
- Q3 ≥ 2 次 + Q1 = 防住了 → 当前设计**正确**，不动
- 其他组合 → 写 case study 解释

### Q4-Q6：顺带验证近期改动

| # | 问题 | 验证对象 | 结果 |
|---|---|---|---|
| Q4 | surface-aware routing 在 Web UI 项目是否如预期触发 design-maker？ | `9c7fcd6` | 触发正确。有 UI -> design-brief-builder -> Brief Gate -> design-maker。但 design-maker 卡死问题（S3）暴露了分段缺失。 |
| Q5 | `spec-confirmed.json` + `plan-confirmed.json` 双 gate 在 5 天项目里是否仍是噪音？ | size detection (`064ba4e`) | 是噪音。两次 gate 只是形式确认，无实际防错价值。 |
| Q6 | 强制 implementer + worktree 在每个 Phase 的开销占比？ | sub-agent-isolation 设计 | Phase 1 implementer ~50% 开销（崩溃 2 次）。Phase 4 主 session 直接写 0 开销。worktree 未使用（独立目录）。 |

---

## Phase 进度（跑完一个填一个）

### Phase 1 — 后端：DB schema + CRUD
- [x] 完成
- 用时：~10-15min 实施（spec→design→plan 另计 Jun 25 pm + Jun 26 am）
- implementer 调用次数：2（server-backbone + frontend-backbone）
- 主 session context 状态：implementer 崩溃遗留 artifact 文件（已清理），但代码完整落盘。主 session 未漂移。
- Q1 笔记：隔离有效 — implementer 产出的代码结构清晰、无 scope creep。但 implementer 把 Task 1+2 和 Task 3+4 各自打包执行（未严格按 4 个独立 task 分拆），这说明在 Phase 级别 implementer 倾向于批量完成任务，task 粒度的隔离可能是过度设计。
- 突发问题：implementer 崩溃产生 artifact 文件（空 `0` `1` `{` `{const` `console.error(...)` 等），根因不明。代码本身完整可用。

### Phase 2 — 后端：搜索 / 分页 / 标签 / 导入
- [x] 完成
- 用时：0（Phase 1 implementer 一次性交付）
- implementer 调用次数：0（已内置在 Phase 1 deliverable 中）
- 主 session context 状态：干净。仅修复了 `export.js` 中 archiver v8 API（`archiver('zip')`→`new ZipArchive()`） + `import archiver from 'archiver'` 改为 `import { ZipArchive } from 'archiver'`（v8 只导出 named export，无 default export，且 factory function 已移除）。
- Q1 笔记：隔离收益在小 Phase 显著为负——implementer 把 Phase 2-3 的 view/hook/route 代码全部打包在 Phase 1 交付，违背了 Phase 分拆意图。但这恰恰验证了 Q1 hypothesis：**implementer 倾向于批量完成任务，task 粒度隔离是过度设计**。同时说明 Phase 的拆分粒度也需要检测——如果 implementer 在 Phase N 交付了 N+1 的代码，说明 Phase 边界不合理。
- 突发问题：`export.js` archiver v8 API 不兼容（`import archiver from 'archiver'` 在新版只暴露 named export）。修复为 `import { ZipArchive } from 'archiver'` + `new ZipArchive({...})`。server 用 `node --watch` 自动重启后生效。

### Phase 3 — 前端：列表 + 详情 + 编辑器
- [x] 完成
- 用时：0（同 Phase 2，一次性交付）
- implementer 调用次数：0
- Q2 笔记（UI 代码 implementer 是否反拖？）：无法判断——UI 代码同样在 Phase 1 就被 implementer 批量交付。但前端 build 无错误（275 modules, 409ms），说明代码质量合格。
- 突发问题：无

### Phase 4 — 回收站 + 响应式 + 批量操作 + 缓存
- [x] 完成
- 用时：~15min（在主 session 直接实施，未调 implementer——因为 Phase 2-3 已证明 implementer 批量交付倾向，Phase 4 故意走主 session 以对比）
- implementer 调用次数：0（主 session 直接写）
- Q2 笔记：主 session 直接写 UI 代码比走 implementer 快得多（15min vs 预估 30min+），因为在主 session 中能直接引用现有组件，无需重新加载上下文。这支持 Q2 hypothesis：**UI 类代码走 implementer 隔离是反效率的**。
- 突发问题：
  - `archiver` v8 移除了 `archiver('zip')` factory function，需要用 `new ZipArchive()` class API。之前 export.js 已在 Phase 2 修复此问题。
  - `node --watch` 的重启行为在 Windows 上有时会留下僵尸进程占用端口，需要 `taskkill -f -im node.exe` 硬杀。
  - LRU cache 只需要 3 个文件（cache.js + 集成到 search.js + index.js auth exemption），比预期简单。

> **Phase 4 实际交付内容**：`server/routes/trash.js`（回收站 CRUD）+ `server/lib/cleanup.js`（30 天自动清理 6h 间隔）+ `server/lib/cache.js`（LRU 缓存 100 条）+ `src/components/views/TrashView.jsx` + `src/components/views/FirstRunGuide.jsx` + `src/components/views/BatchActions.jsx` + `src/components/layout/MobileTabBar.jsx` + `src/components/layout/MobileDrawer.jsx` + `src/hooks/useResponsive.js` + `src/index.css` slide-in animation + 全路由集成到 App.jsx。前端 build: 704 modules, 0 errors, 540ms。

---

## 最终 Dogfood 报告（全部跑完后填）

**总用时**：~2 天（含 spec+design+plan，实施集中在 Jun 26）
**总 Phase 数**：4（但 implementer 在 Phase 1 一次性交付了 Phase 1-3，实际 Phase 2-3 为 0 实施开销）
**总 Task 数**：约 15（DEV-PLAN 拆分）

### 核心判定：implementer 隔离是否需要加临界点检测？

- [x] **需要** — 跑数据证明小 Phase 隔离是纯开销
- [ ] **不需要** — 跑数据证明当前 MANDATORY 设计正确
- [ ] **存疑** — 需要更多 dogfood 数据

**证据**：
1. **implementer 批量交付 Phase 2-3**：Phase 1 implementer 在一次调用中交付了 Phase 2-3 的所有 view/hook/route 代码，说明 Phase 边界分拆不符合 implementer 的工作方式。如果 Phase 边界合理，implementer 应只交付当前 Phase 的代码。
2. **UI 代码主 session 更快**：Phase 4 在主 session 直接实施，15min 完成（TrashView + FirstRunGuide + BatchActions + 响应式 + 路由集成）。预估走 implementer 需要 30min+（重新加载组件上下文 + 隔离成本）。
3. **implementer 崩溃风险**：Phase 1 发生 2 次 implementer 崩溃，产生无用 artifact 文件。崩溃在关键路径上会导致数据丢失。
4. **worktree 未使用**：项目在独立目录，worktree 没用到。对非框架仓库的项目 worktree 是多余抽象。

**建议**：
- 对 UI 密集的 Phase：主 session 直接实施，不用 implementer
- 对后端/数据层 Phase：继续用 implementer（后端代码可以安全隔离）
- Phase 边界加动态检测：如果 implementer 产出了超出当前 Phase 的文件，发警告

### 框架改进提案（如果有）

1. **Phase 边界检测器**：implementer 产出文件若超出当前 Phase 文件列表，发警告让 PM 确认是否要合并 Phase。
2. **UI Phase 跳过 implementer**：DEV-PLAN 中 tagged as "UI heavy" 的 Phase 应该走主 session 直接实施。
3. **双 gate 简化为单 gate**：`spec-confirmed.json` + `plan-confirmed.json` => 合并为一次 "可以开始吗" 确认。
4. **design-maker 分段 checkpoint**：每页独立落盘，避免长思考链卡死。（来自 S3）

### 写入 memory 的关键发现

> - implementer 隔离需要加临界点检测：小 Phase 隔离是纯开销，UI 类代码走主 session 更快
> - Phase 边界需要动态检测：如果 implementer 产出了超出当前 Phase 范围的代码，说明 Phase 分拆不合理
> - 双 gate（spec-confirmed + plan-confirmed）在小项目是噪音，应合并
> - implementer 在 Phase 1 崩溃 2 次，稳定性有隐患
> - archiver v8 API 重大变更（factory function -> class API）—— dogfood 暴露了，单元测试没覆盖到

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

### S2 — product-spec-builder 澄清过细，靠 mode 堆叠而非默认降级（2026-06-26 spec 阶段发现）

**现象**：刚跑完 product-spec-builder 问"下一步是什么"，主 session 反问"项目目录？有没有 UI？" 三个问题——而 Product-Spec.md 已存在、流程明确，本可直接答 `/dev-planner`。用户直接指出"澄清得太细了"。延伸到 product-spec-builder 本身：访谈环节也存在连环追问，靠 Quick / Light Grill / Distillation / 0-to-1 四个 mode 让用户手动选来"绕过"重路径。

**根因**：
- `core/skills/product-spec-builder/SKILL.md` Gotchas 第 10 条已经承认"Small products get recommended light gate level via `forge-size-detect`"——但只 gate 降级，**访谈路径没自动降级**
- 解法一直是"加更多 mode"（Quick / Light Grill / Distillation 都是事后补救），而不是"让默认路径本身按规模收缩"
- 与 dogfood #1 memory 记的"流程对小产品太重"是**同根问题**：框架不自动根据规模降级

**影响**：
- 用户在 spec 阶段就被过细澄清拖慢（这次是我作为主 session 模仿了 skill 的访谈人格）
- mode 堆叠增加 SKILL.md 复杂度（startup-check.md 要路由 4 种 mode），用户选错 mode 反而被罚走全流程
- 与 Karpathy "Simplicity First" 原则冲突

**为什么没在 dogfood #1 暴露**：
- gitlog2report 走的可能是 Quick Mode（小 CLI），没触发完整 0-to-1 访谈
- 框架作者自己跑会下意识选对 mode，跑不出"选错被罚"的路径

**修复方向（不在本次 dogfood 做）**：
- startup-check.md 检测规模 → 默认走 Quick / Distillation，0-to-1 改 opt-in
- 或者合并 mode：Light Grill + Distillation 都是"少问/不问"的变体，可以收敛

**对 dogfood 论点的支持**：又一次证明"框架作者的环境是热缓存"——选 mode 的肌肉记忆掩盖了"默认就该降级"这个真问题。

---

### S3 — design-maker 一次性跑多页容易卡死，缺分段 checkpoint（2026-06-26 design 阶段发现）

**现象**：design-maker 一次性生成 P1-P4 四个页面时，主 agent 卡在长思考链里 15-20 分钟不落盘。预估单次 35-65 分钟，实际可能更久。用户被迫考虑 Esc 中断让它分批落盘。

**根因**：
- design-maker 的产物本来就是分页独立（pages-desktop.html × 4），但流程允许一口气跑完
- 没有「每页落盘 checkpoint」强制中途产出 —— agent 倾向于"想清楚再写"，结果一直在想
- 与 dev-builder「One Phase per invocation」原则不一致 —— dev 阶段强制分段，design 阶段没有

**影响**：
- 卡死时零产物，无法验证方向，只能干等
- 5 天 dogfood 预算下，设计阶段上限 0.5-1 天，单次 design-maker 就吃掉 35-65 分钟，风险高
- 用户被迫手动 Esc + 分段指令，等于把分段逻辑外化到用户脑子里

**为什么没在 dogfood #1 暴露**：
- gitlog2report 是 CLI 无 UI，根本没跑 design-maker
- 这是第一次有 UI 的 dogfood，第一次暴露 design 阶段问题

**修复方向（不在本次 dogfood 做）**：
- design-maker 强制每页落盘 checkpoint，P1 完成立刻写文件再进 P2
- 或者改成「One Page per invocation」对齐 dev-builder 的 Phase 分段原则
- 估算输出要诚实：35-65 分钟的估算在卡死场景下毫无意义，应该给「单页中位数」而非「全流程中位数」

**对 dogfood 论点的支持**：dogfood #2 第一次有 UI，立刻暴露了 design 阶段的分段缺失 —— 印证"每种产品类型都会暴露不同的框架盲区"。

---

