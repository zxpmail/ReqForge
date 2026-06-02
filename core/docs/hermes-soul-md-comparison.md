# ReqForge 与 Hermes「SOUL.md」操作员人格对照

> 参考：[170 行 SOUL.md，让你的 Hermes Agent 从「听话」变「能打」](https://mp.weixin.qq.com/s/VAKbf54yWEvO4IfuREbyqw)（整理自 Tony Simons [@tonysimons_](https://x.com/tonysimons_) 推文思路）  
> 与 [tencent-harness-mirror-comparison.md](./tencent-harness-mirror-comparison.md)（`project-taste.md`）、[karpathy-coding-agi-comparison.md](./karpathy-coding-agi-comparison.md)（Understanding 边界）、[claude-code-seven-workflows-comparison.md](./claude-code-seven-workflows-comparison.md)（Claude Code 纪律）互补。

---

## 一句话定位

| 来源 | 擅长 |
|------|------|
| **SOUL.md** | **个人/运营型 Agent**（如 Hermes）的系统人格：操作员身份、带证据反驳、追责反馈环、语气双模、使命地图、自主边界 |
| **ReqForge** | **工程交付 Harness**：Spec/Plan 为真相、机器门验收、审查与进化；**不**把 Agent 养成「让用户开心的门童」 |

文章解决「助手只会附和」；Forge 解决「附和之后仍可能 **没测试、没 Spec、合不了并**」。

---

## SOUL.md 六块 ↔ Forge 映射

| SOUL 模块 | 文章要点 | ReqForge 落点 | 差异 |
|-----------|----------|---------------|------|
| **1. 身份** | autonomous operator / thought partner，非 assistant | `product-spec-builder` 追问；[behavior-rules.md](./behavior-rules.md) Think Before Coding；`code-review` 对抗性审查 | Forge Agent **不**自称运营搭档；**人**保留产品 Understanding |
| **2. 反驳权** | Push back + 证据（数据/推理） | Spec 确认门、plan 确认、`/code-review`、Idea Validation Gate | 反驳针对 **方案与代码**，非生活/战略闲聊 |
| **3. 追责** | 产出未被使用要指出、修反馈环 | `DEV-PLAN` Phase、`forge-loop`、`phase-exit-block`；`feedback/` → `evolution-engine` | 追责对象是 **Phase/验收**，非「三份方案没人看」式运营文案 |
| **4. 双语气** | 私聊随意 vs 对外专业 | Skill `output-style`；可选 [talk-normal](./talk-normal-comparison.md)；`release-builder` 发布边界 | 不在 core 写脏话/私聊规则 |
| **5. 使命地图** | 当前项目优先级列表 | `Product-Spec.md`、`DEV-PLAN.md`、`memory/project-memory.md`、`CONTEXT.md` | 优先级以 **Git 工件** 为准，非单文件 SOUL |
| **6. 自主边界** | 发帖/发布/购买/破坏须批准；其余可动 | S0/S1、`security-guidance.md`、hooks、`release-builder` + `pnpm preflight` | 工程侧 **默认需确认** 再改业务代码（spec/plan 门） |

---

## 分层：SOUL vs Project Taste vs Spec

| 文件 | 性质 | 适用产品 |
|------|------|----------|
| **SOUL.md**（文章） | 人格 + 运营协作 + 对用户问责 | Hermes / 个人助理 |
| **`.forge/project-taste.md`** | S3 团队口味（简单>聪明） | ReqForge 用户项目 |
| **`Product-Spec.md`** | S2 要什么、验收是什么 | 可发布软件 |
| **`security-guidance.md`** | S1 红线 | 全项目 |

**不要**用 SOUL.md 替换 `Product-Spec.md` 或塞进 adapter `CLAUDE.md`（调度图应保持 <60 行）。

---

## 对维护者与用户的启示

| 启示 | 建议 |
|------|------|
| 「有用助手」= 附和机器 | Forge Skills 已要求冲突时停下、列 tradeoff（behavior-rules §1） |
| 反驳要带证据 | 对齐 `code-review`（Spec 引用）、`bug-fixer` 证据优先 |
| 反馈环断了要大声说 | 用 `forge-phase-check` / Phase 表，而非只靠聊天记忆 |
| 使命要显式 | 每周在 Spec/Plan 更新优先级，不靠 Agent 猜 |
| 自主边界分档 | 破坏/发布 = 人批；实现 = Plan 确认后 `dev-builder` |
| Hermes 用户 | SOUL 放 **Hermes 项目根**；软件交付仍 **`forge-install` 用户代码仓** |

---

## 与 OpenHuman / 七工作流的分工

| 文档 | 关系 |
|------|------|
| [openhuman-comparison.md](./openhuman-comparison.md) | 个人运行时 + 记忆；SOUL 更像 OpenHuman 层人格 |
| [claude-code-seven-workflows-comparison.md](./claude-code-seven-workflows-comparison.md) | Claude Code 工程习惯；SOUL 不替代 CLAUDE.md/Plan |
| [wechat-ilink-acp-comparison.md](./wechat-ilink-acp-comparison.md) | 微信通道；与 SOUL 正交 |

---

## 刻意不做

- 在 `core/templates/` 默认附带 `SOUL.md` 或 Hermes 专用人格
- 让 `dev-builder` 对用户做「你不用我的方案」式问责（越界 product-owner）
- 把 SOUL 的「其余有把握就做」覆盖 spec/plan 硬门（与 S0/S1 冲突）
- 将 Tony Simons 模板原文 vendoring 进仓库（用户自行复制到 Hermes）

---

## 可选：用户侧填空（Hermes 专用）

若你 **同时** 用 Hermes 与 ReqForge，建议：

- **Hermes 仓**：根目录 `SOUL.md`（运营/内容/个人 OKR）
- **产品代码仓**：`forge-install` → `Product-Spec.md` + `.forge/project-taste.md`

两套文件 **不合并**——避免运营人格干扰工程验收。

---

## 参考

- 微信：[mp.weixin.qq.com/s/VAKbf54yWEvO4IfuREbyqw](https://mp.weixin.qq.com/s/VAKbf54yWEvO4IfuREbyqw)
- 思路来源：Tony Simons X 帖（文内引用）
- Forge 品味石碑：[tencent-harness-mirror-comparison.md](./tencent-harness-mirror-comparison.md)
- 行为规则：[behavior-rules.md](./behavior-rules.md)
