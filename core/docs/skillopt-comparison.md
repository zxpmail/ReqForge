# ReqForge 与 SkillOpt 对照

> 参考：[Skill 文档也能训练？SkillOpt](https://mp.weixin.qq.com/s/M8U3jNM5nCvlr-bsna5m7Q)（AINLP）· 论文 [SkillOpt: Executive Strategy for Self-Evolving Agent Skills](https://arxiv.org/abs/2605.23904) · [Microsoft SkillOpt](https://microsoft.github.io/SkillOpt/)  
> 与 [skill-evolution-comparison.md](./skill-evolution-comparison.md)、[skill-eval.md](./skill-eval.md) 互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **SkillOpt** | 把 `SKILL.md` 当**可训练外部状态**：rollout → 反思 → **有预算的结构化编辑** → held-out **验证门** → **rejected-edit buffer** |
| **ReqForge** | 产品交付 Harness + **人工闸门**的 Skill/规则进化；**skill-eval** = 简化版验证门；**evolution-engine** = 有纪律的升格提案 |

SkillOpt 全自动训练 Skill 正文；Forge **不复现 optimizer 循环**，吸收其**训练纪律**。

---

## 五步闭环 ↔ Forge 落点

| SkillOpt 步骤 | ReqForge 对应 | 状态 |
|---------------|---------------|------|
| Rollout | `skill-eval` cases、Phase 验收、`forge-smoke` | ✅ 人工/半自动 |
| Reflection | `feedback-observer` → `evolution-engine` | ✅ 人工确认 |
| Bounded edits | evolution **最多 3 条** add/delete/replace | ✅ v1.32+ 提案格式 |
| Validation gate | `skill-eval` held-out + `pnpm skill-eval` 断言 | ✅ |
| Rejected buffer | `.forge/skills/<name>/eval/rejected-edits.json` | ✅ v1.32+ 模板 |
| Slow / meta skill | `CLAUDE.md` 调度、`forge-bootstrap` 受保护节 | ✅ 部分 |

---

## 与 skill-eval 的关系

文章建议的最小流程（30–50 任务、train/held-out、≤3 条编辑、严格提升才接受、记录被拒编辑）≈ Forge：

```bash
pnpm skill-eval init my-skill
# triggers.json → 触发准确率（≈ rollout 抽样）
# cases.json → train / held-out 标签 + 产物断言（≈ validation gate）
# rejected-edits.json → 被拒编辑负样本
pnpm skill-eval my-skill
```

详见 [skill-eval.md](./skill-eval.md) § Train / held-out。

---

## 与 evolution-engine 的关系

| SkillOpt | Forge |
|----------|-------|
| Optimizer 自动改 Skill | 用户 **Confirm/Skip** 后合并 |
| 编辑预算 | 单条提案 **≤3** 结构化编辑 |
| 必须说明修复哪类失败 | 必填 **RED** + **failure_class** + **Verify by** |

---

## 刻意不做

- 内嵌 Microsoft SkillOpt 训练器（成本高、需独立 optimizer 模型）
- 无验证自动合并 Skill 正文（防越改越乱）
- 替代 Spec/Plan/Build 主流程

---

## 参考

- [skill-eval.md](./skill-eval.md)
- [skill-evolution-comparison.md](./skill-evolution-comparison.md)
- [evolution-engine/SKILL.md](../skills/evolution-engine/SKILL.md) — Bounded Skill Edits
- [skill-eval/rejected-edits.template.json](../templates/skill-eval/rejected-edits.template.json)
