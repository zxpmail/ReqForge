# Go 代码规范

> 当 dev-map.md 声明 Language: Go 时，dev-builder 和 code-review 按此标准执行。
> 用户可在 dev-map.md 的「注意事项」节覆盖或补充。

---

## 命名

| 元素 | 规则 | 示例 |
|------|------|------|
| 包名 | 全小写，单数 | `service`, `repository` |
| 导出类型 | PascalCase | `UserService` |
| 未导出类型 | camelCase | `userService` |
| 接口名 | 方法名 + `er` | `UserRepository`, `Finder` |
| 函数 | PascalCase（导出）/ camelCase（未导出） | `FindUserByID()`, `findUser()` |
| 错误变量 | `Err` 前缀或 `Error` 后缀 | `ErrNotFound`, `ValidationError` |
| 测试函数 | `Test` + PascalCase | `TestFindUserByID` |

## 包结构

按功能分包，避免过于深的层级：

```
project/
├── cmd/
│   └── server/
│       └── main.go          # 入口，尽可能精简
├── internal/
│   ├── user/
│   │   ├── service.go       # 业务逻辑
│   │   ├── repository.go    # 数据访问
│   │   └── model.go         # 领域模型（struct）
│   ├── order/
│   │   ├── service.go
│   │   └── model.go
│   └── common/
│       ├── errors.go        # 统一错误定义
│       └── middleware.go    # HTTP middleware
├── pkg/                     # 可外部引用的共享库
│   └── response/
│       └── json.go
├── go.mod
└── go.sum
```

## 编码约定

- **错误处理**: Go 风格显式返回 `error`，不 panic。调用方必须处理或显式忽略（`_ =`）。返回值最后一个是 `error`
- **接口**: 小接口（1-3 方法），定义在使用方而不是实现方。接受接口，返回结构体
- **零值**: 利用零值语义（`var s []string` 可直接 append），不用初始化函数返回空结构体
- **Context**: 函数第一个参数传递 `context.Context`，不存 struct 字段
- **并发**: 用 goroutine + channel，不用 sync 包裸共享内存。用 `errgroup` 管理并发错误
- **日志**: 用 `slog`（标准库）或 `zerolog`，不用 `log.Println()`
- **配置**: 用 `envconfig` / `viper`，从环境变量读取，不在代码里硬编码默认值

## 测试要求

- 框架: 标准库 `testing` + `stretchr/testify`（可选）
- 覆盖: `go test -cover`，业务包 ≥ 70%
- 命名: `Test{Function}_{Scenario}` → `TestFindUser_NotFound`
- Table-driven: 多输入场景用 table-driven test：

  ```go
  func TestFindUser(t *testing.T) {
      tests := []struct {
          name string
          id   string
          want error
      }{
          {"valid user", "user-1", nil},
          {"not found", "nonexistent", ErrNotFound},
      }
      for _, tt := range tests {
          t.Run(tt.name, func(t *testing.T) { ... })
      }
  }
  ```

- Mock: 优先用接口 stub 替代 mock 框架。必须 mock 时用 `gomock` / `testify/mock`

## 不可触碰的红线

- **禁止** `panic()` 在业务代码中使用（init 阶段可合理使用）
- **禁止** 忽略 `error` 返回值（`_ =` 只允许在你明确知道不需要处理时）
- **禁止** 全局 `sync.Map` 或裸 `map` 无锁访问
- **禁止** 循环 import
- **禁止** `init()` 函数做业务初始化（仅限于 flag 注册等）
- **禁止** `context.Background()` 在 handler 之外的 goroutine 中使用 → 必须传递
- **禁止** 超过 300 行的文件 → 按职责拆分

---

*此文件由 ReqForge 框架维护。用户可通过 dev-map.md「注意事项」覆盖。*
