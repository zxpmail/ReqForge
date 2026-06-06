# 安全规则（Security Rules）

> Agent 在生成代码时必须遵守的硬约束。复制到 `.claude/rules/security.md`（或对应客户端的规则目录）即全局生效。
> 安装：`cp core/templates/security-rules-template.md .claude/rules/security.md`

---

## 规则一：禁止硬编码任何密钥

**适用对象**：所有生成的代码、配置文件、脚本、文档。

**约束**：
- API Key、Token、密码、私钥、连接字符串——**0 例外禁止硬编码**
- 所有密钥必须从环境变量、密钥管理服务（Vault / AWS Secrets Manager）或 CI secrets 注入
- `.env` 文件不得提交到版本控制（加入 `.gitignore`）
- 代码示例中用 `<your-api-key>` 或 `process.env.XXX` 占位

**Agent 检查（生成时自检）**：
```
正则匹配 sk-ant-|sk-proj-|ANTHROPIC_API_KEY|OPENAI_API_KEY|password.*=
→ 命中则阻断，改为环境变量注入
正则匹配 VITE_.*KEY|VITE_.*SECRET
→ 检查该变量是否真的需要在浏览器端暴露，若不需要则移出 VITE_ 前缀
```

**后果**：硬编码密钥泄露即安全事故。CI 须添加 secret 扫描（如 GitLeaks / truffleHog）。

---

## 规则二：强制所有外部输入做验证

**适用对象**：所有接收外部输入的函数、API 端点、Webhook、表单、CLI 参数。

**约束**：
- 任何来自用户、请求参数、请求体、Header、文件上传的数据**必须先验证后使用**
- 禁止将未验证的输入直接拼接到 SQL 查询、shell 命令、HTML 输出中
- 输入校验优先级：**allowlist（白名单）> denylist（黑名单）** —— 定义合法值而不是屏蔽非法值
- 类型检查：数字需在预期范围内，字符串需限制长度和字符集
- 文件上传：校验 MIME type、大小上限、文件名无害化

**技术选型推荐**：
- TypeScript 项目：`zod` 或 `valibot` 定义 schema，在入口层 parse
- Python 项目：`pydantic` 做数据模型校验
- Go 项目：`go-playground/validator` 标签式校验

**Agent 检查**：
```
每个接收外部输入的路径 → 是否在入口处有 schema 验证？
若没有 → 自动补全，不允许留给开发者"后面再加"
```

---

## 规则三：敏感操作必须有审计日志

**适用对象**：修改数据、操作资金、管理权限、删除资源、批量操作、用户隐私数据处理。

**约束**：
- 以下操作**必须**写审计日志：
  - 用户认证事件（登录、登出、密码变更、MFA 绑定/解绑）
  - 数据变更（创建/更新/删除用户数据、权限变更）
  - 资金操作（支付、退款、订阅变更、信用调整）
  - 管理操作（封号、解封、配置变更）
  - 批量操作（导入/导出/全量更新）
  - 涉及 PII（个人身份信息）的任何读取或修改

- 审计日志最少包含：
  - `who` — 操作者 ID（用户 / 系统 / admin）
  - `what` — 操作类型 + 资源标识
  - `when` — UTC 时间戳
  - `result` — 成功 / 失败（含错误码）
  - `client_ip` — 来源 IP（若适用）
  - `correlation_id` — 追踪链 ID（若适用）

- 审计日志**不可篡改**（append-only），单独的日志表或日志服务
- 审计日志**不得包含**完整密码、token、API Key

**Agent 检查**：
```
对每个修改/删除/资金/权限操作 → 检查是否写了审计日志
若没有 → 自动添加 audit 记录代码，不允许跳过
```

---

## 附加约束：日志不泄漏 PII

**这条经常被忽略，但在 GDPR/CCPA 合规中是最容易踩的坑。**

- 禁止在错误日志、访问日志、调试日志中输出用户的**个人身份信息（PII）**
- PII 包括但不限于：邮箱、电话、姓名全称、IP 地址（欧盟）、证件号、精确位置
- 日志中的用户标识只能用**内部 ID**，不可用邮箱或手机号

**推荐做法**：
```typescript
// ❌ 错误：日志泄漏用户邮箱
logger.error(`Payment failed for user ${user.email}`);

// ✅ 正确：用内部 ID
logger.error(`Payment failed for user ${user.id}`);
```

```python
# ❌ 错误：日志泄漏 PII
logger.info(f"Login attempt from {request.remote_addr} by {user.email}")

# ✅ 正确：记录必要信息但不含 PII
logger.info(f"Login attempt: user_id={user.id}, success={result.success}")
```

---

## 快速安装

```bash
# Claude Code
cp core/templates/security-rules-template.md .claude/rules/security.md

# Cursor
cp core/templates/security-rules-template.md .cursor/rules/security.mdc

# OpenCode
cp core/templates/security-rules-template.md .opencode/rules/security.md

# Gemini CLI
cp core/templates/security-rules-template.md .gemini/rules/security.md
```

> **提示**：全局安装（`~/.claude/rules/`）对所有项目生效。出海中大型项目建议全局装，避免遗漏。
