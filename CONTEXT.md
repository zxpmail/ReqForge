# CONTEXT

## 当前正在做什么
- 补全 v1.20.0 文档（README/CHANGELOG/llms.txt/DEV-PLAN 等），此前仅改了技能表

## 上次停在哪个位置
- `565f62e` 已推送但文档不完整；待提交 docs v1.20.0

## 近期关键决定和原因
- 不与 OpenSpec 争「全局 npm CLI」，而是在 Forge 内用 `changes/` + `/change-manager` 补齐 brownfield 单次变更流，实现仍委托 dev-planner/dev-builder
