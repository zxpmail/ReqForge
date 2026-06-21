# Surface 路由（是否有 UI）

设计链（Brief / mockup）**仅对「用户可感知的界面」有意义**。执行 design-brief-builder 或 Next Step Gate 前，**必须先读 `Product-Spec.md` 判定 Surface**。

## 判定顺序

1. **显式字段**（优先）：Spec 中 `Product Type`、`Surface`、`UI Layout`、技术栈里的前端描述  
2. **功能描述**：是否出现 Web 门户、页面、对话 UI、Desktop 窗口、Mobile App  
3. **用户确认**：边界模糊时问一句，不要猜

## 三类路由

| 类别 | 典型 Surface | design-brief-builder | Next Step Gate | 默认下一步 |
|------|----------------|----------------------|----------------|------------|
| **A · 有 UI** | Web、Desktop、Mobile、复杂 TUI | 完整访谈 → `Design-Brief.md` | **执行**三选一，默认推荐 `/design-maker` | mockup 或 dev-planner |
| **B · 轻交互** | 简单 CLI、脚本带进度/表格输出 | **极简 Brief**（可选）：命令结构、输出格式、错误文案 | **简化 Gate**：仅问「要不要补 TUI/文档站设计」；默认 **skip mockup** | `/dev-planner` |
| **C · 无 UI** | 纯 API、库/SDK、批处理、后台服务、无界面的 CLI 工具函数 | **跳过**（除非用户明确要求） | **不执行 Gate** | `/dev-planner` |

### C 类（无 UI）识别信号

满足 **多数** 即可视为 C 类：

- Spec **无** `## UI Layout`（或明确写「无 Web 门户 / 无 UI」）
- 交付物是 HTTP API、npm/pip 包、Go module、定时任务、CLI 子命令（无交互式 TUI）
- 成功指标不含页面、对话、门户类描述

### A 类（有 UI）识别信号

- 存在 `## UI Layout`、页面列表、SSE/流式对话 UI
- Product Type = Web / Desktop / Mobile
- fiction-craft 类：Web SPA + 左侧导航

## 无 UI 时的 Agent 动作（C 类）

**不要**启动完整 design 访谈，**不要**弹出 mockup 三选一。

1. 一句话告知用户：「Spec 为无界面产品，跳过 Design Brief 与 mockup，直接进入开发计划。」  
2. 写入 `.forge/design-next-step.json`：

```json
{
  "decided_at": "ISO8601",
  "choice": "skip-mockup",
  "decided_by": "agent",
  "reason": "no-ui-product",
  "surface": "API | CLI | library | batch",
  "note": "Product-Spec 无 UI Layout；不适用 design-brief-builder / design-maker"
}
```

3. **Next Step**：`/dev-planner`（若已有 Plan → `/dev-builder`）  
4. Status: **DONE**（非 BLOCKED）

## B 类（轻交互 CLI）

- 可问用户：「是否需要 1 页极简 Design Brief（命令输出、错误格式）？」  
- 默认 **不** 推荐 `/design-maker`  
- 若写 Brief，Gate 仅两选：**skip mockup** / **dev-planner-first**（无「出 mockup」项）

## 与 design-brief-builder 启动的关系

Session 以 `/design-brief-builder` 进入但 Spec 为 **C 类** 时：

- **礼貌退出** Skill：说明无 UI 不需要 Brief，改推荐 `/dev-planner`  
- 用户坚持要「气质/文档风格」→ 仅做 **10 项问卷中的 Tone + Must-not** 迷你 Brief，仍 **skip mockup**
