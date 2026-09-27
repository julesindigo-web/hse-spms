import { describe, it, expect } from 'vitest';
import { scoreFinding, areaStatus, canCloseFinding, inspectionCompliance } from './engines';
import type { Finding, Inspection } from '../types';

function finding(over: Partial<Finding> = {}): Finding {
  return {
    id: 'f1', area_id: 'HAUL_ROAD', title: 'T', description: 'D', immediate_action: 'A',
    severity: 3, likelihood: 3, risk_score: 9, risk_level: 'MEDIUM', state: 'OPEN',
    evidence_ids: [], closure_approval_level: 'STANDARD',
    created_by: 'u', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z', ...over
  } as Finding;
}

describe('scoreFinding', () => {
  it('skor = severity x likelihood + level matriks', () => {
    expect(scoreFinding(5, 5)).toEqual({ score: 25, level: 'CRITICAL' });
    expect(scoreFinding(1, 1)).toEqual({ score: 1, level: 'LOW' });
  });
});

describe('areaStatus', () => {
  const base = { criticalControlFailure: [] as string[], tarpRed: false, hasCriticalFinding: false, hasHighFinding: false, compliancePct: 100 };
  it('CRITICAL saat CC gagal (override compliance 100%)', () => {
    expect(areaStatus({ ...base, criticalControlFailure: ['CC-001'] })).toBe('CRITICAL');
  });
  it('CRITICAL saat TARP RED', () => {
    expect(areaStatus({ ...base, tarpRed: true })).toBe('CRITICAL');
  });
  it('CRITICAL saat ada temuan kritis', () => {
    expect(areaStatus({ ...base, hasCriticalFinding: true })).toBe('CRITICAL');
  });
  it('RESTRICTED saat high, WATCH saat compliance rendah, SAFE selebihnya', () => {
    expect(areaStatus({ ...base, hasHighFinding: true })).toBe('RESTRICTED');
    expect(areaStatus({ ...base, compliancePct: 69 })).toBe('WATCH');
    expect(areaStatus({ ...base, compliancePct: 70 })).toBe('SAFE');
    expect(areaStatus(base)).toBe('SAFE');
  });
});

describe('canCloseFinding', () => {
  it('CRITICAL: hanya HSE_ADMIN + DUAL_SIGN_OFF + second approver', () => {
    const f = finding({ risk_level: 'CRITICAL', closure_approval_level: 'DUAL_SIGN_OFF' });
    expect(canCloseFinding(f, 'SUPERVISOR', 'x').ok).toBe(false);
    expect(canCloseFinding(f, 'HSE_ADMIN').ok).toBe(false);
    expect(canCloseFinding(finding({ risk_level: 'CRITICAL', closure_approval_level: 'STANDARD' }), 'HSE_ADMIN', 'x').ok).toBe(false);
    expect(canCloseFinding(f, 'HSE_ADMIN', 'spv-2').ok).toBe(true);
  });
  it('non-kritis: PATROL ditolak, lainnya OK', () => {
    const f = finding();
    expect(canCloseFinding(f, 'PATROL')).toEqual({ ok: false, reason: expect.stringContaining('Patrol') });
    expect(canCloseFinding(f, 'SUPERVISOR').ok).toBe(true);
    expect(canCloseFinding(f, 'HSE_ADMIN', 'x').ok).toBe(true);
  });
});

describe('inspectionCompliance', () => {
  it('100 saat kosong/NA semua; rasio C+OBS atas valid', () => {
    expect(inspectionCompliance({} as unknown as Inspection)).toBe(100);
    expect(inspectionCompliance({ responses: [] } as unknown as Inspection)).toBe(100);
    expect(inspectionCompliance({ responses: [{ result: 'NA' }] } as unknown as Inspection)).toBe(100);
    const r = [
      { result: 'C' }, { result: 'OBS' }, { result: 'NC' }, { result: 'NA' }
    ] as unknown as Inspection['responses'];
    expect(inspectionCompliance({ responses: r } as Inspection)).toBe(67);
  });
});
