# Java 代码规范

> 当 dev-map.md 声明 Language: Java 时，dev-builder 和 code-review 按此标准执行。
> 用户可在 dev-map.md 的「注意事项」节覆盖或补充。

---

## 命名

| 元素 | 规则 | 示例 |
|------|------|------|
| 包名 | 全小写，点分隔 | `com.storyforge.service` |
| 类/接口 | PascalCase | `UserService`, `OrderRepository` |
| 方法/字段 | camelCase | `findUserById()`, `totalAmount` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 枚举 | PascalCase（类）+ UPPER_SNAKE_CASE（值） | `Status.PENDING` |
| 测试类 | `{Class}Test` | `UserServiceTest` |

## 包结构

按功能分包，不按层分包：

```
com.storyforge
├── user/              # 用户模块
│   ├── UserController.java
│   ├── UserService.java
│   ├── UserRepository.java
│   └── User.java          # 领域模型
├── order/
│   ├── OrderController.java
│   ├── OrderService.java
│   └── Order.java
└── common/            # 跨模块共享
    ├── config/
    ├── exception/
    └── util/
```

**不推荐**按层分包（controller/ service/ repository/）—— 一个功能横跨多层时难以定位。

## 编码约定

- **Lombok**: 允许 `@Data`、`@Builder`、`@Slf4j`。禁止 `@Setter` 在 Entity 上（破坏封装）
- **依赖注入**: 构造器注入（`@RequiredArgsConstructor`），不用 `@Autowired` 字段注入
- **异常**: 统一用业务异常 `StoryForgeException`（继承 `RuntimeException`），不在 Controller 层 try-catch → 全局 `@RestControllerAdvice` 处理
- **Null 处理**: 优先 `Optional` 或 `@Nullable` + `Objects.requireNonNull()`，不返回裸 null
- **Stream**: 链式操作不超过 3 个中间操作，超过就拆成带变量名的步骤
- **API**: Controller 返回 `ResponseEntity<R<T>>` 统一包装，不直接返回裸对象

## 测试要求

- 框架: JUnit 5 + Mockito
- 覆盖: 业务层必须覆盖正常流程、异常路径、边界值
- 命名: `methodName_scenario_expectedResult`（`findUserById_userNotFound_throwsException`）
- 隔离: 用 `@ExtendWith(MockitoExtension.class)`，不启动 Spring Context 测业务逻辑

## 不可触碰的红线

- **禁止** `System.out.println()` → 必须用 Logger
- **禁止** 裸 `catch (Exception e)` → 必须明确异常类型或使用业务异常
- **禁止** Controller 层直接调用 Repository → 必须通过 Service
- **禁止** 循环依赖 → 用接口或事件解耦
- **禁止** 硬编码值 → 必须用配置文件或枚举
- **禁止** `@Autowired` 字段注入 → 必须构造器注入
- **禁止** 忽略 `@Transactional` 传播性（Service 层事务传递给 Repository）

---

*此文件由 ReqForge 框架维护。用户可通过 dev-map.md「注意事项」覆盖。*
