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
