## 来源

受 alchaincyf/nuwa-skill 启发。女娲不是「访谈一个人」，而是「蒸馏一个人的思维模式」——从行为中提取结构，而不是从回答中记录文本。

## 问题

当前的 product-spec-builder 是问答模式：问用户 20 个问题 → 用户回答 → 写 Product-Spec.md。但用户回答的是「他以为他需要的」，不是「他真正需要的」。用户说不出他不知道的东西。

## 方案

把 spec 生成从「问答记录」改为「需求蒸馏」：

```
用户输入一句模糊想法
  ├─ 并行推断（不依赖用户回答）
  │   ├─ 用户真的想要什么？（不是他说的功能，是背后的需求）
  │   ├─ 竞品怎么解决这个问题的？
  │   ├─ 领域模式是什么？（同类产品的共性和教训）
  │   └─ 技术可行性维度？
  ├─ 交叉验证：用户说的 vs 推断的，冲突在哪？
  └─ 蒸馏输出 Product-Spec.md：
      ├─ ✅ 用户说对了的部分
      ├─ ⚠️ 用户没说但需要的（附推断依据）
      └─ ❓ 不确定的标记给用户确认
```

## 跟 2.5 层的关系

| 现在 | 目标 |
|------|------|
| 用户输入 → 问答 → 记录到 spec | 用户输入 → 多路推断 → 交叉验证 → **蒸馏** spec |
| Spec 是用户回答的记录 | Spec 是从用户表达中提取的需求结构 |
| 靠问更多问题来补全 | 靠推断 + 交叉验证来补全 |

## 不做（如果否决）
- 不增加用户负担——多路推断是 AI 的工作量，不是用户的
- 不降低用户确认环节——不确定项仍需用户确认

## 状态

**已实施 pilot（v1.48.3，2026-06-19）。** 作为 `product-spec-builder` 的可选模式落地（类比 `light-grill-mode`）：新增 `references/distillation-mode.md`——4 路推断（Real Need / Competitor / Domain Patterns / Tech Feasibility，不依赖用户回答）+ 交叉验证 + ✅/⚠️/❓ 蒸馏输出，密度配额 + 1-rescan 上限（同 critique-gate 的反假批判逻辑）。关键词触发（`distill`/`蒸馏`），默认 Spec 路径不变。配套校验器 `pnpm forge-spec-distill`（复用 `forge-spec-critique.mjs` 原语）。复用 domain-mapper 产出（greenfield 安全）。详见 `core/skills/product-spec-builder/references/distillation-mode.md`。

GitHub Issue: https://github.com/zxpmail/ReqForge/issues/7
