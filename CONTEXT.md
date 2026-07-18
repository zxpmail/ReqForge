# CONTEXT

## 当前版本
- **v1.51.0** — 吸收 agents-cli：skill-eval 飞轮 + 借口表 + 阶段重读

## 上次停在哪个位置
- 已发版提交准备：`package.json` / CHANGELOG / README 徽章与 What's New 已对齐 v1.51.0

## 近期关键决定
- 只吸飞轮 + 借口表 + 重读 + 三类证据；不抄 GCP/Always-active workflow/GEPA

## 测试
- `pnpm exec vitest run scripts/__tests__/skill-eval.test.ts` — 15 通过
- `pnpm sync` — 完成
