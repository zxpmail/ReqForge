# Architecture Health Pass（架构保健）

> 灵感来自 [mattpocock/skills `improve-codebase-architecture`](https://github.com/mattpocock/skills)。  
> 对照：[mattpocock-skills-comparison.md](../../../docs/mattpocock-skills-comparison.md)

## 何时用

- 用户说 **架构保健**、**ball of mud**、**加深模块**、**improve architecture**
- 建议节奏：每 **1–2 周** 或 major Phase 之间 **可选** 一次（不替代 `/code-review`）

## 输入

- `CONTEXT.md` / `.forge/project-taste.md` / `memory/decisions-log.md`
- 当前代码树 + `.forge/dev-map.md`

## 流程

1. **选 1–2 个模块**（最乱、变更最频、或 dev-map 标注 unclear 的）。  
2. 对每个模块回答：  
   - 接口是否 **深而窄**（Ousterhout）？  
   - 是否与 **统一语言** / taste 一致？  
   - 有无 **重复逻辑** 可合并（Surgical — 只提 1 个具体 refactor 建议）？  
3. 输出 **Health Notes**（≤20 行）+ **最多 3 条** 可执行建议（每条：目标文件、意图、Verify by）。  
4. 重大决策 → 提议写入 `memory/decisions-log.md`；**不**自动改 DEV-PLAN 除非用户确认 replan。

## 与 code-review 的分工

| | Architecture Health | code-review |
|--|---------------------|-------------|
| 时机 | 定期 / 主动 | 变更后 |
| 焦点 | 模块边界、长期结构 | 本次 diff vs Spec |
