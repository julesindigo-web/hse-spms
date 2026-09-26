import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppProvider } from '../contexts/AppContext';
import { ensureAccounts } from '../services/auth';
import { list } from '../services/store';
import type { Role } from '../types';

export async function loginAs(role: Role): Promise<Record<string, unknown>> {
  await ensureAccounts();
  const users = await list('users');
  const u = users.find((x: { role: Role; active: boolean }) => x.role === role && x.active);
  const { pass_hash: _p, ...safe } = u as Record<string, unknown>;
  localStorage.setItem('hse-session-v2', JSON.stringify(safe));
  return safe;
}

export function renderWith(route: string, ui: ReactNode) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AppProvider>
  );
}

export async function clearAll(): Promise<void> {
  const { clearStores } = await import('./db');
  await clearStores(['inspections', 'findings', 'actions', 'attachments', 'tickets', 'audit', 'meta', 'users']);
  localStorage.clear();
}
