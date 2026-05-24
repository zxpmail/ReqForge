# Forge 运行时标记（.forge/）

<!-- 机器门与 HARD-GATE 读取；勿提交到 git（见项目 .gitignore） -->

| 文件 | 写入方 | 含义 |
|------|--------|------|
| `spec-confirmed.json` | `/product-spec-builder` 用户确认 Spec 后 | 允许进入计划/开发准备 |
| `plan-confirmed.json` | `/dev-planner` 用户确认 DEV-PLAN 后 | 允许开发阶段写应用代码（仍需 implementer） |
| `implementer-session.json` | `implementer` 子 Agent 每个 Task 开始时 | PreToolUse 允许写 `src/` 等；Task 结束删除 |

模板见同目录 `*.template.json`。用户项目可在 `forge-install` 后把 `.forge/*.json` 加入 `.gitignore`。
