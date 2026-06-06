# Benchmark Task: todo-cli search 命令

## 背景

todo-cli 是一个 CLI 任务管理工具。当前命令：add, list, complete, delete。
数据存储在 `todo.json`，每项任务有 id, description, category, completed, createdAt, completedAt。

已有代码结构：
```
src/index.ts           # CLI 入口，注册命令
src/types.ts           # Todo/TodoStore 类型定义
src/storage.ts         # JSON 文件读写（getAllTodos/addTodo/completeTodo/deleteTodo）
src/commands/          # 每个命令独立文件
src/__tests__/         # Vitest 测试
```

## 需求

### 命令签名

```
todo search <keyword>           # 搜索全部（不区分大小写）
todo search <keyword> --category bug  # 在指定分类中搜索
```

### 行为

1. 从 `getAllTodos()` 获取全部任务
2. 如果 keyword 为空或只有空格 → 输出 "Please provide a search keyword."
3. 按 keyword 在 `description` 中做大小写不敏感的匹配
4. 如果指定了 `--category`，只在匹配该分类的任务中搜索
5. 匹配结果按分类分组显示，格式与 `list` 命令一致（CATEGORY_LABELS + 颜色输出）
6. 无匹配 → 输出 "No matching todos found."

### 文件

- `src/commands/search.ts` — 搜索逻辑
- `src/__tests__/search.test.ts` — 测试

### 测试用例

1. `search by keyword` — 添加任务后搜索关键词，返回匹配结果
2. `search no match` — 搜索不存在的关键词，输出 "No matching todos found."
3. `search with category filter` — 搜索含 --category 参数
4. `search case insensitive` — 关键词大小写不敏感
5. `search empty keyword` — 空关键词提示错误

### 红线

- 不要修改已有命令文件（add/list/complete/delete）
- 不要修改 storage.ts 或 types.ts
- 格式风格必须与已有命令一致（参考 list.ts 的输出格式）
