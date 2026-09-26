import type { Role } from '../types';

export type Action =
  | 'inspect.create' | 'inspect.submit' | 'inspect.review' | 'inspect.verify'
  | 'finding.create' | 'finding.assign' | 'finding.verify' | 'finding.close' | 'finding.close_critical'
  | 'master.edit' | 'user.manage' | 'report.export' | 'report.export_full' | 'drive.config' | 'audit.read';

const MATRIX: Record<Action, Role[]> = {
  'inspect.create': ['PATROL', 'SUPERVISOR', 'HSE_ADMIN'],
  'inspect.submit': ['PATROL', 'SUPERVISOR', 'HSE_ADMIN'],
  'inspect.review': ['SUPERVISOR', 'HSE_ADMIN'],
  'inspect.verify': ['SUPERVISOR', 'HSE_ADMIN'],
  'finding.create': ['PATROL', 'SUPERVISOR', 'HSE_ADMIN'],
  'finding.assign': ['SUPERVISOR', 'HSE_ADMIN'],
  'finding.verify': ['SUPERVISOR', 'HSE_ADMIN'],
  'finding.close': ['SUPERVISOR', 'HSE_ADMIN'],
  'finding.close_critical': ['HSE_ADMIN'], // RULE-022 dual sign-off
  'master.edit': ['HSE_ADMIN'],
  'user.manage': ['HSE_ADMIN'],
  'report.export': ['PATROL', 'SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER', 'HSE_AUDITOR_OPTIONAL'],
  'report.export_full': ['HSE_ADMIN', 'SUPERVISOR', 'MANAGEMENT_VIEWER'],
  'drive.config': ['HSE_ADMIN'],
  'audit.read': ['SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER', 'HSE_AUDITOR_OPTIONAL']
};

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return MATRIX[action]?.includes(role) ?? false;
}

export const ROLE_DESC: Record<Role, string> = {
  PATROL: 'Patroli: buat & submit inspeksi/temuan. Tidak bisa edit master, close/verify, hapus, ubah role, export penuh.',
  SUPERVISOR: 'Supervisor: review, assign PIC, verify, close non-kritis. Kritis eskalasi ke HSE_ADMIN.',
  HSE_ADMIN: 'HSE Admin: kelola master, user, Drive, dual sign-off CRITICAL, export penuh, audit.',
  MANAGEMENT_VIEWER: 'Manajemen: baca dashboard, status area, tren, laporan. Tanpa mutasi.',
  HSE_AUDITOR_OPTIONAL: 'Auditor: baca + verifikasi independen. Tanpa mutasi operasional.'
};
