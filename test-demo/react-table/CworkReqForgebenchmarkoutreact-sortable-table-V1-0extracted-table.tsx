import { useState } from 'react';
import type { User } from '../data';

interface TableProps {
  users: User[];
}

type SortKey = 'name' | 'email' | 'role' | 'active' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const STRING_COLUMNS: SortKey[] = ['name', 'email', 'role', 'createdAt'];

function sortUsers(users: User[], key: SortKey | null, direction: SortDirection): User[] {
  if (!key) {
    return [...users];
  }

  return [...users].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    let comparison = 0;

    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      comparison = Number(valA) - Number(valB);
    } else {
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      comparison = strA.localeCompare(strB);
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}

export default function Table({ users }: TableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedUsers = sortUsers(users, sortKey, sortDirection);

  const getSortIndicator = (key: SortKey): string => {
    if (sortKey !== key) return '';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <table>
      <thead>
        <tr>
          <th data-testid="th-name" onClick={() => handleSort('name')}>
            Name{getSortIndicator('name')}
          </th>
          <th data-testid="th-email" onClick={() => handleSort('email')}>
            Email{getSortIndicator('email')}
          </th>
          <th data-testid="th-role" onClick={() => handleSort('role')}>
            Role{getSortIndicator('role')}
          </th>
          <th data-testid="th-active" onClick={() => handleSort('active')}>
            Active{getSortIndicator('active')}
          </th>
          <th data-testid="th-created" onClick={() => handleSort('createdAt')}>
            Created{getSortIndicator('createdAt')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedUsers.map(user => (
          <tr key={user.email}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{String(user.active)}</td>
            <td>{user.createdAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
