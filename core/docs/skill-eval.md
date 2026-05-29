# Skill Eval（用户项目自定义 Skill 评估）

> 框架内置 Skill 用 `tests/skill-fixtures/` + `pnpm forge-smoke`（静态 TDD）。**用户自建 Skill** 用本页的 `pnpm skill-eval`（触发用例结构 + 输出断言）。

参考：[如何评估 SKILL.md 质量](https://mp.weixin.qq.com/s/JWz6EscFlcDeHhTjsDybgg)（Zen Trading）· [LangChain evaluating skills](https://blog.langchain.com/evaluating-skills/) · [OpenAI eval-skills](https://developers.openai.com/blog/eval-skills)

## 三层分工

| 层 | 谁 | 做什么 |
|----|-----|--------|
| **Skill** | `SKILL.md` | 判断与流程 |
| **Eval 包** | `.forge/skills/<name>/eval/` | 触发用例 + 输出断言 |
| **脚本** | `pnpm skill-eval` | 静态校验；对 `eval-output/` 跑断言 |

与 **preflight** 不同：preflight = 发布前；skill-eval = **开发/迭代 Skill 时**。

## 快速开始

```bash
# 1. 初始化评估包（写入 .forge/skills/<name>/eval/）
pnpm skill-eval init my-skill

# 2. 编辑 triggers.json / cases.json（见 core/templates/skill-eval/）

# 3. 静态检查（结构、负例数量、已有产物断言）
pnpm skill-eval my-skill

# 4. 触发准确率 — 在 AI 客户端逐条跑 triggers.json 的 prompt
#    记录：是否调用了本 Skill（有 Skill vs 无 Skill 对照）

# 5. 输出质量 — Agent 跑完 cases 后，把产物放到 eval-output/<subdir>/
pnpm skill-eval my-skill
```

## 目录约定

```
.forge/skills/<skill-name>/eval/
├── triggers.json
├── cases.json
├── rejected-edits.json   # 可选 — 验证未通过的 Skill 编辑（负样本）
└── (项目根下) eval-output/<case-id>/   # 可选，cases.json 的 artifacts_root
```

Skill 本体通常在适配层目录，例如 `.claude/skills/<name>/SKILL.md`；eval 统一放在 `.forge/skills/` 便于版本管理与脚本发现。

## triggers.json

| 字段 | 说明 |
|------|------|
| `cases[].prompt` | 真实、带细节的用户说法 |
| `cases[].should_trigger` | `true` = 应路由到本 Skill；`false` = 不应触发 |
| `cases[].note` | 用例设计意图（尤其是「差一点就误触发」的负例） |

**静态检查**（`pnpm skill-eval`）：至少 2 条 `should_trigger: true`、2 条 `false`；负例不能全是「写斐波那契」类无效用例（脚本会警告）。

**运行时检查**（人工/Agent）：在客户端开/关 Skill 各跑一遍，填 `eval-run-log.md` 或团队表格即可。

## cases.json

| 字段 | 说明 |
|------|------|
| `artifacts_root` | 默认 `eval-output` |
| `cases[].artifacts_subdir` | 相对 `artifacts_root` 的子目录 |
| `cases[].assertions` | `fileExists`、`maxBytes`、`regexChecks`（与 preflight 同形） |

跑 Agent 后把文件放进对应子目录，再执行 `pnpm skill-eval <name>` 做定量断言。

### Train / held-out（SkillOpt 验证门简化版）

在 `cases.json` 的每条 case 上增加可选字段 `"split": "train" | "held-out"`：

| split | 用途 |
|-------|------|
| `train` | 改 Skill 时对照的回归集（默认无标签视为 train） |
| `held-out` | **升格/合并前**必须再跑一遍；未提升则不要 Confirm evolution 提案 |

`pnpm skill-eval` 当前对 split **不做强制**（静态检查仍跑全部 case）；团队约定：evolution **Verify by** 必须点名 held-out case id。

## rejected-edits.json

对齐 SkillOpt **rejected-edit buffer**：记录「已尝试但验证未通过」的 Skill 编辑，避免 evolution 重复提案。

| 字段 | 说明 |
|------|------|
| `entries[].op` | `add` \| `delete` \| `replace` |
| `entries[].target` | 如 `SKILL.md` § Workflow |
| `entries[].change` | 摘要或 diff 说明 |
| `entries[].reason` | 为何拒绝（Verify by 失败、held-out 退化等） |
| `entries[].at` | ISO 日期 |

`pnpm skill-eval init` 会生成空模板。详见 [skillopt-comparison.md](./skillopt-comparison.md)。

## Judge — 独立效果评估

> darwin-skill 启发：用独立 sub-agent 按 rubric 评估 Skill 质量，而非仅做静态结构检查。

Judge 是 `skill-eval` 的可选增强模式，用于评估 Skill 的**实际效果**，而非仅检查文件结构。

### 5 维 Rubric（满分 100）

| # | 维度 | 权重 | 说明 |
|---|------|------|------|
| 1 | 结构完整性 | 15% | frontmatter 质量、工作流清晰度、输入输出明确 |
| 2 | 可执行具体性 | 25% | 指令具体不模糊、有参数/格式/示例、可直接执行 |
| 3 | 失败模式编码 | 20% | 显式"如果 X 失败→执行 Y"分支、fallback、边界条件 |
| 4 | 反例完备性 | 15% | 有明确"不要做什么"清单、红灯动作单独章节 |
| 5 | 实测表现 | 25% | 用测试 prompt 执行 Skill，输出质量符合宣称能力 |

### CLI 命令

```bash
pnpm skill-eval judge-prep <name>        # 创建 judge-config.json
pnpm skill-eval judge <name>             # 打印 judge briefing（AI agent 使用）
pnpm skill-eval judge-record <name> --report <file>  # 记录 judge report 到 history
```

### Judge 工作流（AI agent 执行）

Judge 评估需要 AI agent 来 spawn 独立 sub-agent，CLI 只负责生成 briefing 和记录结果。

```
1. pnpm skill-eval judge-prep my-skill
   → 在 .forge/skills/my-skill/eval/ 创建 judge-config.json

2. pnpm skill-eval judge my-skill
   → 打印结构化 judge briefing（rubric + 测试 prompt + 指令）
   → AI agent 读取后 spawn 独立 sub-agent 作为 judge

3. Judge sub-agent 执行：
   a. 读取 SKILL.md
   b. 对每个测试 prompt 执行 Skill，评估输出质量
   c. 按 rubric 打分（1-10），附 evidence
   d. 输出 judge-report.json

4. pnpm skill-eval judge-record my-skill --report judge-report.json
   → 验证 report schema，追加到 judge-history.json
   → 输出分数摘要
```

### 设计原则

- **独立 judge**：judge sub-agent 与 Skill 作者是不同 agent，避免"自己改自己评"偏差
- **效果优先**：实测表现维度权重最高（25%），结构再好效果差也得低分
- **可追溯**：每次 judge 结果追加到 `judge-history.json`，支持趋势追踪
- **人机协作**：CLI 处理结构化的部分，AI agent 处理需要理解力的评估

### 已知限制

- 细粒度区分仍不可靠（参考 darwin-skill 引用的 SkillLens 论文：rubric 能识别 gross degradation，但 fine-grained 差异仍不可信）
- 测试 prompt 的质量决定 judge 有效性 — 应覆盖 happy path 和边缘场景
- 跨 session judge 一致性无保证 — 同一 Skill 在不同 session 的评分可能波动

## 与 skill-builder 的关系

`/skill-builder` 交付新 Skill 时 **必须**：

1. `pnpm skill-eval init <skill-name>`
2. 填满至少 4 条 trigger 用例 + 1 条 case 断言
3. `pnpm skill-eval <skill-name>` 通过静态检查

失败 3 次同类问题 → `feedback-observer` → 改 `SKILL.md` 或 eval 用例（进化闭环）。

## 常见陷阱（来自 Eval 方法论）

- 用例太简单 → 用带路径、文件名、业务细节的 prompt
- 只看成功用例 → 失败用例才驱动改 Skill
- 断言无区分度 → 断言应只有「有 Skill 且产物正确」时才过
- 忽视方差 → 同一 prompt 多跑几次，不稳定则收紧 SKILL 或拆脚本

## 相关

- [skillopt-comparison.md](./skillopt-comparison.md) — SkillOpt 五步 ↔ Forge
- [skill-builder SKILL](../skills/skill-builder/SKILL.md)
- [tests/skill-fixtures/README.md](../../tests/skill-fixtures/README.md) — 框架内置 Skill 静态探针
- [external-publish-preflight.md](./external-publish-preflight.md) — 发布门禁
