# PM 框架参考（可选）

<!-- 方法论摘编自 phuryn/pm-skills（MIT），适配 ReqForge Product-Spec 输出；非替代本 Skill 的 HARD-GATE 与模板。 -->

## 出处与许可

- 来源：[pm-skills](https://github.com/phuryn/pm-skills)（PM Skills Marketplace）
- 许可：MIT — 摘编为访谈提纲与 Spec 章节，保留框架名称与出处
- **不要**在用户项目中安装全部 65 个 pm-skills，避免与 Forge 14 Skill 调度冲突

## 何时使用（0-to-1 可选）

| 用户状态 | 建议读取 |
|----------|----------|
| 只有模糊想法、不知先做啥 | `pm-frameworks-ost.md`（机会方案树，先定 outcome） |
| 需要写清「为谁、解决啥」 | `pm-frameworks-value-proposition.md`（6 段 JTBD） |
| 担心方向错了、要先验假设 | `pm-frameworks-assumptions.md`（8 类风险假设） |
| 要做竞品/差异化 | `pm-frameworks-competitive.md`（竞品简报结构） |

**跳过条件**：Quick Mode、用户已给完整 brief、或明确「直接写 Spec」。可选阶段不得拖延 HARD-GATE 所需的文件确认。

## 与主流程的关系

```text
[可选 Discovery] → Requirements Exploration → Clarifying → Refinement → Document Generation
```

Discovery 产出写入 Spec 对应章节（见 `templates/product-spec-template.md` 可选小节），或仅在对话中摘要，**必须在 Document Generation 时落入 Product-Spec.md**。

## 文件索引

| 文件 | 用途 |
|------|------|
| `pm-frameworks-ost.md` | Teresa Torres OST：outcome → 机会 → 方案 → 实验 |
| `pm-frameworks-value-proposition.md` | 6 段 JTBD 价值主张 |
| `pm-frameworks-assumptions.md` | 8 类假设识别 + Impact×Risk 优先级 |
| `pm-frameworks-competitive.md` | 5 竞品 + 差异化矩阵（配合 WebSearch） |
