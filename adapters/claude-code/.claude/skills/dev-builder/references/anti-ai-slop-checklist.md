# 反 AI 味清单（dev-builder）

> 编码前读本文。不是为了"检查"，是为了**激活正确的生成模式**。
> 下面三段代码范例覆盖了 dev-builder 最常见的三种编码场景。
> 读完后模型自然续写时，会倾向于走这些路径，而不是发散到反模式上。
> **兜底检查**在段落末尾，供交付前确认。

---

## 锚点一：错误处理模式

> 模型的自然倾向是 `try { ... } catch (e) { console.error(e) }` 然后继续。
> 下面这段展示了你应该采取的路径——不吞错误，不暴露细节，用户有反馈。

```typescript
// ✅ 正确错误处理模式
import { AppError, ErrorCode } from "./errors";

async function createUser(email: string, password: string): Promise<User> {
  // 输入校验在入口层，不在函数体内
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(ErrorCode.CONFLICT, "Email already registered");
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { email, passwordHash: hashed } });

  logger.info("User created", { userId: user.id });  // 日志用 ID，不用 email
  return user;
}
```

关键点：
- AppError 统一错误类型（不用 `throw new Error("xxx")` 散养）
- 日志只记 ID，不记 PII
- 输入校验在入口层（zod / yup），不在业务函数内

---

## 锚点二：API 端点模式

> 模型的自然倾向是直接在路由处理函数里写所有逻辑。
> 下面这段展示了分离 Controller + Service + Validator 的结构。

```typescript
// ✅ 正确 API 端点模式
import { z } from "zod";
import { createUser } from "./service";
import { AppError } from "./errors";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = CreateUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const user = await createUser(parsed.data.email, parsed.data.password);
    return Response.json({ id: user.id }, { status: 201 });
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json({ error: e.message }, { status: e.httpStatus });
    }
    throw e;  // 未预期的错误让全局错误处理器处理
  }
}
```

关键点：
- Zod schema 在入口层做校验
- Controller 只做编排，不做业务逻辑
- 未预期错误抛给全局处理器，不在这里吞掉

---

## 锚点三：测试模式

> 模型的自然倾向是写 `expect(true).toBe(true)` 或只测 happy path。
> 下面这段展示了要测什么、怎么测。

```typescript
// ✅ 正确测试模式
import { describe, it, expect } from "vitest";
import { createUser } from "./service";

describe("createUser", () => {
  // RED: 明确预期的行为，不是测试实现细节
  it("rejects duplicate email", async () => {
    await createUser("test@test.com", "password123");
    await expect(
      createUser("test@test.com", "password123")
    ).rejects.toThrow("Email already registered");
  });

  it("hashes password with bcrypt", async () => {
    const user = await createUser("new@test.com", "mypassword");
    expect(user.passwordHash).not.toBe("mypassword");  // 不是明文
    expect(user.passwordHash).toMatch(/^\$2b\$/);        // 是 bcrypt 格式
  });

  it("logs user id, not email", async () => {
    // logger 的调用在测试里可以被 mock 验证
  });
});
```

关键点：
- 每个测试断言一个行为（不是三个 assert 塞一个 it）
- 测试行为而不是实现
- 包括边界场景（重复、非法输入、权限不足）

---

## 兜底检查

> 以上三段锚点阅读完毕。交付前快速扫一眼下面的检查项是否还有盲区。

| 检查项 | 通过标准 |
|--------|----------|
| 过度抽象 | 非为「未来需求」预建 Factory/Strategy/interface——YAGNI |
| 幻觉 API | 使用的 API/方法在依赖中真实存在，非「应该有这个方法」 |
| 魔法值硬编码 | 非数字/字符串直接写在业务逻辑中——已提取为常量 |
| 空 catch | catch 块非空或只 `console.error`——有错误处理和用户反馈 |
| 复制粘贴模板 | 非从一个模块复制代码到另一个模块仅改变量名——已提取公共逻辑 |
| 虚假测试 | 测试非 `expect(true).toBe(true)` 或只测了 happy path |
| 注释废料 | 无 `// TODO: fix later`、`// This is a workaround` 等遗留标记 |
| 类型逃生 | 无 `as any`、`@ts-ignore`、`// @ts-nocheck`——除非有注释解释 |
| 样式散射 | 非全页面分散写 tailwind class——遵循项目样式约定 |
