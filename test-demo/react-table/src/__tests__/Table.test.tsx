import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Table from '../components/Table';
import { users } from '../data';

describe('Table', () => {
  it('renders first page of users (with pagination, 3 per page)', () => {
    render(<Table users={users} />);
    expect(screen.getByText('Alice Wang')).toBeInTheDocument();
    expect(screen.getByText('Bob Li')).toBeInTheDocument();
    expect(screen.getByText('Charlie Zhang')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<Table users={users} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('renders correct number of rows (header + page size)', () => {
    render(<Table users={users} />);
    const rows = screen.getAllByRole('row');
    // header row + 3 data rows (page 1 of paginated table)
    expect(rows).toHaveLength(4);
  });
});
