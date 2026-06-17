### 已有 Validator 类的结构模式（参考 Validator.java）

```java
package com.example;

public class Validator {

    public static boolean validateRequired(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
```

特点：`public class`、`public static boolean method`、包声明 `package com.example`。

### 已有测试的模式（参考 ValidatorTest.java）

```java
package com.example;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class ValidatorTest {

    @Test
    void validateRequired_withValue() {
        assertTrue(Validator.validateRequired("hello"));
    }
}
```

特点：JUnit 5、`@Test` 注解、`assertTrue`/`assertFalse`、类名 `Test` 后缀、`package com.example`。

### 项目构建

Maven 项目，`pom.xml` 已配置 JUnit 5 和 Java 21。
测试命令：`mvn test`
compile 命令：`mvn compile`
