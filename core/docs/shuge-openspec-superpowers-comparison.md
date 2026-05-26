# ReqForge 与「OpenSpec + Superpowers」实战对照

> 参考：[从零到一：OpenSpec + Superpowers 新项目全流程实战指南](https://mp.weixin.qq.com/s/7EpVsLbFznkngJbD7tFA9A)（术哥无界 · AI 编程最佳实战 2026 第 19 篇）  
> 与 [openspec-comparison.md](./openspec-comparison.md)、[superpowers-comparison.md](./superpowers-comparison.md) 互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **文章方案** | 用户自行拼装 **OpenSpec**（立法：规约 + Delta 变更）+ **Superpowers**（执法：TDD + 子 Agent + 三级审查） |
| **ReqForge** | 把「做什么 + 怎么做 + 机器门 + 多客户端」合成 **一条 Harness**，无需双插件主流程 |

文章用看板系统演示：**OpenSpec 产物是 Superpowers 的输入**——通过文件系统 Markdown 握手，不依赖 API。

---

## 工具链 ↔ Forge Skill 映射

| 文章角色 | 工具/机制 | ReqForge 对应 | 说明 |
|----------|-----------|---------------|------|
| 立法 | OpenSpec `openspec/changes/` + Delta | `/change-manager` → `changes/<name>/` | propose → apply → verify → archive |
| 全局真相 | `specs/` 主规约 | `Product-Spec.md` | 0→1 与归档回写目标 |
| 立法（0→1） | OpenSpec init + config | `/product-spec-builder` + Idea Gate | 含构思验证，文章未强调 |
| 执法计划 | Superpowers `writing-plans` | `/dev-planner` → `DEV-PLAN.md` | Phase + **MVP Scope** |
| 执法实现 | `subagent-driven-development` | `/dev-builder` + **implementer** | 每 Task worktree + TDD |
| 三级审查 | 规约审查 → 质量审查 | Task 内 **Spec 符合性** → `/code-review` | 见 dev-builder Step 12–14 |
| 增量变更 | Delta ADDED/MODIFIED/REMOVED | `changes/<name>/specs.md` **Delta Spec** 节 | 模板见 change-specs-template |
| 场景规约 | Given/When/Then | `specs.md` **Scenarios (G/W/T)** | 可选块，归档合并进 Product-Spec |
| 并行 FE/BE | 同读 spec 并行 | DEV-PLAN 多 Phase / 多会话各跑 dev-builder | 文档模式，Harness 不强制 |

---

## 三个衔接点（文章）↔ Forge 落点

### 1. tasks.md → writing-plans

| 文章 | Forge |
|------|-------|
| OpenSpec `tasks.md` 粗粒度；Superpowers 拆成 2–5 分钟步骤 | **`changes/<name>/tasks.md`** = 业务任务清单；**`DEV-PLAN.md`** = 工程 Phase；二者**独立**，apply 时由 `/dev-planner` 填充 tasks，dev-builder 按 Task 执行 |
| 易混：两份计划 | change-manager apply Step 2 明确要求先填满 tasks.md 再调 dev-builder |

### 2. design.md → subagent-driven-development

| 文章 | Forge |
|------|-------|
| Superpowers 子代理读 OpenSpec `design.md` | dev-builder **Change-Scoped Mode** 必须读 `changes/<name>/design.md` + `specs.md`；0→1 读 DEV-PLAN + Product-Spec |
| Superpowers **不会自动识别** OpenSpec 目录 | dev-builder Loading Phase **显式扫描** `changes/<change-name>/`（由 change-manager 传入名称） |

### 3. specs/ → requesting-code-review

| 文章 | Forge |
|------|-------|
| 审查标准 = 行为规约 | Task 微循环 Step 12：对照 Product-Spec / `changes/.../specs.md`；Step 14：`code-reviewer` 带 Spec 摘录 |
| 规约审查查的是**实现计划**而非 OpenSpec 文件 | Forge：**先** Task 级 Spec 符合性（changes specs 或 DEV-PLAN 条目），**再** code-reviewer 质量门 |

---

## 命令边界（防踩坑）

文章澄清：`/opsx:apply` 是 **OpenSpec** 命令，不是 Superpowers。Forge 对等关系：

| 用户意图 | 用 | 不用 |
|----------|-----|------|
| 创建变更文件夹、写 Delta 规约 | `/change-manager propose` | 直接 dev-builder |
| 按 `changes/<name>/tasks.md` 写代码 | `/change-manager apply` → `/dev-builder`（Change-Scoped） | 把 apply 当成「只跑 OpenSpec CLI」 |
| 0→1 按 DEV-PLAN Phase 开发 | `/dev-builder`（Phase 模式） | change-manager |
| 填工程 Phase / 技术栈 | `/dev-planner` | product-spec-builder 写 tasks |

**铁律**：同一项目只选 **一套主流程**——ReqForge 全流程优先；不要同时装 Superpowers 插件与 Forge 并抢 CLAUDE.md 优先级（见 superpowers-comparison.md）。

---

## 文章组织观点 ↔ Forge

| 文章判断 | Forge 态度 |
|----------|------------|
| 前后端实现壁垒坍缩，**会写规约**更稀缺 | 对齐：Product-Spec + Idea Gate + change-manager Delta |
| 3 人组 → 架构师 + AI 操作者 | Harness 不承诺编制；提供 Spec/Plan/Review 分工 |
| 适合需求清晰项目；模糊期人不可替代 | 对齐 Founder's Playbook Idea Stage + MVP Scope |

---

## 建议吸收（落地状态）

| 优先级 | 项 | 状态 |
|--------|-----|------|
| P0 | 命令边界 + changes/ 显式读取 | ✅ change-manager / dev-builder SKILL |
| P1 | Delta Spec + G/W/T 模板 | ✅ change-specs-template |
| P1 | Task 两级审查（Spec → 质量） | ✅ dev-builder Step 12–14 说明 |
| P2 | 规约先行并行 Phase 示例 | 📄 loadout-scenarios / dev-planner 可选补充 |
| — | 引入 OpenSpec npm CLI | ❌ 刻意不做（零 npm 用户项目） |

---

## 刻意不做

- 要求用户同时维护 OpenSpec CLI + Superpowers 插件双安装
- 用 `/opsx:*` 替代 `/change-manager`（工件兼容，命令不同）
- 将 Superpowers 的 brainstorming 与 Forge product-spec-builder 并行当作双 Spec 源

---

## 参考

- [change-manager/SKILL.md](../skills/change-manager/SKILL.md) — apply 与 dev-builder 委托
- [dev-builder/SKILL.md](../skills/dev-builder/SKILL.md) — Change-Scoped Mode、两级审查
- [change-specs-template.md](../skills/change-manager/templates/change-specs-template.md) — Delta + G/W/T
