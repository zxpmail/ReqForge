# CONTEXT

## 当前正在做什么

- **提示词瘦身 P6** 完成：`CLAUDE.md` General Rules 指针化
- **P0–P5** 已 push（v1.35.1–v1.35.6）

## 上次停在哪个位置

- **P6**：CLAUDE ~7.9k→~5.5k；General Rules → quickref §通用规则；去掉 `[Available Skills]` 重复段
- **v1.35.6**（`3aea41c`）：`forge-install --loadout`

## 架构与 Harness

- 12 Skill + Loadout 安装过滤 + CLAUDE 调度图指针化（P6）
- Hook / Machine Gates 未动

## 测试

- `pnpm test` · `pnpm forge-smoke`

## 维护者文档

- [loadout-scenarios.md](core/docs/loadout-scenarios.md) · [forge-quickref.md](core/templates/forge-quickref.md) §通用规则
