export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  createdAt: string;
}

export const users: User[] = [
  { id: 1, name: 'Alice Wang', email: 'alice@example.com', role: 'admin', active: true, createdAt: '2025-01-15' },
  { id: 2, name: 'Bob Li', email: 'bob@example.com', role: 'editor', active: false, createdAt: '2025-03-20' },
  { id: 3, name: 'Charlie Zhang', email: 'charlie@example.com', role: 'viewer', active: true, createdAt: '2025-02-10' },
  { id: 4, name: 'Diana Chen', email: 'diana@example.com', role: 'editor', active: true, createdAt: '2025-01-01' },
  { id: 5, name: 'Eve Liu', email: 'eve@example.com', role: 'viewer', active: false, createdAt: '2025-04-05' },
];
