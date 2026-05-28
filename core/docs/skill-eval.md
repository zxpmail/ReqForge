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

- [skill-builder SKILL](../skills/skill-builder/SKILL.md)
- [tests/skill-fixtures/README.md](../../tests/skill-fixtures/README.md) — 框架内置 Skill 静态探针
- [external-publish-preflight.md](./external-publish-preflight.md) — 发布门禁
