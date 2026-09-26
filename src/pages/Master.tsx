import { CHECKLIST_MASTER } from '../data/checklists';
import { CRITICAL_CONTROLS, TARP_RULES, PARAMETER_BASELINES, STOP_WORK_TRIGGERS } from '../data/master';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';

export default function Master() {
  return (
    <Protected roles={['SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER']}>
      <p className="kicker">Data referensi yang disahkan</p><h2><Icon name="database" /> Data Master <small className="muted">rev v2.0 — hanya APPROVED yang live (§32)</small></h2>
      <div className="card"><h3>Checklist: {CHECKLIST_MASTER.length} item (284 warisan + 32 baru)</h3>
        <p className="muted">WM 10 · CS 7 · FS 10 · LT 5. Kode adalah identitas permanen; teks tersimpan sebagai map id/zh/en (§8).</p>
        <details><summary>Lihat 32 item baru</summary><ul>{CHECKLIST_MASTER.filter(c => ['WATER_MANAGEMENT', 'CONFINED_SPACE', 'BULK_FUEL_STORAGE', 'LIGHTNING_WEATHER'].includes(c.module)).map(c => <li key={c.id}><b>{c.id}</b> {c.label['id-ID']} {c.is_critical_linked ? `(terkait ${c.critical_control_id})` : ''}</li>)}</ul></details>
      </div>
      <div className="card"><h3>Critical Controls (11)</h3><ul>{CRITICAL_CONTROLS.map(c => <li key={c.id}><b>{c.id}</b> {c.name['id-ID']} {c.related_tarp_id ? `→ ${c.related_tarp_id}` : ''}</li>)}</ul></div>
      <div className="card"><h3>TARP (site-specific, bukan angka generik)</h3><ul>{TARP_RULES.map(t => <li key={t.id}><b>{t.id}</b> {t.name['id-ID']} — GREEN → YELLOW → ORANGE → RED. Sumber: {t.source}</li>)}</ul></div>
      <div className="card"><h3>Parameter baseline jalan</h3><ul>{PARAMETER_BASELINES.map(p => <li key={p.id}>{p.name}: <b>{p.baseline}</b> ({p.source})</li>)}</ul><p className="muted">Geoteknik, displacement, hujan, dan dumping wajib site-specific (§11 RULE-007/008).</p></div>
      <div className="card"><h3>STOP WORK triggers ({STOP_WORK_TRIGGERS.length})</h3><ol>{STOP_WORK_TRIGGERS.map(t => <li key={t}>{t}</li>)}</ol></div>
    </Protected>
  );
}
