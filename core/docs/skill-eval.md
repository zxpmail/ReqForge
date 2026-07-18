# Skill Eval（用户项目自定义 Skill 评估）

> 框架内置 Skill 用 `tests/skill-fixtures/` + `pnpm forge-smoke`（静态 TDD）。**用户自建 Skill** 用本页的 `pnpm skill-eval`（触发用例结构 + 输出断言）。

参考：[如何评估 SKILL.md 质量](https://mp.weixin.qq.com/s/JWz6EscFlcDeHhTjsDybgg)（Zen Trading）· [LangChain evaluating skills](https://blog.langchain.com/evaluating-skills/) · [OpenAI eval-skills](https://developers.openai.com/blog/eval-skills) · 飞轮对照 [agents-cli](https://github.com/google/agents-cli)（见 [agents-cli-comparison.md](./agents-cli-comparison.md)）

## 三类证据（勿混用）

| 层 | 验什么 | 本页关系 |
|----|--------|----------|
| **代码契约** | tsc / 单元测试 / lint | 不在 skill-eval 范围内 |
| **Skill 产出** | 触发、产物断言、judge | **本页** |
| **门禁 / 交付** | forge-verify / preflight / Phase 四步 | 不在 skill-eval 范围内 |

单测绿 ≠ Skill 行为对；skill-eval 绿 ≠ 产品可发布。借口表 → `core/skills/_shared/shortcuts-to-resist.md`。

## 三层分工

| 层 | 谁 | 做什么 |
|----|-----|--------|
| **Skill** | `SKILL.md` | 判断与流程 |
| **Eval 包** | `.forge/skills/<name>/eval/` | 触发用例 + 输出断言 |
| **脚本** | `pnpm skill-eval` | 静态校验；对 `eval-output/` 跑断言；飞轮 compare/analyze |

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

## Trigger — 触发准确率评估

> 基于 description 关键词匹配的触发准确率模拟评估，快速验证 Skill 的触发边界。

`pnpm skill-eval trigger <skill-name>` 自动生成 20 条测试查询（10 正例 + 10 负例），使用关键词匹配模拟预测触发结果，输出准确率报告。

### 工作原理

1. 读取 `SKILL.md` 的 `description` 字段，提取有意义的关键词（去停用词、要求中文或 4+ 英文字母）
2. 生成 20 条测试查询：正例基于描述关键词构造，负例用近亲场景（形似但不应触发）
3. 对每条查询做关键词匹配预测（`should_trigger` / `should_not_trigger`）
4. 对比预测与真实标签，输出准确率报告

### 报告示例

```
Trigger Rate: ████████████████████░ 95.0% (19/20) ✅ PASS

| Metric | Value |
|--------|-------|
| Total cases | 20 |
| Correct | 19 |
| Wrong | 1 |
| Positive (should trigger) | 10 |
| Negative (should NOT trigger) | 10 |
| Trigger Rate | 95.0% |
| Verdict | ✅ PASS (≥80%) |

Misclassified:
  False Negatives (should trigger, predicted no):
  - "优化博客列表显示" → keyword match failed. Try adding "显示" keywords
```

### 已知限制

- 关键词匹配是 AI 触发行为的简化模拟，实际 AI 触发准确率可能高于或低于此模拟值
- 停用词列表影响召回率：过松产生误报，过紧产生漏报
- 建议与人工对照测试互补：用 `triggers.json` 在 AI 客户端开/关 Skill 各跑一遍验证

## Judge — 独立效果评估

> darwin-skill 启发：用独立 sub-agent 按 rubric 评估 Skill 质量，而非仅做静态结构检查。

Judge 是 `skill-eval` 的可选增强模式，用于评估 Skill 的**实际效果**，而非仅检查文件结构。

### 6 维 Rubric（满分 100）

| # | 维度 | 权重 | 说明 |
|---|------|------|------|
| 1 | 结构完整性 | 10% | frontmatter 质量、工作流清晰度、输入输出明确、目录结构 |
| 2 | 可执行具体性 | 20% | 指令具体不模糊、有参数/格式/示例、可直接执行 |
| 3 | 失败模式编码 | 15% | 显式"如果 X 失败→执行 Y"分支、fallback、边界条件 |
| 4 | 反例完备性 | 10% | 有明确"不要做什么"清单、红灯动作单独章节 |
| 5 | 工作流质量与可重复性 | 30% | **结果一致性**（同一 prompt 多次执行是否稳定）、**验证步骤**（检查→修复→确认）、**真实可用性**（产物不经大量人工修正即可使用）、**输入适应性** |
| 6 | 实测效果与基线对比 | 15% | 有 Skill vs 无 Skill 的输出质量差异，端到端效果提升 |

> 相比 v1 rubric：新增"工作流质量与可重复性"维度（权重最高），强调工作流在真实项目中产出**可重复结果**的能力，而非仅 SKILL.md 文本质量。

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
- **效果优先**：工作流质量与可重复性维度权重最高（30%），强调真实项目中的可重复结果而非文本质量
- **基线对比**：第 6 维强制要求对比有/无 Skill 的输出差异，量化 Skill 的实际增益
- **可追溯**：每次 judge 结果追加到 `judge-history.json`，支持趋势追踪
- **人机协作**：CLI 处理结构化的部分，AI agent 处理需要理解力的评估

### 已知限制

- 细粒度区分仍不可靠（参考 darwin-skill 引用的 SkillLens 论文：rubric 能识别 gross degradation，但 fine-grained 差异仍不可信）
- 测试 prompt 的质量决定 judge 有效性 — 应覆盖 happy path 和边缘场景
- 跨 session judge 一致性无保证 — 同一 Skill 在不同 session 的评分可能波动
- **工作流可重复性评估需要多次执行**：单次判断无法可靠评估结果一致性，建议至少 2-3 次测试
- **真实项目上下文缺失**：Judge 在沙箱环境评估，无法完全模拟真实项目的复杂性；"真实可用性"评分为估算

## Ref-lint — 数字引用一致性检查

> OpenSpec 实战启发：SKILL.md 中"四个维度"后面模板只有 3 行，AI 按旧模板输出就漏了一维。改了定义没改引用 = 执行层走旧路径。

`pnpm skill-eval <name>` 运行时**自动**对 SKILL.md 做 ref-lint 检查（无需额外命令）：

### 检测逻辑

1. 扫描 SKILL.md 中数字 + 量词的模式（如"四个维度"、"3 steps"、"five layers"）
2. 向后查找最近的 markdown 列表（5 行内）
3. 计数实际列表项，与数字对比
4. 不一致 → `⚠️ warn`（如 `L12 "四个维度" claims 4 but list at L14 has 3 items`）

### 支持的数字格式

| 格式 | 示例 |
|------|------|
| 中文数字 | 一二三…十 |
| 阿拉伯数字 | 2, 3, 4… |
| 英文数字 | one, two, three…twelve |

### 支持的量词

中文：个/项/维度/步骤/层/阶段/条/点/处/行/部分/章节

英文：dimension/step/layer/phase/stage/item/point/rule/principle/task/check（含复数）

### 跳过条件

- 数字 < 2 或 > 20（"一个"无意义，"二十个"超出合理范围）
- 5 行内无 markdown 列表（可能是跨章节引用，无法自动匹配）
- 列表项为 0

### 设计原则

- **确定性检查 > AI judge**：正则 + 计数是机器可判定的，不依赖 AI 理解力
- **warn 而非 error**：可能存在合理的跨章节引用，人工确认即可
- **零配置**：随 `skill-eval run` 自动执行，无需额外命令或配置

## 与 skill-builder 的关系

`/skill-builder` 交付新 Skill 时 **必须**：

1. `pnpm skill-eval init <skill-name>`
2. 填满至少 4 条 trigger 用例 + 1 条 case 断言
3. `pnpm skill-eval <skill-name>` 通过静态检查

失败 3 次同类问题 → `feedback-observer` → 改 `SKILL.md` 或 eval 用例（进化闭环）。

## 质量飞轮（compare / analyze）

每次 `pnpm skill-eval <name>` 会把结果追加快照到 `.forge/skills/<name>/eval/run-history.json`。Judge 仍写入 `judge-history.json`。

```bash
# 改 Skill → 再跑 → 对比上次（回归则 exit 1）
pnpm skill-eval my-skill
pnpm skill-eval compare my-skill

# 失败归类（按 triggers / cases / assertions / ref-lint…）
pnpm skill-eval analyze my-skill

# Judge 维度对比 / 低分聚类
pnpm skill-eval compare my-skill --judge
pnpm skill-eval analyze my-skill --judge
```

推荐循环：`run → analyze → 改 Skill → run → compare`。预期多轮迭代；`compare` 显示 newly failing 时禁止宣称「改进完成」。

**禁止**：调低断言凑绿、删除不稳定用例、只改 expected 不改 Skill（见 shortcuts-to-resist）。

## 常见陷阱（来自 Eval 方法论）

- 用例太简单 → 用带路径、文件名、业务细节的 prompt
- 只看成功用例 → 失败用例才驱动改 Skill
- 断言无区分度 → 断言应只有「有 Skill 且产物正确」时才过
- 忽视方差 → 同一 prompt 多跑几次，不稳定则收紧 SKILL 或拆脚本

## 相关

- [agents-cli-comparison.md](./agents-cli-comparison.md) — 吸收点与不抄清单
- [skillopt-comparison.md](./skillopt-comparison.md) — SkillOpt 五步 ↔ Forge
- [skill-builder SKILL](../skills/skill-builder/SKILL.md)
- [tests/skill-fixtures/README.md](../../tests/skill-fixtures/README.md) — 框架内置 Skill 静态探针
- [external-publish-preflight.md](./external-publish-preflight.md) — 发布门禁
