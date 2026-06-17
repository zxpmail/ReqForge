### 已有 validator 模块的结构模式（参考 src/validator.py）

```python
import re


def validate_required(value: str) -> bool:
    """Returns True if value is not None and not empty after stripping."""
    return value is not None and str(value).strip() != ""
```

特点：模块级函数、类型注解 `value: str -> bool`、docstring 格式、`import re` 开头（如有正则）。

### 已有测试的模式（参考 tests/test_validator.py）

```python
import pytest
from src.validator import validate_required


def test_validate_required_with_value():
    assert validate_required("hello") is True


def test_validate_required_empty_string():
    assert validate_required("") is False
```

特点：`from src.validator import <function>`、pytest + `assert`、每个测试函数一个场景。

### CLI 入口（参考 src/cli.py，不修改）

```python
import json
import sys
from .validator import validate_required


def main():
    data = json.load(sys.stdin)
    ...
```

特点：本地导入 `from .validator import`、`main()` 函数、标准库使用。
