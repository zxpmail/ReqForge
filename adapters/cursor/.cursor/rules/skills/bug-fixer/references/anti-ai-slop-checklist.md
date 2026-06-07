# 反 AI 味清单（bug-fixer）

> 修 bug 前读本文。不是为了"检查"，是为了**激活正确的修 bug 模式**。
> 下面三段锚点覆盖了 bug-fixer 最常见的三种场景。

---

## 锚点一：根因追踪模式

> 模型的自然倾向是扫一眼错误信息，直接猜原因然后改代码。
> 下面展示正确的路径：先复现 → 定位根因 → 最小修复 → 回归防护。

```typescript
// ❌ 错误：直接 try-catch 吞错误（症状修复）
try {
  const user = db.findUser(id);
} catch (e) {
  return null; // 问题被隐藏了
}

// ✅ 正确：根因追踪
// Step 1: 复现（给出触发条件）
// "当 id 为 undefined 时 db.findUser 会抛 TypeError"
// Step 2: 定位根因（调用链分析）
// "调用方 getUserProfile API 未校验 id 参数"
// Step 3: 最小修复（只改根因）
if (typeof id !== 'number') {
  throw new AppError(ErrorCode.INVALID_PARAM, 'id must be a number');
}
const user = db.findUser(id);
// Step 4: 回归测试（确保同类路径覆盖）
// expect(getUserProfile()).rejects.toThrow('id must be a number');
```

关键点：
- 复现 > 猜原因（没有复现步骤的修 bug 是碰运气）
- 修根因，不修表现层（try-catch 包住错误不算修好）
- 最小改动，不顺便重构

---

## 锚点二：修复范围模式

> 模型的自然倾向是修一个 bug 时把整个函数翻新一遍。
> 下面展示最小修复 + 同类检查。

```typescript
// ❌ 错误：修了一个 null，重构了整个函数（过度修复）
// ❌ 错误：只修了报告的那一处，同类型模式在其他文件没改

// ✅ 正确：最小修复 + 同类扫描
// 报告：用户登录时邮箱大小写不敏感导致重复注册
// 
// Step 1: 定位根因
// register() 函数中查重时未做 lowercase
// 
// Step 2: 最小修复（只改 1 行）
if (existingUser.email.toLowerCase() === email.toLowerCase()) {
  // 找到匹配
}
// 
// Step 3: 同类扫描（查找同模式的其他位置）
// grep: .toLowerCase() 缺失的同一模式在 login.ts 也出现
// → 同模式同修复
```

关键点：
- 修一个 null 不需要重构整个函数
- 修完一处，grep 同模式的其他位置

---

## 锚点三：回归防护模式

> 模型的自然倾向是修完就提交，忘了加测试。
> 下面展示 why 这个 bug 之前没被测试捕获 + 新增测试覆盖。

```typescript
// ✅ 正确的回归测试
describe('register', () => {
  it('prevents duplicate email (case insensitive)', async () => {
    await register('User@Example.com', 'pw1');
    await expect(
      register('user@example.com', 'pw2')
    ).rejects.toThrow('Email already registered');
  });
});
```

关键点：
- 没加回归测试的修 bug = 下次可能再踩同一个坑
- 加一个能捕获此 bug 的测试用例（不是 expect(true).toBe(true)）

---

## 兜底检查

| 检查项 | 通过标准 |
|--------|----------|
| 凭感觉修 | 有复现步骤 + 根因追踪，非「好像是这个问题」 |
| 跳过复现 | 必须能复现才能确认修好——非「我没能复现但我觉得修好了」 |
| 症状修复 | 非 try-catch 吞错误——修了源头 |
| 编造证据 | 贴出测试输出或截图确认修复通过，非仅口头说「测试通过了」 |
| 过度修复 | 改动量 ≤ 问题所需 |
| 无回归防护 | 已添加能捕获此 bug 的测试用例 |
| 范围幻想 | 显式声明了调用链分析结果 |
| 只修一处 | 同类型模式在代码中已 grep 检查 |
