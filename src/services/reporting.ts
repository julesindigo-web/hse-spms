// Reporting §30 + Daily Summary §45 (CSV/XLSX-ready via CSV; PDF via print).
import type { Finding, Inspection } from '../types';

export function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

export function download(name: string, text: string, mime = 'text/csv'): void {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function findingRegister(f: Finding[]): string {
  return toCSV(f.map(x => ({ id: x.id, area: x.area_id, title: x.title, risk: x.risk_level, score: x.risk_score, state: x.state, pic: x.pic_name ?? '', due: x.due_date ?? '', closure: x.closure_approval_level })));
}
export function inspectionSummary(i: Inspection[]): string {
  return toCSV(i.map(x => ({ id: x.id, date: x.date, shift: x.shift, area: x.area_id, state: x.state, overall: x.overall_status, stop_work: x.stop_work_triggered, responses: x.responses.length })));
}
