# Rust 代码规范

> 当 dev-map.md 声明 Language: Rust 时，dev-builder 和 code-review 按此标准执行。
> 用户可在 dev-map.md 的「注意事项」节覆盖或补充。

---

## 命名

| 元素 | 规则 | 示例 |
|------|------|------|
| 包/Crate | 全小写，下划线分隔 | `story_forge` |
| 结构体/枚举/trait | PascalCase | `UserService`, `Status` |
| 函数/方法 | snake_case | `find_user_by_id()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 泛型参数 | 单个大写字母或描述性 PascalCase | `T`, `Error` |
| 测试函数 | snake_case | `test_find_user_not_found` |
| 模块 | snake_case | `user_service` |

## 包结构

按功能模块组织：

```
src/
├── user/
│   ├── mod.rs              # 模块入口，重新导出
│   ├── service.rs          # 业务逻辑
│   ├── repository.rs       # 数据访问
│   └── model.rs            # 领域结构体
├── order/
│   ├── mod.rs
│   ├── service.rs
│   └── model.rs
├── common/
│   ├── mod.rs
│   ├── error.rs            # 统一错误类型
│   └── middleware.rs
├── lib.rs                   # 库入口
└── main.rs                  # 二进制入口，尽可能薄
```

## 编码约定

- **所有权**: 函数参数优先用 `&T` 或 `&mut T`，避免不必要的 `clone()`。生命周期标注只在实际无法省略时使用
- **错误处理**: 统一用 `thiserror` 派生自定义错误类型，用 `anyhow` 在应用层传递上下文异常。主函数返回 `anyhow::Result<()>`
- **Result / Option**: 对可能失败的操作返回 `Result<T, E>`，对可能为空的值返回 `Option<T>`。不返回 `unwrap()` 在除了测试和原型之外的代码中
- **Trait**: 优先使用现有 trait（`From`, `Display`, `IntoIterator`），不自己发明接口模式。用 `impl Trait` 参数代替 `Box<dyn Trait>` 除非需要动态分发
- **异步**: 用 `tokio` 或 `async-std`，async fn 从入口一路穿透到底层 IO，不在半路用 `block_on` 同步化
- **并发**: 用 `tokio::spawn` + channel（`tokio::sync::mpsc`/`broadcast`）做通信，用 `Arc<Mutex<T>>` 只在共享状态确实无法用 channel 替代时
- **配置**: 用 `config` / `dotenvy` + `serde::Deserialize`，配置结构体带默认值和文档注释
- **序列化**: 用 `serde` + `serde_json`，结构体标注 `#[derive(Serialize, Deserialize)]`

## 测试要求

- 框架: 标准库 `#[cfg(test)] mod tests { ... }`
- 覆盖: 业务逻辑模块 ≥ 80%，`cargo tarpaulin` 测量
- 命名: `{fn}_{scenario}` 或 `test_{fn}_{scenario}`
- 测试类型: 单元测试放在模块文件内，集成测试放在 `tests/` 目录下（每个文件一个测试 crate）
- Mock: 用 trait + 测试替身（test double），不引入 mock 框架；需要 mock HTTP 时用 `wiremock`

## 不可触碰的红线

- **禁止** `unwrap()` 在生产代码中（除 `.lock()` 和测试外）
- **禁止** `unsafe` 除非在 FFI 或明确性能关键路径并附加安全注释
- **禁止** 裸 `println!()` 用于日志 → 必须用 `log` / `tracing` crate
- **禁止** 循环引用导致的内存泄漏（`Rc<RefCell<T>>` 图的循环引用）
- **禁止** `use *` 通配符导入（prelude 模式例外）
- **禁止** 结构体 `Clone` 或 `Copy` derive 不加文档注释说明为什么需要

---

*此文件由 ReqForge 框架维护。用户可通过 dev-map.md「注意事项」覆盖。*
