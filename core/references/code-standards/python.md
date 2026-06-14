# Python 代码规范

> 当 dev-map.md 声明 Language: Python 时，dev-builder 和 code-review 按此标准执行。
> 用户可在 dev-map.md 的「注意事项」节覆盖或补充。

---

## 命名

| 元素 | 规则 | 示例 |
|------|------|------|
| 模块 | 全小写，下划线分隔 | `user_service.py` |
| 类 | PascalCase | `UserService` |
| 函数/方法 | snake_case | `find_user_by_id()` |
| 私有方法/字段 | 前导下划线 | `_validate_input()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 测试函数 | snake_case | `test_find_user_by_id_not_found()` |

## 包结构

按功能分包：

```
project/
├── user/
│   ├── __init__.py
│   ├── models.py        # 数据模型（Pydantic / Dataclass）
│   ├── service.py       # 业务逻辑
│   └── repository.py    # 数据访问
├── order/
│   ├── __init__.py
│   ├── models.py
│   └── service.py
├── common/
│   ├── __init__.py
│   ├── exceptions.py    # 统一异常定义
│   └── dependencies.py  # 通用依赖
├── main.py
└── pyproject.toml
```

## 编码约定

- **类型标注**: 所有函数必须带类型注解（`def find(name: str) -> User | None:`），开启 `mypy --strict`
- **Pydantic**: 数据模型优先用 Pydantic v2 BaseModel，不用裸 dict 传递数据
- **异步**: I/O 密集型用 `async def` + `asyncio` / `httpx`；CPU 密集型用 `ThreadPoolExecutor`
- **异常**: 统一用业务异常继承 `AppError(Exception)`，全局异常处理器捕获返回统一 JSON
- **None 处理**: 函数返回可选值用 `T | None`，调用方必须 `is None` 判断
- **Config**: 配置用 Pydantic Settings（`pydantic-settings`），不用 `os.environ` 裸读
- **日志**: 用 `loguru` 或 `structlog`，不用 `print()`

## 测试要求

- 框架: pytest
- 覆盖: 正常流程、异常路径、边界值、mock 外部调用
- 命名: `test_{function}_{scenario}`（`test_find_user_not_found_returns_none`）
- Fixture: 优先 conftest.py 共享 fixture，不在测试文件里重复定义
- 异步测试: 用 `pytest-asyncio`，标记 `@pytest.mark.asyncio`

## 不可触碰的红线

- **禁止** `print()` → 必须用 Logger（loguru / structlog）
- **禁止** 裸 `except:` → 必须明确异常类型
- **禁止** import \*（`from module import *`）
- **禁止** 用裸 dict 做数据模型 → 优先 Pydantic v2
- **禁止** 在业务逻辑里混 HTTP 层依赖（Request/Response 对象）
- **禁止** 全局可变状态 → 用依赖注入或 Context 模式
- **禁止** `os.environ` 在函数体内调用 → 统一用 Pydantic Settings

---

*此文件由 ReqForge 框架维护。用户可通过 dev-map.md「注意事项」覆盖。*
