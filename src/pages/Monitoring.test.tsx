import { describe, it, expect, beforeEach } from 'vitest';
import Monitoring from './Monitoring';
import { clearAll, loginAs, renderWith } from '../test/render';
import { put, uid } from '../services/store';

beforeEach(async () => { await clearAll(); });

describe('Monitoring', () => {
  it('kosong → KPI nol + ajakan patrol', async () => {
    await loginAs('SUPERVISOR');
    const r = renderWith('/monitoring', <Monitoring />);
    expect(await r.findByText('Monitoring Safety Patrol')).not.toBeNull();
    expect(r.getByText(/Tidak ada overdue/)).not.toBeNull();
  });
  it('data → tren, status area, produktivitas, perhatian', async () => {
    await loginAs('SUPERVISOR');
    const today = new Date().toISOString().slice(0, 10);
    await put('inspections', {
      id: uid('i'), date: today, shift: 'PAGI', inspector_uid: 'u1', inspector_name: 'Pat A',
      area_id: 'HAUL_ROAD', type: 'DAILY_PATROL', weather: 'Cerah', state: 'SUBMITTED',
      responses: [{ checklist_id: 'TM-001', result: 'NC', photo_ids: [], standard_snapshot: 's', revision_snapshot: 'r' }],
      critical_control_failure: ['CC-005'], stop_work_triggered: false, overall_status: 'CRITICAL',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    await put('inspections', {
      id: uid('i'), date: today, shift: 'SIANG', inspector_uid: 'u2', inspector_name: 'Pat B',
      area_id: 'SLOPE', type: 'DAILY_PATROL', weather: 'Cerah', state: 'SUBMITTED',
      responses: [{ checklist_id: 'LS-001', result: 'NC', photo_ids: [], standard_snapshot: 's', revision_snapshot: 'r' }],
      overall_status: 'WATCH',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    await put('inspections', {
      id: uid('i'), date: today, shift: 'MALAM', inspector_uid: 'u3', inspector_name: 'Pat C',
      area_id: 'ETO', type: 'DAILY_PATROL', weather: 'Cerah', state: 'SUBMITTED',
      overall_status: 'SAFE',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    await put('findings', {
      id: uid('f'), area_id: 'HAUL_ROAD', title: 'Kritis jalan', description: 'D', immediate_action: 'A',
      severity: 5, likelihood: 5, risk_score: 25, risk_level: 'CRITICAL', state: 'OPEN',
      evidence_ids: [], closure_approval_level: 'DUAL_SIGN_OFF', created_by: 'u',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    await put('findings', {
      id: uid('f'), area_id: 'ETO', title: 'Tinggi ETO', description: 'D', immediate_action: 'A',
      severity: 4, likelihood: 3, risk_score: 12, risk_level: 'HIGH', state: 'OPEN',
      evidence_ids: [], closure_approval_level: 'STANDARD', created_by: 'u',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    await put('findings', {
      id: uid('f'), area_id: 'DISPOSAL', title: 'Lewat disposal', description: 'D', immediate_action: 'A',
      severity: 2, likelihood: 2, risk_score: 4, risk_level: 'MEDIUM', state: 'OPEN',
      evidence_ids: [], closure_approval_level: 'STANDARD', created_by: 'u', due_date: '2020-01-01',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    });
    await put('findings', {
      id: uid('f'), area_id: 'WATER', title: 'Tanpa waktu', description: 'D', immediate_action: 'A',
      severity: 5, likelihood: 4, risk_score: 20, risk_level: 'CRITICAL', state: 'OPEN',
      evidence_ids: [], closure_approval_level: 'DUAL_SIGN_OFF', created_by: 'u', updated_at: new Date().toISOString()
    });
    const r = renderWith('/monitoring', <Monitoring />);
    expect(await r.findByText('Pat A')).not.toBeNull();
    expect(r.getByText('Pat B')).not.toBeNull();
    expect(r.getByText('Kritis jalan')).not.toBeNull();
    expect(r.container.querySelector('svg.chart')).not.toBeNull();
  });
});
