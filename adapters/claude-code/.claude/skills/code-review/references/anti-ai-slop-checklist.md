# 反 AI 味清单（code-review）

> 提交 review report 前读本文。不是为了"检查"，是为了**激活正确的审查模式**。
> 下面三段锚点覆盖了 code-review 最常见的三种场景。

---

## 锚点一：Finding 编写模式

> 模型的自然倾向是写"代码不够健壮"这种模糊表述。
> 下面展示正确的 finding 格式：位置 + 场景 + 影响 + 建议。

```markdown
## Finding 1: 缺少输入校验 (file: src/api/register.ts:25)

**场景**: 当 email 参数为 `undefined` 或空字符串时，`db.findUnique` 会抛 `TypeError`
**影响**: `register` API 返回 500，不返回有意义的错误信息
**严重度**: HIGH（影响所有注册请求）

**建议**:
- 在入口处加 zod schema 校验
- 捕获已知错误类型并返回 422
```

关键点：
- 每条 finding 必须有 file:line（锚定到具体位置）
- 必须有场景（什么条件下会触发）
- "不健壮" 不是 finding——"X 场景下会 Y 失败" 才是

---

## 锚点二：安全审查模式

> 模型的自然倾向是"没写 SQL 所以没安全问题"。
> 下面展示正确的安全审查思路。

```markdown
## Security Review Scope

| 检查项 | 覆盖 | 结果 |
|--------|------|------|
| XSS | 用户输入是否在输出前转义？ | ✅ |
| CSRF | 状态变更请求是否有 token 或 SameSite？ | ✅ |
| 凭据硬编码 | grep `sk-ant-` `API_KEY` `password=` | ✅ none |
| 路径泄露 | grep `/Users/` `C:\\Users` | ✅ none |
| Input injection | 是否使用 ORM/参数化查询？ | ✅ |
```

关键点：
- 即使没写 SQL，也有 XSS/路径泄露/凭据硬编码等风险
- 安全审查不是 SQL injection 检查，是全维度 scan

---

## 锚点三：回归范围声明模式

> 模型的自然倾向是"其他功能应该不受影响"。
> 下面展示正确的回归 scope 声明。

```markdown
## Regression Scope

**可能影响**:
- `src/api/login.ts` — 修改了 auth middleware，影响所有 /api/* 端点
- `src/lib/db.ts` — 修改了连接池配置，影响所有数据库查询

**已验证**:
- `pnpm test`: 26/26 pass
- `curl /api/login`: 200 ✅
- `curl /api/register`: 200 ✅
- `curl /api/unknown`: 404 ✅

**未覆盖需注意**:
- 第三方 OAuth 登录（无测试环境，需手动验证）
```

关键点：
- "不受影响" 不是分析——列出为什么不受影响、怎么验证的
- 覆盖范围 = 明确列出已测 + 明确列出未测

---

## 兜底检查

| 检查项 | 通过标准 |
|--------|----------|
| 盖章式审查 | 每条 finding 有 file:line |
| 模糊表述 | 说清什么场景下会怎样失败 |
| 唯编译论 | 编译通过 ≠ 功能正确——审查了逻辑正确性，非仅编译无报错 |
| 偏见盲区 | 未改文件也被纳入上下文影响检查 |
| 安全错觉 | XSS/路径泄露/凭据硬编码均检查过 |
| 漏回归范围 | 显式列出回归 scope |
