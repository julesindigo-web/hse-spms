import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from './Reports';
import { clearAll, loginAs, renderWith } from '../test/render';
import { put, uid } from '../services/store';

beforeEach(async () => { await clearAll(); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Reports', () => {
  it('export CSV + cetak + audit tampil', async () => {
    await loginAs('HSE_ADMIN');
    await put('findings', { id: uid('f'), area_id: 'A', title: 'T', risk_level: 'HIGH', risk_score: 1, state: 'OPEN' });
    await put('inspections', { id: uid('i'), date: 'd', shift: 'PAGI', area_id: 'A', state: 'SUBMITTED', overall_status: 'SAFE', stop_work_triggered: false, responses: [] });
    await put('audit', { id: uid('a'), at: new Date().toISOString(), actor_uid: 'u', actor_role: 'HSE_ADMIN', event: 'EKSPOR', entity: 'reports', entity_id: 'r1', detail: 'manual' });
    await put('audit', { id: uid('a'), at: new Date().toISOString(), actor_uid: 'u', actor_role: 'PATROL', event: 'LOGIN', entity: 'users', entity_id: 'u' });
    const u = userEvent.setup();
    const r = renderWith('/reports', <Reports />);
    expect(await r.findByText(/Laporan/)).not.toBeNull();
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:x'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    vi.spyOn(document, 'createElement').mockReturnValue({ click() {}, href: '', download: '' } as unknown as HTMLAnchorElement);
    window.print = vi.fn();
    await u.click(r.getByText('Finding Register CSV'));
    await u.click(r.getByText('Inspection Summary CSV'));
    await u.click(r.getByText(/Cetak/));
    expect(window.print).toHaveBeenCalled();
    expect(screen.getByText(/Audit Trail/)).not.toBeNull();
  });
});
