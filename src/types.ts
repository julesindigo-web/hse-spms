export type Role = 'PATROL' | 'SUPERVISOR' | 'HSE_ADMIN' | 'MANAGEMENT_VIEWER' | 'HSE_AUDITOR_OPTIONAL';
export type Lang = 'id-ID' | 'zh-CN' | 'en-US';

export type InspectionState = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'VERIFIED' | 'ARCHIVED';
export type FindingState = 'OPEN' | 'IMMEDIATE_ACTION' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CLOSED' | 'REOPENED' | 'REJECTED';
export type InspectionType = 'DAILY_PATROL' | 'POST_RAIN' | 'FOLLOW_UP' | 'SPECIAL_INSPECTION' | 'INCIDENT_RELATED' | 'PRE_OPERATION';
export type ResultStatus = 'C' | 'NC' | 'OBS' | 'NA';
export type ParamType = 'BOOLEAN' | 'MIN' | 'MAX' | 'RANGE' | 'ENUM' | 'TEXT' | 'PHOTO' | 'COUNT' | 'FORMULA' | 'REFERENCE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'OBS';
export type TarpLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type AreaStatus = 'SAFE' | 'WATCH' | 'RESTRICTED' | 'CRITICAL';
export type ClosureApproval = 'STANDARD' | 'DUAL_SIGN_OFF';

export interface I18nText { 'id-ID': string; 'zh-CN': string; 'en-US': string; }

export interface AppUser {
  uid: string; email: string; name: string; employee_id: string;
  role: Role; active: boolean; areas: string[];
}

export interface Area { id: string; name: I18nText; sub_areas: SubArea[]; }
export interface SubArea { id: string; area_id: string; name: I18nText; }

export interface ChecklistItem {
  id: string; module: string; label: I18nText;
  param_type: ParamType; standard_ref: string; revision: string;
  is_critical_linked: boolean; critical_control_id?: string;
  requires_photo_on_nc: boolean; unit_specific?: boolean;
}

export interface CriticalControl {
  id: string; name: I18nText; related_tarp_id?: string;
  automatic_stop_examples: I18nText[];
}

export interface TarpRule {
  id: string; name: I18nText; green: string; yellow: string; orange: string; red: string;
  source: string; // site-specific kajian — dilarang angka generik final (§13)
}

export interface ParameterStandard {
  id: string; name: string; baseline: string; source: string; revision: string; site_override?: string;
}

export interface InspectionResponse {
  checklist_id: string; result: ResultStatus;
  actual_value?: string; equipment_unit_id?: string; // §10 equipment linkage
  photo_ids: string[]; note?: string;
  standard_snapshot: string; revision_snapshot: string;
}

export interface Inspection {
  id: string; date: string; shift: 'PAGI' | 'SIANG' | 'MALAM';
  inspector_uid: string; inspector_name: string;
  area_id: string; sub_area_id?: string; type: InspectionType;
  gps: { lat: number; lng: number; accuracy_m: number; captured_at: string };
  weather: string; state: InspectionState;
  responses: InspectionResponse[];
  critical_control_failure: string[]; stop_work_triggered: boolean;
  overall_status: AreaStatus; created_at: string; updated_at: string;
}

export interface Finding {
  id: string; inspection_id?: string; area_id: string;
  title: string; description: string; immediate_action: string;
  severity: number; likelihood: number; risk_score: number; risk_level: RiskLevel;
  state: FindingState; pic_uid?: string; pic_name?: string; due_date?: string;
  evidence_ids: string[]; gps?: { lat: number; lng: number };
  closure_approval_level: ClosureApproval; // §20 baru
  second_approver_uid?: string; second_approver_at?: string;
  repeat_of?: string; created_by: string; created_at: string; updated_at: string;
  reject_reason?: string;
}

export interface CorrectiveAction {
  id: string; finding_id: string; action: string; owner_uid: string;
  status: 'OPEN' | 'DONE' | 'VERIFIED'; evidence?: string; updated_at: string;
}

export interface Attachment {
  id: string; inspection_id: string; checklist_id?: string;
  filename: string; mime: string; sha256: string; size_kb: number;
  drive_file_id?: string; upload_status: 'QUEUED' | 'UPLOADED' | 'FAILED';
}

export interface UploadTicket {
  ticket_id: string; uid: string; inspection_id: string;
  filename: string; mime_type: string; sha256: string;
  status: 'QUEUED' | 'UPLOADED' | 'FAILED' | 'EXPIRED'; expires_at: string;
}

export interface AuditEvent {
  id: string; at: string; actor_uid: string; actor_role: Role;
  event: string; entity: string; entity_id: string; detail?: string;
}

export const RISK_MATRIX: Record<string, RiskLevel> = {
  '1-1': 'LOW', '1-2': 'LOW', '1-3': 'LOW', '1-4': 'MEDIUM', '1-5': 'MEDIUM',
  '2-1': 'LOW', '2-2': 'LOW', '2-3': 'MEDIUM', '2-4': 'MEDIUM', '2-5': 'HIGH',
  '3-1': 'LOW', '3-2': 'MEDIUM', '3-3': 'MEDIUM', '3-4': 'HIGH', '3-5': 'HIGH',
  '4-1': 'MEDIUM', '4-2': 'MEDIUM', '4-3': 'HIGH', '4-4': 'HIGH', '4-5': 'CRITICAL',
  '5-1': 'MEDIUM', '5-2': 'HIGH', '5-3': 'HIGH', '5-4': 'CRITICAL', '5-5': 'CRITICAL'
};

export function riskLevel(sev: number, lik: number): RiskLevel {
  return RISK_MATRIX[`${sev}-${lik}`] ?? 'MEDIUM';
}
