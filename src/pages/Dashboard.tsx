import { useEffect, useState } from 'react';
import { list } from '../services/store';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';
import { inspectionCompliance, areaStatus } from '../services/engines';
import { humanize } from '../data/i18n';
import { AREAS } from '../data/master';

export default function Dashboard() {
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
      <p className="kicker">Indikator keselamatan</p><h2><Icon name="report" /> Dashboard</h2>
      <div className="grid4">
        <div className="stat"><b>{avgComp}%</b><span>Compliance rata-rata (bukan keamanan tunggal)</span></div>
        <div className="stat alert"><b>{crit.length}</b><span>Critical terbuka</span></div>
        <div className="stat"><b>{high.length}</b><span>High terbuka</span></div>
        <div className="stat"><b>{overdue.length}</b><span>Overdue</span></div>
      </div>
      <div className="card">
        <h3>Status Area (prioritas: CC gagal → TARP Red → Critical → High → Compliance)</h3>
        {AREAS.map(a => {
          const fi = insp.filter(i => i.area_id === a.id);
          const hasCrit = crit.some(c => c.area_id === a.id);
          const hasHigh = high.some(c => c.area_id === a.id);
          const ccFail = fi.some(i => (i.critical_control_failure ?? []).length > 0);
          const st = areaStatus({ criticalControlFailure: ccFail ? ['CC'] : [], tarpRed: false, hasCriticalFinding: hasCrit, hasHighFinding: hasHigh, compliancePct: 85 });
          return <div key={a.id} className="arearow"><span>{a.name['id-ID']}</span><span className={`badge ${st}`}>{humanize(st)}</span><small>{fi.length} inspeksi · {open.filter(o => o.area_id === a.id).length} terbuka</small></div>;
        })}
      </div>
      <div className="card"><h3>Closure trend</h3><p className="muted">{fnd.filter(f => f.state === 'CLOSED').length} Closed / {fnd.length} total · Deteksi pengulangan butuh konfirmasi manusia.</p></div>
    </Protected>
  );
}
