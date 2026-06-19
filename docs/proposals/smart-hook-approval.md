# Proposal: 智能命令审批中间态（Dippy 模式）

## 背景

目前 Forge 的权限模型是二元制：
- **普通模式**：每次安全 shell 操作都弹 permission prompt → 权限疲劳
- **YOLO 模式**：全部放行 → 安全归零

社区项目 [Dippy](https://github.com/hesreallyhim/awesome-claude-code/issues/442) 提供了第三种状态：

> AST 解析安全命令后自动放行，破坏性操作才弹确认。34 个 CLI handler（git、aws、kubectl、docker 等），10,000+ 测试。

## 方案思路

在 `pre-tool-use` hook 层加一个中间审批层：

```
AST 解析命令
  ├─ 安全（read-only、git log/status、npm test 等）→ 自动放行
  ├─ 危险（git push --force、rm -rf、DROP TABLE 等）→ 弹确认
  └─ 不确定 → 默认弹确认（安全侧）
```

## 价值

- 减少 permission prompt 频率，不牺牲安全
- 不需要切换到 YOLO mode 就能「流畅驾驶」
- 与现有 Machine Gate 体系正交，可以独立启用/禁用

## 不做的理由（如果否决）

- 维护 34+ CLI handler 的 AST 规则成本不低
- 误放行的后果比 permission fatigue 更严重
- Forge 是框架开发，人均 permission prompt 频率不高

## 状态

**评估结论（2026-06-19）：暂不实施（DEFER）。** 维护 34+ CLI 的 AST 规则成本高（Dippy 10k+ 测试即证明），且误放行后果 > permission fatigue。Forge 面向框架/skill 开发，人均 permission prompt 频率不高；Claude Code 自身权限体系（allowlist 等）已部分覆盖此需求。如用户反馈 prompt 疲劳，再以最小 CLI 集（git/npm/pnpm）小范围试点。
