# 项目代码风格参考

下面是本项目的代码风格范例。这些代码已经存在于项目中，不是需要新写的——读一下，了解项目代码"长什么样"。

### 已有命令的结构模式（参考 src/commands/list.ts）

```typescript
import { getAllTodos } from '../storage';

const CATEGORY_LABELS: Record<string, string> = { /* ... */ };
const CATEGORY_ORDER = ['feature', 'bug', 'refactor', 'chore', 'docs', 'test'];

export function handleList(): void {
  const todos = getAllTodos();
  if (todos.length === 0) {
    console.log('No todos found.');
    return;
  }
  // 排序、分组、带颜色输出
}
```

特点：每个命令一个文件，无 class，纯函数导出 `handleXxx`，从 `../storage` 导入数据。

### 已有测试的模式（参考 src/__tests__/add.test.ts）

```typescript
import { describe, it, expect } from 'vitest';

describe('add', () => {
  it('adds a todo', () => {
    const todo = addTodo('test task', 'feature');
    expect(todo.description).toBe('test task');
    expect(todo.completed).toBe(false);
  });
  // 每个 it 只测一个断言
});
```

特点：describe + it、每个 it 只测一个断言、测试行为不测试实现细节。

### 已有关键类型的定义（参考 src/types.ts + src/storage.ts）

```typescript
export interface Todo {
  id: number;
  description: string;
  category: TodoCategory;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}
```
