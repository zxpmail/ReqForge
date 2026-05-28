# Zoom-Out Pass（拉高视角）

> 灵感来自 [mattpocock/skills `zoom-out`](https://github.com/mattpocock/skills)。  
> 对照：[mattpocock-skills-comparison.md](../../../docs/mattpocock-skills-comparison.md)

## 何时用

- 用户说 **zoom out**、**这段代码在整个系统里干什么**、**不熟悉这个模块**
- dev-builder **Loading Phase 之前**或 **只读探索**（不写代码）

## 流程

1. 读 `.forge/dev-map.md`（若有）、`memory/project-memory.md`、`Product-Spec.md` 相关节。  
2. 若有 `.forge/graph.json` → `pnpm dep-graph affected <path>` 看 blast radius。  
3. 输出（Markdown，≤30 行）：  
   - **这一层在系统中的位置**（1 段）  
   - **上游 / 下游依赖**（列表）  
   - **与 Spec 的哪条需求对应**（或标注 drift）  
   - **若继续改这里，最该小心的 2 点**  
4. 问用户：继续实现 / 先改 Spec / 先 architecture-health-pass。

## 不做

- 不代替 Phase 计划或 Task 列表  
- 不在此 pass 里写功能代码
