import { CHECKLIST_MASTER } from '../data/checklists';
import { CRITICAL_CONTROLS, TARP_RULES, PARAMETER_BASELINES, STOP_WORK_TRIGGERS } from '../data/master';
import { humanize } from '../data/i18n';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';

const NEW_MODULES = ['WATER_MANAGEMENT', 'CONFINED_SPACE', 'BULK_FUEL_STORAGE', 'LIGHTNING_WEATHER'];
const NEW_TOTAL = NEW_MODULES.reduce((t, m) => t + CHECKLIST_MASTER.filter(c => c.module === m).length, 0);

export default function Master() {
  return (
    <Protected roles={['SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER']}>
      <p className="kicker">Data referensi yang disahkan</p><h2><Icon name="database" /> Data Master <small className="muted">rev v2.0 — hanya Approved yang live</small></h2>
      <div className="card"><h3>Checklist: {CHECKLIST_MASTER.length} item ({CHECKLIST_MASTER.length - NEW_TOTAL} warisan + {NEW_TOTAL} baru)</h3>
        <p className="muted">{NEW_MODULES.map(m => `${humanize(m)} ${CHECKLIST_MASTER.filter(c => c.module === m).length}`).join(' · ')}. Kode adalah identitas permanen; teks tersimpan sebagai map id/zh/en.</p>
        <details><summary>Lihat 32 item baru</summary><ul>{CHECKLIST_MASTER.filter(c => ['WATER_MANAGEMENT', 'CONFINED_SPACE', 'BULK_FUEL_STORAGE', 'LIGHTNING_WEATHER'].includes(c.module)).map(c => <li key={c.id}><b>{c.id}</b> {c.label['id-ID']} {c.is_critical_linked ? `(terkait ${c.critical_control_id})` : ''}</li>)}</ul></details>
      </div>
      <div className="card"><h3>Critical Controls ({CRITICAL_CONTROLS.length})</h3><ul>{CRITICAL_CONTROLS.map(c => <li key={c.id}><b>{c.id}</b> {c.name['id-ID']} {c.related_tarp_id ? `→ ${c.related_tarp_id}` : ''}</li>)}</ul></div>
      <div className="card"><h3>TARP (site-specific, bukan angka generik)</h3><ul>{TARP_RULES.map(t => <li key={t.id}><b>{t.id}</b> {t.name['id-ID']} — Green → Yellow → Orange → Red. Sumber: {t.source}</li>)}</ul></div>
      <div className="card"><h3>Parameter baseline jalan</h3><ul>{PARAMETER_BASELINES.map(p => <li key={p.id}>{p.name}: <b>{p.baseline}</b> ({p.source})</li>)}</ul><p className="muted">Geoteknik, displacement, hujan, dan dumping wajib site-specific.</p></div>
      <div className="card"><h3>Pemicu Stop Work ({STOP_WORK_TRIGGERS.length})</h3><ol>{STOP_WORK_TRIGGERS.map(t => <li key={t}>{t}</li>)}</ol></div>
    </Protected>
  );
}
