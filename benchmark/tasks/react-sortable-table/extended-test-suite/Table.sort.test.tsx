import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table from '../../src/components/Table';
import { users } from '../../src/data';

function getRows() {
  const rows = screen.getAllByRole('row').slice(1);
  return rows.map(row => within(row).getAllByRole('cell').map(c => c.textContent));
}

describe('Sort', () => {
  it('renders in original order on page 1 (no sort indicator)', () => {
    render(<Table users={users} />);
    const names = getRows().map(r => r[0]);
    expect(names).toEqual(['Alice Wang', 'Bob Li', 'Charlie Zhang']); // page 1 of 2
  });

  it('sorts Name ascending on first click', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('th-name'));
    const names = getRows().map(r => r[0]);
    expect(names).toEqual(['Alice Wang', 'Bob Li', 'Charlie Zhang']);
  });

  it('reverses Name to descending on second click', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('th-name'));
    await user.click(screen.getByTestId('th-name'));
    const names = getRows().map(r => r[0]);
    expect(names).toEqual(['Eve Liu', 'Diana Chen', 'Charlie Zhang']);
  });

  it('sorts by Email (page 1)', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('th-email'));
    const emails = getRows().map(r => r[1]);
    expect(emails).toEqual(['alice@example.com', 'bob@example.com', 'charlie@example.com']);
  });

  it('sorts by Role column (page 1)', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('th-role'));
    const roles = getRows().map(r => r[2]);
    expect(roles).toEqual(['admin', 'editor', 'editor']);
  });

  it('shows ▲/▼ sort indicator on active column', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('th-name'));
    expect(screen.getByTestId('th-name').textContent).toMatch('▲');
    await user.click(screen.getByTestId('th-name'));
    expect(screen.getByTestId('th-name').textContent).toMatch('▼');
  });

  it('switches sort column and moves indicator', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('th-name'));
    await user.click(screen.getByTestId('th-email'));
    expect(screen.getByTestId('th-name').textContent).not.toMatch(/[▲▼]/);
    expect(screen.getByTestId('th-email').textContent).toMatch('▲');
  });
});

describe('Filter', () => {
  it('shows filter input with testid', () => {
    render(<Table users={users} />);
    expect(screen.getByTestId('filter-input')).toBeInTheDocument();
  });

  it('filters by name (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.type(screen.getByTestId('filter-input'), 'alice');
    const names = getRows().map(r => r[0]);
    expect(names).toEqual(['Alice Wang']);
  });

  it('filters by email', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.type(screen.getByTestId('filter-input'), 'bob@');
    const names = getRows().map(r => r[0]);
    expect(names).toEqual(['Bob Li']);
  });

  it('shows page 1 rows when filter is empty', () => {
    render(<Table users={users} />);
    expect(getRows()).toHaveLength(3);
  });

  it('shows empty body when no match', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.type(screen.getByTestId('filter-input'), 'zzz');
    expect(getRows()).toHaveLength(0);
  });
});

describe('Pagination', () => {
  it('shows 3 rows on page 1 by default', () => {
    render(<Table users={users} />);
    expect(getRows()).toHaveLength(3);
  });

  it('navigates to page 2 showing remaining rows', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('next-page'));
    const names = getRows().map(r => r[0]);
    expect(names).toEqual(['Diana Chen', 'Eve Liu']);
  });

  it('shows page info "Page X of Y"', () => {
    render(<Table users={users} />);
    expect(screen.getByTestId('page-info').textContent).toMatch(/Page\s+1\s+of\s+2/i);
  });

  it('prev button disabled on page 1', () => {
    render(<Table users={users} />);
    expect(screen.getByTestId('prev-page')).toBeDisabled();
  });

  it('next button disabled on last page', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    await user.click(screen.getByTestId('next-page'));
    expect(screen.getByTestId('next-page')).toBeDisabled();
  });
});

describe('Feature interactions', () => {
  it('filter + sort together', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    // Filter "li" matches: Bob Li, Charlie Zhang, Eve Liu (3 results)
    await user.type(screen.getByTestId('filter-input'), 'li');
    // Sort name desc
    await user.click(screen.getByTestId('th-name'));
    await user.click(screen.getByTestId('th-name'));
    const names = getRows().map(r => r[0]);
    expect(names).toEqual(['Eve Liu', 'Charlie Zhang', 'Bob Li']);
  });

  it('filter resets pagination to page 1', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    // Go to page 2
    await user.click(screen.getByTestId('next-page'));
    expect((await screen.findByTestId('page-info')).textContent).toMatch(/Page\s+2\s+of\s+2/i);
    // Filter narrows to 1 result → should be on page 1
    await user.type(screen.getByTestId('filter-input'), 'alice');
    expect(screen.getByTestId('page-info').textContent).toMatch(/Page\s+1\s+of\s+1/i);
  });

  it('sort + filter + page all interact', async () => {
    const user = userEvent.setup();
    render(<Table users={users} />);
    // Filter "e" matches all 5 users (names/emails all contain "e")
    await user.type(screen.getByTestId('filter-input'), 'e');
    // Sort name desc → Eve, Diana, Charlie, Bob, Alice
    await user.click(screen.getByTestId('th-name'));
    await user.click(screen.getByTestId('th-name'));
    // Page 1 (3 rows): Eve, Diana, Charlie
    let names = getRows().map(r => r[0]);
    expect(names).toEqual(['Eve Liu', 'Diana Chen', 'Charlie Zhang']);
    // Page 2 (2 rows): Bob, Alice
    await user.click(screen.getByTestId('next-page'));
    names = getRows().map(r => r[0]);
    expect(names).toEqual(['Bob Li', 'Alice Wang']);
  });

  it('handles empty users array', () => {
    render(<Table users={[]} />);
    expect(getRows()).toHaveLength(0);
    expect(screen.getByTestId('prev-page')).toBeDisabled();
    expect(screen.getByTestId('next-page')).toBeDisabled();
    expect(screen.getByTestId('page-info')).toBeInTheDocument();
  });
});
