# Skill Authoring Patterns

> 实战提示词模式 × darwin-skill 评估体系 × ReqForge Harness 经验的 Skill 编写参考。
> 参考来源：《90%的人都用错了AI！300个提示词合集》六大类实战模式 + darwin-skill 9 维 rubric + ReqForge 框架 Skill 编写实践。

---

## 1. 工作流设计模式

所有 ReqForge Skill 的核心都是多步骤工作流。以下是三种基础模式：

### 顺序步骤（最常用）

```
## Workflow

### Step 1: [动作]
- 输入：[期望输入]
- 执行：[具体指令，含参数/格式]
- 输出：[预期产出]

### Step 2: [动作]
...
```

每条步骤必须有**可执行的指令**，而不是建议性描述。

### 条件分支

```
if [条件]:
  执行分支 A
else:
  执行分支 B
```

条件必须是机器可判定的（文件存在、变量非空、状态码），不是"根据情况判断"。

### 重试循环

```
for attempt in 1..MAX_RETRIES:
  执行操作
  if 成功 → break
  if 失败 → 记录错误，等待后重试
if 全部失败 → 执行 fallback
```

**300 提示词映射**：1-50 的编码模式大量使用顺序 + 条件分支结构；API 接口生成、数据库查询优化等模式可参考顺序步骤设计。

---

## 2. 失败模式编码（Failure-Mode Encoding）

darwin-skill 实证显示：这是 rubric 中最能区分 Skill 质量的维度之一。

### 三段式 Fallback 表

```
| 触发条件 | 一线修复 | 仍失败兜底 |
|---------|---------|-----------|
| API 返回 4xx | 重试 1 次 | 输出错误信息给用户 |
| 文件不存在 | 创建空文件 | 跳过该步骤 |
| 超时 > 10s | 缩减请求范围 | 降级为本地处理 |
```

### 错误恢复章节

```
## 异常处理

### 常见失败场景
1. [场景 A] → [修复方法]
2. [场景 B] → [修复方法]

### 边界条件
- 输入为空 → [行为]
- 网络不可用 → [行为]
- 权限不足 → [行为]
```

**关键规则**：只写正向流程而不写失败分支的 Skill，在 judge rubric 中扣 >=3 分（满分 10 分制）。

**300 提示词映射**：文章 #17（代码架构审查）、#18（添加错误处理）的模式直接对应失败模式编码。

---

## 3. 可执行具体性（Actionable Specificity）

### 禁用词清单

以下措辞在 SKILL.md 中出现 >=3 处即扣分：

