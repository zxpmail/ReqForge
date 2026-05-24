# CONTEXT

## 当前正在做什么

- 无进行中任务（v1.23.0 发版与文档同步已完成）

## 上次停在哪个位置

- 已推送 `e7c1245`：v1.23.0 — README/CHANGELOG 发版说明；此前 `88c90fc`～`d39f728` 为 forge-smoke、loadout-scenarios、platform-compliance

## 近期关键决定

- **发版守门**：贡献者合并前跑 `pnpm forge-smoke`（9 项静态 smoke + CI push/PR，禁止 cron）
- **Loadout 选型**：`core/docs/loadout-scenarios.md` + 内置 loadout 的 `scenarios[]` 标签
- **平台合规**：`core/docs/platform-compliance.md` — 不存用户密钥、fork 用途说明、workflow 禁 cron
- 默认 10 个钩子；对照文档在 `core/docs/`，Skill 用 GitHub 绝对 URL
- Skill 进化：P0 文档已完成，P1/P2 仍暂缓
