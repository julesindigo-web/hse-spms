import { describe, it, expect, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import Master from './Master';
import { clearAll, loginAs, renderWith } from '../test/render';
import { put, uid } from '../services/store';

beforeEach(async () => { await clearAll(); });

describe('Dashboard', () => {
  it('render KPI + status area + tren', async () => {
    await loginAs('MANAGEMENT_VIEWER');
    await put('inspections', { id: uid('i'), date: '2026-01-01', area_id: 'HAUL_ROAD', responses: [{ result: 'C' }], critical_control_failure: ['CC-005'] });
    await put('inspections', { id: uid('i'), date: '2026-01-01', area_id: 'SLOPE', responses: [{ result: 'NC' }] });
    await put('findings', { id: uid('f'), area_id: 'SLOPE', risk_level: 'HIGH', state: 'OPEN' });
    await put('findings', { id: uid('f'), area_id: 'HAUL_ROAD', risk_level: 'CRITICAL', state: 'CLOSED' });
    await put('findings', { id: uid('f'), area_id: 'DISPOSAL', risk_level: 'MEDIUM', state: 'OPEN', due_date: '2020-01-01' });
    await put('findings', { id: uid('f'), area_id: 'DISPOSAL', risk_level: 'MEDIUM', state: 'CLOSED', due_date: '2020-01-01' });
    await put('findings', { id: uid('f'), area_id: 'DISPOSAL', risk_level: 'MEDIUM', state: 'OPEN', due_date: '2099-01-01' });
    const r = renderWith('/dashboard', <Dashboard />);
    expect(await r.findByText('Dashboard')).not.toBeNull();
    expect(r.getByText(/Lereng Tambang/)).not.toBeNull();
  });
});

describe('Master', () => {
  it('SUPERVISOR melihat katalog + TARP + trigger', async () => {
    await loginAs('SUPERVISOR');
    const r = renderWith('/master', <Master />);
    expect(await r.findByText(/Data Master/)).not.toBeNull();
    expect(r.getByText(/316 item/)).not.toBeNull();
    expect(r.getByText(/Pemicu Stop Work/)).not.toBeNull();
  });
  it('PATROL ditolak', async () => {
    await loginAs('PATROL');
    const r = renderWith('/master', <Master />);
    expect(await r.findByText('Akses ditolak')).not.toBeNull();
  });
});
