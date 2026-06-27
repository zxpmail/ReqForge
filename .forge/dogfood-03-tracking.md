# Dogfood #3 — @forge/ecosystem-cache 追踪表

**项目**：@forge/ecosystem-cache（缓存生态库推荐的 CLI 工具）
**目的**：验证**无 UI 产品 / 纯发布包**路径 + 压力测试 Nature Gate 的小 Phase 边界
**目录**：`C:\work\dogfood-03\`
**技术栈**：TypeScript + Node 22 + Commander + Vitest
**范围**：5 Phases（缓存引擎 → 搜索 → 预填充 → 命令 → 发布），总计 34 项测试，8 个源文件
**交付**：2026-06-27（同一天完成全部 5 个 Phase）

---

## 真正要回答的问题

### Q1：无 UI 路由是否如预期跳过了设计链？

**结论**：✅ 是，Product-Spec 中标注 `无 UI` 后，没有启动 design-brief-builder 或 design-maker，直接进入了 dev-planner。

**但注意**：本次 dogfood 在**框架仓库会话内**运行，不是独立 forge-install 后的项目。所以 `startup-check.md` 的无 UI 路由在路径选择上是正确的，但未经过 `spec-before-code` gate 的真实拦截测试。

### Q2：发布路径（release-builder / npm publish）是否可用？

**结论**：⚠️ 部分验证。`pnpm publish --dry-run` 成功（30 files, 15.9kB），但：
- 未经过实际 `npm publish`（需要登录认证）
- 未通过 `release-builder` 技能发布
- `type: "module"` + Commander ESM bin 入口的全局安装路径未测试

### Q3：Nature Gate 的 implementer 隔离在小项目是否过度？

**结论**：✅ **是**。全部 5 Phase 均为 Backend Nature，按原规则应 dispatch implementer。实际全部由主 session 直接编写（Phase 2-4 只是测试 + 小修改）。证明 Phase 大小比 Phase Nature 更能预测 isolate 成本。

**修复**：Nature Gate 增加了 Size pre-check（`workflow.md` § Step 1.5）：≤3 key files + ≤5 deliverables = Small Phase，跳过 implementer。

---

## 发现

### F1 — 框架 dogfood ≠ 用户 dogfood（最严重）

Dogfood #2 在 `C:\work\dogfood-02\` 通过 `forge-install` 安装后运行，发现了 S1（Windows install 问题）。Dogfood #3 全程在 ReqForge 框架仓库会话内运行，目标目录未安装 forge：

- 无 `check-evolution` 启动注入
- 无 `spec-before-code` gate 拦截
- 无 `hallucination-gate` 检查
- 无反馈循环触发

**这意味着 #3 测试的是流程/结构，不是钩子/闸门的强制力。** 与 #2（冷启动安装）相反，#3 的冷启动盲区没有被暴露。下次 dogfood 必须走 forge-install 完整路径。

### F2 — Greenfield CLI 的 Phase 离散度低

5 Phase 中 Phase 2 实际上交付了 plan 中 Phase 2-4 的所有 CLI 代码（search/prefill/list/clear/stats 全部在 bin.ts 一次完成）。dev-builder 的 Task 粒度设计假设每个 Phase 有多个 Task，但对 Small CLI 来说 1 Phase = 1 个逻辑单元。

### F3 — 发布路径仍未被端到端测试

`prepublishOnly` 脚本已配置，CI 已写，但未经过：
1. `release-builder` 技能调用
2. 实际 `npm publish`
3. 全局安装后 `ecosystem-cache --help` 验证
4. ESM bin 入口在 Node 22 上的运行时兼容性

---

## 框架改进

### Shipped（本次 dogfood 直接产出）

- **Nature Gate Size pre-check**（`workflow.md` § Step 1.5）：Small Phase（≤3 key files + ≤5 deliverables）跳过 implementer，主 session 直接写。
- **sub-agent-isolation.md**：决策表增加 Size 维度。
- **dev-builder SKILL.md HARD-GATE**：增加 Small Phase Exception。
- **forge-smoke 13/13**，sync 0 drift，同步 4 adapter。

### 建议（不在本次 dogfood 范围内）

- 未来 dogfood 必须走 **forge-install 完整安装路径**，不能从框架仓库会话内驱动
- 考虑 `phase-completion-assessment.md` 中加入 Phase 粒度调优指导
- 发布路径加入 `release-builder` 的端到端 smoke（`pnpm publish --dry-run` 已在 CI 中可用）

---

## 侧边发现

### S1 — publish dry-run 无 npm auth 也能验证

`pnpm publish --dry-run` 不需要 npm 登录，能验证 tarball 内容、bin 入口、files 白名单、版本号等元数据。可以作为 forge-smoke 的一步低成本验证加到框架自身的发布前检查。

### S2 — 34 测试 / 8 源文件 / 728ms

dogfood #3 项目的测试性能：8 个源文件、34 项测试、728ms 完成。测试效率高（mockable Searcher 接口使搜索测试不需要网络依赖）。