| 禁用词 | 替换为 |
|--------|--------|
| "建议" | "必须" / "执行" |
| "可以考虑" | 直接给出条件分支 |
| "根据情况" | 明确 if-then 条件 |
| "灵活把握" | 写出具体边界 |
| "视情况而定" | 不可能的，必须确定 |
| "通常来说" | 去掉，直接写规则 |
| "首先其次综上" | 结构化步骤（AI 腔废话） |
| "如果你愿意，我还可以…" / Closing 菜单 | 删掉；需要分支时写进 Workflow 的 if-then，不要留给用户可见回复（见 [talk-normal](https://github.com/hexiecs/talk-normal)） |

### 负例写法（勿被模型照抄）

[talk-normal](https://github.com/hexiecs/talk-normal) 的 `regressions/` 记录：禁令若写成**过长、过具体的 BAD 例句**（如固定「不是 X，而是 Y」修辞），模型会**原样复述**当模板，泄漏反而上升。

- Skill 里写 **抽象禁令** + **原则**（「禁止 Closing 菜单」），不要贴一整段「错误示范全文」。
- 任务级语气：各 Skill `references/output-style.md`；通用对话 AI 腔：用户可选叠加 talk-normal，见 [talk-normal-comparison.md](./talk-normal-comparison.md)。
- **Forge 审查/Spec 输出**要证据与条款，不能为了「短」砍掉 Must-fix 与 Spec 引用。

### 参数化示例

```
正确：npx create-next-app@latest my-app --typescript --tailwind --app
错误：用脚手架工具创建项目

正确：SELECT * FROM users WHERE status = 'active' LIMIT 10
错误：查询活跃用户
```

### 格式约束

- 路径、文件名、命令必须完整可执行
- 使用 `[占位符]` 标记用户需替换的部分
- 所有技术栈版本必须 pin 到 exact version

**300 提示词映射**：文章 #3（重构可读性）、#10（编写文档）的模式强调具体性，可参考其语气和细节密度。

---

## 4. 反例黑名单（Anti-Pattern Blacklist）

### Skill 必备章节

每个 Skill 应包含"不做什么"的显式章节：

```
## 不要做什么

- ❌ [反模式 A] — 为什么有害
- ❌ [反模式 B] — 为什么有害
```

### 通用反模式清单（适用于所有 Skill）

| 反模式 | 后果 |
|--------|------|
| 同 AI 又改又评 | 自评偏差，LLM 自评准确率仅 46.4% |
| 无验证就宣称完成 | Sloppiness Gate 拦截 |
| 一轮改多个维度 | 无法归因改进 |
| 跳过测试 prompt 直接评分 | 效果维度不可信 |
| 静默跳过异常 | 用户不知情导致坏结果 |

### 红灯操作

```
## 🚨 红灯操作
- git reset --hard（用 git revert 替代）
- rm -rf（确认路径后再执行）
- force push 到 main（禁止）
```

**300 提示词映射**：文章 #11（安全审计）的模式直接对应红灯动作检查。

---

## 5. 评估与检查点

### 视觉标记

LLM 对视觉标记敏感。使用以下标记强制暂停：

```
🔴 CHECKPOINT  — 重要决策前暂停，等用户确认
🛑 STOP       — 强制停止，不可跳过
✅ DONE       — 步骤完成标记
```

4 行 🔴 标记改动可撬动检查点维度 +3.5 分（darwin-skill 实战数据）。

### 验证步骤

```
### 验证
1. [命令] → 预期输出 [A]
2. [命令] → 预期输出 [B]
3. 全部通过才算 DONE
```

验证必须可重复执行，不能依赖"之前跑过"。

### 自检清单

```
## 完成标准
- [ ] 编译通过（tsc --noEmit）
- [ ] 测试通过（pnpm test）
- [ ] 无 TBD/FIXME
```

**300 提示词映射**：文章 #54（评估提示词质量）的模式可融入检查点设计；#59（构建 AI 评估框架）可作为验证步骤参考。

---

## 6. 多 Agent 协作模式

对于需要 spawn 子 agent 的 Skill：

### Agent 角色定义

```
Sub-agent: [名称]
Role: [它在做什么]
Inputs: [需要传递什么]
Outputs: [它产出什么]
Stop条件: [何时交回控制权]
```

### 上下文隔离

```
- 每个 sub-agent 是独立实例，不共享状态
- 通过结构化文件（JSON）传递信息
- 不使用全局变量
```

### 输入/输出契约

```
## 输入文件结构
{
  "input": "...",
  "constraints": ["..."],
  "references": ["..."]
}

## 输出文件结构
{
  "result": "...",
  "evidence": ["..."],
  "confidence": "high|medium|low"
}
```

**300 提示词映射**：文章 #51（设计 AI Agent）、#58（设计多 Agent 系统）的模式直接对应子 Agent 编排。

---

## 7. 300 提示词 → ReqForge Skill 映射表

| 文章类别 | 提示词范围 | 映射到 ReqForge | 说明 |
|---------|-----------|----------------|------|
| 编码与调试 | 1-50 | dev-builder, code-review, bug-fixer | 已覆盖。其中 #2（调试）、#11（安全审计）可直接作为 bug-fixer / code-review 的 prompt 模板参考 |
| AI 工作流 | 51-100 | 所有 Skill + evolution-engine | #51 Agent 设计 → 子 Agent 编排；#54 评估 → judge；#58 多 Agent → 并行 worktree |
| 研究分析 | 101-150 | product-spec-builder | 竞品分析、用户研究类 prompt 可补充 Spec 阶段的深度 |
| 自动化 | 151-200 | dev-builder, forge-verify | CI/CD、测试自动化类 prompt 与 verify 门禁互补 |
| 内容创作 | 201-250 | （ReqForge 当前未覆盖） | 文档生成、报告撰写 — 可考虑 future skill |
| 生产力系统 | 251-300 | （ReqForge 当前未覆盖） | 项目管理、任务追踪 — 与 memory 系统有重叠 |

---

## 8. Rubric 自查表

写 Skill 时可对照以下 5 维 rubric 自评：

| 维度 | 高分特征（8-10） | 低分特征（1-3） |
|------|-----------------|----------------|
| 结构完整性 | 完整 frontmatter + 步骤有序号 + 输入输出明确 | 缺少 frontmatter、步骤混乱 |
| 可执行具体性 | 每条指令可直接执行、有具体参数 | 大量"建议/考虑"措辞 |
| 失败模式编码 | 显式 if-then fallback 表 + 边界条件 | 只写正向流程 |
| 反例完备性 | 独立"不要做什么"章节 + 红灯清单 | 无反例 |
| 实测表现 | 有测试 prompt + 输出质量显著优于 baseline | 无测试或效果差 |

---

*Skill Authoring Patterns · 随实践更新。建议 Skill 作者在写 SKILL.md 时对照 rubric 自查表*
