### 已有 Table 组件的结构模式（参考 src/components/Table.tsx）

```tsx
import { User } from '../data';

interface TableProps {
  users: User[];
}

export default function Table({ users }: TableProps) {
  return (
    <table data-testid="users-table">
      <thead>
        <tr>
          <th data-testid="th-name">Name</th>
          <th data-testid="th-email">Email</th>
          <th data-testid="th-role">Role</th>
          <th data-testid="th-active">Active</th>
          <th data-testid="th-created">Created</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.active ? 'Yes' : 'No'}</td>
            <td>{user.createdAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

特点：函数组件 + TypeScript `interface Props`、`export default function`、`users.map` 渲染行、`data-testid` 属性。

### 已有测试的模式（参考 src/__tests__/Table.test.tsx）

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Table from '../components/Table';
import { users } from '../data';

describe('Table', () => {
  it('renders all users', () => {
    render(<Table users={users} />);
    expect(screen.getByText('Alice Wang')).toBeInTheDocument();
  });
});
```

特点：`@testing-library/react` 的 `render` + `screen.getByText`/`getByTestId`、vitest 的 `describe`/`it`/`expect`。

### 数据模型（参考 src/data.ts）

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  createdAt: string;
}
```
