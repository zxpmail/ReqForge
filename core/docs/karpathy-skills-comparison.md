# Karpathy-skills 对照

> 上游项目：[andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) (MIT)
> 154,800 stars — 一个 CLAUDE.md 文件 + Cursor 规则 + Claude Code 插件，用 4 条原则减少 LLM 编码通病。

---

## 同源关系

Karpathy 四原则是所有原则的**起源**。ReqForge 没有发明新的行为哲学，而是在同一个原则体系上做了 **OS 化落地**——把 4 条原则变成了一个可执行、可验证、可进化的系统。

```
andrej-karpathy-skills (4 principles)
  │
  ├── ReqForge behavior-rules.md          ← 四原则 + ReqForge 场景化示例 + 违反信号表
  ├── ReqForge CLAUDE.md [Behavior Rules]  ← 四原则快照（每 session 加载）
  ├── ReqForge dev-builder SKILL.md        ← +Simplicity First + Surgical Changes
  ├── ReqForge bug-fixer SKILL.md          ← +Simplicity First + 最小修复
  ├── ReqForge code-review SKILL.md        ← +Surgical Changes Audit + Simplicity First Audit
  ├── ReqForge session-execution-discipline.md  ← 8 条执行纪律
  │   (其中 #3 minimal diff = Surgical Changes, #8 verify = Goal-Driven)
  ├── ReqForge Machine Gates
  │   ├── Sloppiness Gate (= 违反 Goal-Driven/Surgical Changes 时拦截)
  │   ├── Overstepping Gate (= 违反 Think Before Coding/Simplicity First 时拦截)
  │   └── Hallucination Gate (= 违反 Think Before Coding 时拦截)
  └── ReqForge karpathy-only.mdc          ← 精简版 Cursor 规则（不含 Harness）
```

---

## 逐条映射

| Karpathy 原则 | ReqForge behavior-rules | 其他 Skill 落地 | Machine Gate |
|--------------|------------------------|----------------|-------------|
| **Think Before Coding** | §1: 不猜假设、摆 tradeoff、有歧义先问 | bug-fixer 证据收集优先、dev-builder Plan Mode 前置、implementer 假设清单 | Overstepping Gate (拒绝偏离 scope)、Hallucination Gate (拒绝不存在的路径) |
| **Simplicity First** | §2: 最少代码、不写投机性抽象、200→50 | dev-builder [First Principles] "File Slimming"、"YAGNI"在 checklist；code-review Simplicity First Audit | Overstepping Gate (拒绝 scope creep) |
| **Surgical Changes** | §3: 只改必须改的、不改格式/注释 | dev-builder "Modification Discipline"、"Phase scope creep" gotcha；code-review Surgical Changes Audit（每个变更行追溯用户请求） | Sloppiness Gate (block 无验证的完成声明) |
| **Goal-Driven Execution** | §4: 可验证标准、测试优先、循环验证 | dev-builder "Verification Is Evidence (Hard Gate)"、TDD RED-GREEN-REFACTOR、Task Micro-Cycle；bug-fixer 先写复现测试；code-review Evidence is King；change-manager verify before archive | Sloppiness Gate (无证据 = 未完成) |

---

## 什么是上游有的、ReqForge 没有的（值得借鉴）

| 上游特性 | 说明 | ReqForge 状态 |
|---------|------|-------------|
| **单文件极简** | 一份 CLAUDE.md 包含全部 4 原则，无需额外文件 | ReqForge CLAUDE.md 仅含快照，详情在 behavior-rules.md |
| **插件分发** | Claude Code marketplace 插件，一行命令安装 | ReqForge 用 adapter 拷贝方式 |
| **EXAMPLES.md** | 每个原则配 ❌→✅ 真实代码对比 | behavior-rules.md 已采用相同格式 |
| **Cursor 原生规则** | `.cursor/rules/` 一条 .mdc 规则即用 | 已有 reqforge.mdc + karpathy-only.mdc（新增） |
| **明确的 Tradeoff 说明** | "谨慎 vs 速度"的豁免边界 | behavior-rules.md §何时可简化（新增） |

---

## 什么是 ReqForge 有的、上游没有的（ReqForge 的增值）

| ReqForge 特性 | 说 | 
|--------------|---|
| **可执行流程** | 原则不只是「被告知」，而是嵌入 SKILL.md 的 First Principles + Workflow + 验证步骤 |
| **Surgical Changes Audit** | code-review skill 硬性检查每行改动是否追溯到需求 |
| **Simplicity First Audit** | code-review skill 检查过度工程 |
| **违反信号脚本化** | pre-commit 可检查 diff 格式变更、commit msg 「顺便」模式 |
| **Machine Gates 强制** | Sloppiness/Overstepping/Hallucination gate 在 agent 试图违规时硬拦截 |
| **多 adapter 覆盖** | Claude Code + Cursor + OpenCode 三平台 |
| **进化机制** | feedback → evolution-engine → 原则升级：犯错不重复 |

---

## 何时用哪个

| 你的需求 | 推荐 |
|---------|------|
| 只需要行为约束，不要流程编排 | 上游 CLAUDE.md 或 ReqForge `karpathy-only.mdc` |
| 完整的产品开发 pipeline | ReqForge 全套 |
| 先试试原则，再决定是否上 Harness | 先装 `karpathy-only.mdc`，需要时升级到完整 adapter |
| 已经用上游项目，想要更多验证 | 叠加 ReqForge 的 code-review Surgical Changes Audit |
| 想贡献原则改进 | 上游改 CLAUDE.md；ReqForge 改 behavior-rules.md 然后 pnpm sync |

---

## 参考

- [andrej-karpathy-skills CLAUDE.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md) — 原始四原则
- [andrej-karpathy-skills EXAMPLES.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/main/EXAMPLES.md) — ❌→✅ 示例
- [ReqForge behavior-rules.md](behavior-rules.md) — ReqForge 场景化落地
- [ReqForge 8 条执行纪律](session-execution-discipline.md) — Task 级行为规范
- [karpathy-only.mdc](https://github.com/zxpmail/ReqForge/blob/main/adapters/cursor/.cursor/rules/karpathy-only.mdc) — 精简版 Cursor 规则（不含 Harness，可单独使用）
