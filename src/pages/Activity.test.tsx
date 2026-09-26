import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Activity from './Activity';
import { clearAll, loginAs, renderWith } from '../test/render';
import { put, uid } from '../services/store';

beforeEach(async () => { await clearAll(); });
afterEach(() => { vi.unstubAllGlobals(); });

async function seed() {
  const today = new Date().toISOString().slice(0, 10);
  const at = (sec: number) => new Date(Date.now() - sec * 1000).toISOString();
  const baseInsp = {
    shift: 'PAGI', inspector_uid: 'u', inspector_name: 'P', type: 'DAILY_PATROL',
    state: 'SUBMITTED', updated_at: new Date().toISOString()
  };
  await put('inspections', {
    ...baseInsp, id: uid('insp'), date: today, area_id: 'HAUL_ROAD', created_at: at(100),
    gps: { lat: -3.9, lng: 122.5, accuracy_m: 10, captured_at: today },
    weather: 'Cerah',
    responses: [{ checklist_id: 'TM-001', result: 'C', photo_ids: [], standard_snapshot: 's', revision_snapshot: 'r' }],
    critical_control_failure: ['CC-005'], stop_work_triggered: true, overall_status: 'CRITICAL', immediate_action: 'Radio'
  });
  await put('inspections', {
    ...baseInsp, id: uid('insp'), date: today, area_id: 'SLOPE', weather: 'Hujan',
    overall_status: 'SAFE', created_at: at(50)
  });
  const all = await (await import('../services/store')).list('inspections');
  const linked = all.find((x: { area_id: string }) => x.area_id === 'HAUL_ROAD');
  await put('findings', {
    id: uid('f'), inspection_id: linked.id, area_id: 'HAUL_ROAD', title: 'F', description: 'D',
    immediate_action: 'A', severity: 2, likelihood: 2, risk_score: 4, risk_level: 'LOW', state: 'OPEN',
    evidence_ids: [], closure_approval_level: 'STANDARD', created_by: 'u',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  });
  await put('findings', {
    id: uid('f'), inspection_id: 'lain', area_id: 'SLOPE', title: 'Yatim hari ini', description: 'D',
    immediate_action: 'A', severity: 5, likelihood: 5, risk_score: 25, risk_level: 'CRITICAL', state: 'OPEN',
    evidence_ids: [], closure_approval_level: 'DUAL_SIGN_OFF', created_by: 'u',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  });
  await put('findings', {
    id: uid('f'), inspection_id: 'lama', area_id: 'SLOPE', title: 'Tua', description: 'D',
    immediate_action: 'A', severity: 1, likelihood: 1, risk_score: 1, risk_level: 'LOW', state: 'CLOSED',
    evidence_ids: [], closure_approval_level: 'STANDARD', created_by: 'u',
    created_at: '2020-01-01T00:00:00.000Z', updated_at: '2020-01-01T00:00:00.000Z'
  });
  await put('findings', {
    id: uid('f'), inspection_id: 'gelap', area_id: 'SLOPE', title: 'Tanpa Waktu', description: 'D',
    immediate_action: 'A', severity: 1, likelihood: 1, risk_score: 1, risk_level: 'LOW', state: 'CLOSED',
    evidence_ids: [], closure_approval_level: 'STANDARD', created_by: 'u', updated_at: new Date().toISOString()
  });
  await put('attachments', { id: uid('a'), inspection_id: linked.id, filename: 'f.jpg', mime: 'image/jpeg', sha256: 's', size_kb: 1, upload_status: 'QUEUED', dataUrl: 'data:x' });
}

describe('Activity', () => {
  it('laporan harian + filter + export CSV + cetak', async () => {
    await loginAs('HSE_ADMIN');
    await seed();
    const u = userEvent.setup();
    const r = renderWith('/activity', <Activity />);
    expect(await r.findByText('Daily Activity Report')).not.toBeNull();
    expect(r.getByText('HAUL_ROAD')).not.toBeNull();
    // ubah filter: shift, tanggal, area (mencakup semua cabang filter)
    await u.selectOptions(r.getByLabelText('Shift'), 'PAGI');
    await u.selectOptions(r.getByLabelText('Area'), 'SLOPE');
    await u.selectOptions(r.getByLabelText('Area'), 'SEMUA');
    await u.clear(r.getByLabelText('Tanggal'));
    await u.type(r.getByLabelText('Tanggal'), '2020-01-01');
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:x'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    vi.spyOn(document, 'createElement').mockReturnValue({ click() {}, href: '', download: '' } as unknown as HTMLAnchorElement);
    window.print = vi.fn();
    await u.click(r.getByText('Inspeksi CSV'));
    await u.click(r.getByText('Temuan CSV'));
    await u.click(r.getByText('Cetak / PDF'));
    expect(window.print).toHaveBeenCalled();
    const labels = r.container.querySelectorAll('.filterbar label');
    expect(labels.length).toBe(3);
  });
  it('kosong → empty state; PATROL tetap bisa export dasar', async () => {
    await loginAs('PATROL');
    const r = renderWith('/activity', <Activity />);
    expect(await r.findByText(/Belum ada aktivitas/)).not.toBeNull();
    expect(screen.getByText('Inspeksi CSV')).not.toBeNull();
  });
});
