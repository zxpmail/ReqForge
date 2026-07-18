# Shortcuts to Resist（跨 Skill 借口表）

> Agent 常用「合理借口」跳过纪律。认出即推回。  
> 各 Skill 专属表仍在 `references/anti-rationalization.md`；本表为**全局高频**。  
> 灵感：[google/agents-cli](https://github.com/google/agents-cli) workflow/eval Skills。

| 借口 | 现实 |
|------|------|
| 「需求够清楚，不用再问 / 不用读 Spec」 | 你在猜。先读真相源，有歧义先问。 |
| 「一句 smoke / 手动点一下就够了，不用 eval / verify」 | 单次运行不是回归集。须对应层的证据命令。 |
| 「调低断言 / 阈值就能绿」 | 降门槛藏失败。修 Skill 或修实现，不要挪门禁。 |
| 「这用例太飘，先删掉」 | 不稳定是信号。收紧指令或固定写法，别删信号。 |
| 「只改 expected 输出，别动 Skill」 | 若总在改期望，说明行为有问题——先修实现。 |
| 「会话里刚读过 SKILL，还记得」 | 上下文会压缩。**阶段入口必须重读**对应 SKILL（或 `forge-skill-retrieve` 的 mustRead）。 |
| 「跳过脚手架 / 手工搭更快」 | 手工容易丢 eval 包、门禁与约定。走 `forge-install` / Skill 流程。 |
| 「编译过了 / 看起来对，就算完成」 | 完成须附**当轮**验证命令输出。无证据 = 未完成。 |
| 「用户在等，先写代码」 | 无 Spec/Plan 确认写业务代码 = HARD-GATE 违规。 |
| 「顺手做下一 Phase / 下一 Skill」 | 一次一个边界。用户再 invoke。 |

## 三类证据（勿混为一谈）

| 层 | 验什么 | 典型命令 |
|----|--------|----------|
| **代码契约** | 类型、单元/集成测试、lint | `tsc` / `pnpm test` / 项目测试脚本 |
| **Skill 产出** | 触发边界、产物形态、judge 质量 | `pnpm skill-eval` · `compare` · `analyze` |
| **门禁 / 交付** | Spec·Plan 锁、Phase 验收、发布 | `pnpm forge-verify` · preflight · phase 四步 |

pytest/单测绿 ≠ Agent 行为对；skill-eval 绿 ≠ 产品门禁过。各层证据不可互相替代。
