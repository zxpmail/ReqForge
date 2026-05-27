# 安全规则（Security Guidance）

> 团队可版本化的安全纪律。`code-review` / `release-builder` / 安全相关 Task 须对照本文件。
> 安装来源：`core/templates/security-guidance-template.md` → `.forge/security-guidance.md`（`pnpm forge-install` 写入）
>
> 对照 Anthropic [security-guidance](https://docs.anthropic.com/) 插件思路：轻量 first pass + 组织自定义规则；**不替代** CI/SAST。

---

## 内置红线（默认启用）

| 类别 | 禁止 / 须审查 | 说明 |
|------|----------------|------|
| 动态执行 | `eval()`、`new Function()` | 改用显式逻辑或安全解析 |
| 注入 | 字符串拼接 SQL / 未参数化查询 | 使用 ORM 参数绑定或 prepared statement |
| XSS | 未净化的 `dangerouslySetInnerHTML`、直接 `innerHTML = userInput` | 使用框架转义或 DOMPurify 等 |
| 密钥 | 硬编码 API Key、密码、私钥进仓库 | 环境变量 + `.env` 不入库 |
| 依赖 | 未经审查的 `pnpm add` / 随意安装包 | Agent 新增依赖须说明用途并过 review |

---

## 团队自定义规则（在此填写）

<!-- 把 PR 里反复出现的安全评论写在这里，越具体越好 -->

### 示例（可删）

- 禁止在生产路径使用 `eval` 和 `child_process.exec` 拼接用户输入
- 所有对外 API 须校验鉴权后再读数据库
- 日志不得输出 token / 密码 / 完整 PII

---

## 与 Forge 其它工件的关系

| 工件 | 用途 |
|------|------|
| `Product-Spec.md` | 功能与安全需求（what） |
| 本文件 | 实现层安全纪律（how，团队积累） |
| `/code-review` + security 子 Agent | Task/Phase 审查时对照本文件 + OWASP |
| `pnpm forge-verify` | Phase 后轻量模式扫描（`security-patterns`） |
| CI / SAST | 最终重型守门（Harness 不替代） |

---

## 维护说明

- 规则过松 = 无效；过紧 = 误杀正常代码。每季度或重大事故后回顾一次。
- 新增规则请写清：**触发模式** + **推荐写法** + **为何**（可链 OWASP/CWE）。

*Security Guidance · 随 forge-install 初始化，团队自行演进*
