# 编码上下文（实验组 — 锚点范例法）

## 已有代码概览

项目：todo-cli，Node.js + TypeScript。
代码在 `test-demo/todo-cli/` 下。已有命令：add, list, complete, delete。
类型定义在 `src/types.ts`，存储逻辑在 `src/storage.ts`。
测试使用 Vitest，在 `src/__tests__/` 下。

## 项目代码风格参考

下面是本项目的代码风格范例。这些代码已经存在于项目中，不是需要新写的——读一下，让模型进入「这个项目的代码长这样」的状态。

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

## 兜底检查（交付前快速过一遍）

| 检查项 | 通过标准 |
|--------|----------|
| 幻觉 API | 使用的 API/方法在依赖中真实存在 |
| 魔法值硬编码 | 非直接写在业务逻辑中——已提取为常量 |
| 虚假测试 | 测试非 `expect(true).toBe(true)` |
| 类型逃生 | 无 `as any`、`@ts-ignore` |

## 任务

实现 todo-cli 的 search 命令。详细需求见 `benchmark/task-definition.md`。
