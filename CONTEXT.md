# CONTEXT

## 当前正在做什么
- 已落地 OpenSpec 启示：`core/docs/openspec-comparison.md` + 新 Skill `change-manager`（propose/apply/verify/archive）

## 上次停在哪个位置
- `pnpm sync` 已完成；README 引导层已改为 12 个 Skill；本地未提交（含 openspec-comparison.md）

## 近期关键决定和原因
- 不与 OpenSpec 争「全局 npm CLI」，而是在 Forge 内用 `changes/` + `/change-manager` 补齐 brownfield 单次变更流，实现仍委托 dev-planner/dev-builder
