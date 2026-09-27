import { riskLevel, type AreaStatus, type Finding, type Inspection, type RiskLevel } from '../types';

export function scoreFinding(sev: number, lik: number): { score: number; level: RiskLevel } {
  const score = sev * lik;
  return { score, level: riskLevel(sev, lik) };
}

export function areaStatus(args: {
  criticalControlFailure: string[]; tarpRed: boolean; hasCriticalFinding: boolean;
  hasHighFinding: boolean; compliancePct: number;
}): AreaStatus {
  if (args.criticalControlFailure.length > 0) return 'CRITICAL';
  if (args.tarpRed) return 'CRITICAL';
  if (args.hasCriticalFinding) return 'CRITICAL';
  if (args.hasHighFinding) return 'RESTRICTED';
  if (args.compliancePct < 70) return 'WATCH';
  return 'SAFE';
}

export function canCloseFinding(f: Finding, role: string, secondApproverUid?: string): { ok: boolean; reason: string } {
  if (f.risk_level === 'CRITICAL') {
    if (role !== 'HSE_ADMIN') return { ok: false, reason: 'Critical hanya bisa ditutup HSE Admin (dual sign-off)' };
    if (f.closure_approval_level !== 'DUAL_SIGN_OFF') return { ok: false, reason: 'Critical wajib Dual Sign Off' };
    if (!secondApproverUid) return { ok: false, reason: 'Second approver wajib diisi dan berbeda dari penetap verifikasi' };
    return { ok: true, reason: 'OK dual sign-off' };
  }
  if (role === 'PATROL') return { ok: false, reason: 'Patrol tidak bisa close.' };
  return { ok: true, reason: 'OK' };
}

export function inspectionCompliance(insp: Inspection): number {
  const valid = (insp.responses ?? []).filter(r => r.result !== 'NA');
  if (valid.length === 0) return 100;
  const ok = valid.filter(r => r.result === 'C' || r.result === 'OBS').length;
  return Math.round((ok / valid.length) * 100);
}
