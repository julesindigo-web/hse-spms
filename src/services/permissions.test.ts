import { describe, it, expect } from 'vitest';
import { can, ROLE_DESC } from './permissions';
import type { Role } from '../types';

describe('can', () => {
  it('false tanpa role', () => {
    expect(can(undefined, 'inspect.create')).toBe(false);
  });
  it('PATROL: buat/submit ya; verify/close/master/user tidak', () => {
    expect(can('PATROL', 'inspect.create')).toBe(true);
    expect(can('PATROL', 'inspect.submit')).toBe(true);
    expect(can('PATROL', 'finding.verify')).toBe(false);
    expect(can('PATROL', 'finding.close')).toBe(false);
    expect(can('PATROL', 'master.edit')).toBe(false);
    expect(can('PATROL', 'user.manage')).toBe(false);
  });
  it('SUPERVISOR vs HSE_ADMIN untuk critical & master', () => {
    expect(can('SUPERVISOR', 'finding.close')).toBe(true);
    expect(can('SUPERVISOR', 'finding.close_critical')).toBe(false);
    expect(can('HSE_ADMIN', 'finding.close_critical')).toBe(true);
    expect(can('HSE_ADMIN', 'master.edit')).toBe(true);
    expect(can('HSE_ADMIN', 'drive.config')).toBe(true);
    expect(can('SUPERVISOR', 'drive.config')).toBe(false);
  });
  it('viewer/auditor baca saja', () => {
    expect(can('MANAGEMENT_VIEWER', 'report.export')).toBe(true);
    expect(can('MANAGEMENT_VIEWER', 'inspect.create')).toBe(false);
    expect(can('HSE_AUDITOR_OPTIONAL', 'audit.read')).toBe(true);
    expect(can('HSE_AUDITOR_OPTIONAL', 'finding.assign')).toBe(false);
  });
  it('mencakup inspect.review/verify, finding.create/assign/verify, export_full', () => {
    expect(can('SUPERVISOR', 'inspect.review')).toBe(true);
    expect(can('PATROL', 'inspect.review')).toBe(false);
    expect(can('SUPERVISOR', 'inspect.verify')).toBe(true);
    expect(can('PATROL', 'finding.create')).toBe(true);
    expect(can('SUPERVISOR', 'finding.assign')).toBe(true);
    expect(can('SUPERVISOR', 'finding.verify')).toBe(true);
    expect(can('HSE_ADMIN', 'report.export_full')).toBe(true);
    expect(can('PATROL', 'report.export_full')).toBe(false);
    expect(can('PATROL', 'audit.read')).toBe(false);
  });
  it('ROLE_DESC mencakup semua role + aksi tak dikenal false', () => {
    const roles: Role[] = ['PATROL', 'SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER', 'HSE_AUDITOR_OPTIONAL'];
    for (const r of roles) expect(ROLE_DESC[r].length).toBeGreaterThan(10);
    expect(can('PATROL', 'tidak-ada' as never)).toBe(false);
  });
});
