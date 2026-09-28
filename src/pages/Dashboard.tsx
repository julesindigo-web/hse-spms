import { useEffect, useState } from 'react';
import { list } from '../services/store';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';
import { inspectionCompliance, areaStatus } from '../services/engines';
import { humanize, t } from '../data/i18n';
import { useApp } from '../contexts/AppContext';
import { AREAS } from '../data/master';

export default function Dashboard() {
  const { lang } = useApp();
  const [insp, setInsp] = useState<any[]>([]);
  const [fnd, setFnd] = useState<any[]>([]);
  useEffect(() => { (async () => { setInsp(await list('inspections')); setFnd(await list('findings')); })(); }, []);

  const open = fnd.filter(f => !['CLOSED', 'VERIFIED', 'REJECTED'].includes(f.state));
  const crit = fnd.filter(f => f.risk_level === 'CRITICAL' && f.state !== 'CLOSED');
  const high = fnd.filter(f => f.risk_level === 'HIGH' && !['CLOSED', 'VERIFIED'].includes(f.state));
  const overdue = fnd.filter(f => f.due_date && f.due_date < new Date().toISOString().slice(0, 10) && !['CLOSED', 'VERIFIED'].includes(f.state));
  const avgComp = insp.length ? Math.round(insp.reduce((a, b) => a + inspectionCompliance(b), 0) / insp.length) : 0;

  return (
    <Protected>
      <p className="kicker">{t('dash_kicker', lang)}</p><h2><Icon name="report" /> {t('dash_title', lang)}</h2>
      <div className="grid4">
        <div className="stat"><b>{avgComp}%</b><span>{t('dash_avg', lang)}</span></div>
        <div className="stat alert"><b>{crit.length}</b><span>{t('monitor_critical', lang)}</span></div>
        <div className="stat"><b>{high.length}</b><span>{t('dash_high', lang)}</span></div>
        <div className="stat"><b>{overdue.length}</b><span>{t('monitor_overdue', lang)}</span></div>
      </div>
      <div className="card">
        <h3>{t('dash_area_h', lang)}</h3>
        {AREAS.map(a => {
          const fi = insp.filter(i => i.area_id === a.id);
          const hasCrit = crit.some(c => c.area_id === a.id);
          const hasHigh = high.some(c => c.area_id === a.id);
          const ccFail = fi.some(i => (i.critical_control_failure ?? []).length > 0);
          const st = areaStatus({ criticalControlFailure: ccFail ? ['CC'] : [], tarpRed: false, hasCriticalFinding: hasCrit, hasHighFinding: hasHigh, compliancePct: 85 });
          return <div key={a.id} className="arearow"><span>{a.name[lang]}</span><span className={`badge ${st}`}>{humanize(st)}</span><small>{t('dash_row', lang, { n: fi.length, m: open.filter(o => o.area_id === a.id).length })}</small></div>;
        })}
      </div>
      <div className="card"><h3>{t('dash_trend', lang)}</h3><p className="muted">{t('dash_trend_p', lang, { c: fnd.filter(f => f.state === 'CLOSED').length, t: fnd.length })}</p></div>
    </Protected>
  );
}
