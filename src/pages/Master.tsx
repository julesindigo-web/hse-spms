import { CHECKLIST_MASTER } from '../data/checklists';
import { CRITICAL_CONTROLS, TARP_RULES, PARAMETER_BASELINES, STOP_WORK_TRIGGERS } from '../data/master';
import { humanize, t } from '../data/i18n';
import { useApp } from '../contexts/AppContext';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';

const NEW_MODULES = ['WATER_MANAGEMENT', 'CONFINED_SPACE', 'BULK_FUEL_STORAGE', 'LIGHTNING_WEATHER'];
const NEW_TOTAL = NEW_MODULES.reduce((t, m) => t + CHECKLIST_MASTER.filter(c => c.module === m).length, 0);

export default function Master() {
  const { lang } = useApp();
  return (
    <Protected roles={['SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER']}>
      <p className="kicker">{t('master_kicker', lang)}</p><h2><Icon name="database" /> {t('master_title', lang)} <small className="muted">{t('master_rev', lang)}</small></h2>
      <div className="card"><h3>{t('master_checklist', lang, { n: CHECKLIST_MASTER.length, w: CHECKLIST_MASTER.length - NEW_TOTAL, b: NEW_TOTAL })}</h3>
        <p className="muted">{t('master_code_note', lang, { mods: NEW_MODULES.map(m => `${humanize(m)} ${CHECKLIST_MASTER.filter(c => c.module === m).length}`).join(' · ') })}</p>
        <details><summary>{t('master_new', lang, { n: NEW_TOTAL })}</summary><ul>{CHECKLIST_MASTER.filter(c => NEW_MODULES.includes(c.module)).map(c => <li key={c.id}><b>{c.id}</b> {c.label[lang]} {c.is_critical_linked ? t('master_related', lang, { id: c.critical_control_id! }) : ''}</li>)}</ul></details>
      </div>
      <div className="card"><h3>{t('master_cc', lang, { n: CRITICAL_CONTROLS.length })}</h3><ul>{CRITICAL_CONTROLS.map(c => <li key={c.id}><b>{c.id}</b> {c.name[lang]} {c.related_tarp_id ? `→ ${c.related_tarp_id}` : ''}</li>)}</ul></div>
      <div className="card"><h3>{t('master_tarp_t', lang)}</h3><ul>{TARP_RULES.map(x => <li key={x.id}><b>{x.id}</b> {x.name[lang]} — {t('master_tarp_levels', lang)}. {t('master_source', lang)}{x.source}</li>)}</ul></div>
      <div className="card"><h3>{t('master_params', lang)}</h3><ul>{PARAMETER_BASELINES.map(p => <li key={p.id}>{p.name}: <b>{p.baseline}</b> ({p.source})</li>)}</ul><p className="muted">{t('master_params_note', lang)}</p></div>
      <div className="card"><h3>{t('master_sw', lang, { n: STOP_WORK_TRIGGERS.length })}</h3><ol>{STOP_WORK_TRIGGERS.map(x => <li key={x}>{x}</li>)}</ol></div>
    </Protected>
  );
}
