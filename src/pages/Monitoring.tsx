import { useEffect, useMemo, useState } from 'react';
import { list } from '../services/store';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';
import { areaStatus } from '../services/engines';
import { AREAS } from '../data/master';

// Safety Patrol Monitoring — pemantauan live: status area, tren 7 hari, produktivitas patrol, overdue/repeat.
export default function Monitoring() {
  const [ins, setIns] = useState<any[]>([]);
  const [fnd, setFnd] = useState<any[]>([]);
  useEffect(() => { (async () => { setIns(await list('inspections')); setFnd(await list('findings')); })(); }, []);

  const open = fnd.filter(f => !['CLOSED', 'VERIFIED', 'REJECTED'].includes(f.state));
  const crit = open.filter(f => f.risk_level === 'CRITICAL');
  const overdue = open.filter(f => f.due_date && f.due_date < new Date().toISOString().slice(0, 10));

  // Tren 7 hari
  const days = useMemo(() => {
    const out: Array<{ d: string; n: number; c: number }> = [];
    for (let k = 6; k >= 0; k--) {
      const dt = new Date(Date.now() - k * 864e5).toISOString().slice(0, 10);
      out.push({ d: dt.slice(5), n: ins.filter(i => i.date === dt).length, c: fnd.filter(f => (f.created_at ?? '').slice(0, 10) === dt && f.risk_level === 'CRITICAL').length });
    }
    return out;
  }, [ins, fnd]);

  // Produktivitas per patroli (kualitas, bukan sekadar jumlah §40)
  const prod = useMemo(() => {
    const m = new Map<string, { name: string; insp: number; nc: number; crit: number }>();
    for (const i of ins) {
      const e = m.get(i.inspector_uid) ?? { name: i.inspector_name, insp: 0, nc: 0, crit: 0 };
      e.insp++; e.nc += (i.responses ?? []).filter((r: any) => r.result === 'NC').length;
      e.crit += ((i.critical_control_failure ?? []) as string[]).length;
      m.set(i.inspector_uid, e);
    }
    return [...m.values()].sort((a, b) => b.insp - a.insp);
  }, [ins]);

  const maxN = Math.max(1, ...days.map(d => d.n));

  return (
    <Protected>
      <h2><Icon name="radar" /> Monitoring Safety Patrol</h2>
      <div className="kpis">
        <div className="kpi"><span>Inspeksi total</span><b>{ins.length}</b></div>
        <div className="kpi warn"><span>Temuan terbuka</span><b>{open.length}</b></div>
        <div className="kpi bad"><span>CRITICAL terbuka</span><b>{crit.length}</b></div>
        <div className="kpi"><span>Overdue</span><b>{overdue.length}</b></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>Tren 7 hari — inspeksi (bar) & CRITICAL (titik)</h3>
          <svg viewBox="0 0 340 150" className="chart" role="img" aria-label="tren 7 hari">
            {[30, 70, 110].map(y => <line key={y} x1="30" x2="330" y1={y} y2={y} stroke="#e2e8f0" />)}
            {days.map((d, i) => {
              const x = 40 + i * 42, h = Math.round((d.n / maxN) * 90);
              return (
                <g key={d.d}>
                  <rect x={x} y={120 - h} width="22" height={h} rx="4" fill={d.c > 0 ? '#f59e0b' : '#0f766e'} />
                  <text x={x + 11} y={135} fontSize="9" textAnchor="middle" fill="#64748b">{d.d}</text>
                  <text x={x + 11} y={114 - h} fontSize="10" textAnchor="middle" fill="#0f172a">{d.n}</text>
                  {d.c > 0 && <circle cx={x + 11} cy={112 - h} r="4" fill="#b91c1c" />}
                </g>
              );
            })}
          </svg>
          <p className="muted">● merah = ada CRITICAL hari itu. Compliance % tidak pernah menutupi CC gagal (§26).</p>
        </div>
        <div className="card">
          <h3>Status area live (§39)</h3>
          {AREAS.map(a => {
            const fi = ins.filter(i => i.area_id === a.id);
            const hasCrit = crit.some(c => c.area_id === a.id);
            const ccFail = fi.some(i => ((i.critical_control_failure ?? []) as string[]).length > 0);
            const st = areaStatus({ criticalControlFailure: ccFail ? ['CC'] : [], tarpRed: false, hasCriticalFinding: hasCrit, hasHighFinding: open.some(o => o.area_id === a.id && o.risk_level === 'HIGH'), compliancePct: fi.length ? 85 : 100 });
            const dot = st === 'CRITICAL' ? 'crit' : st === 'RESTRICTED' ? 'rest' : st === 'WATCH' ? 'warn' : 'ok';
            return <div key={a.id} className="arearow"><span><span className={`dot ${dot}`} />{a.name['id-ID']}</span><span className={`badge ${st}`}>{st}</span></div>;
          })}
        </div>
      </div>
      <div className="card">
        <h3>Produktivitas patrol (kualitas + kuantitas §40)</h3>
        <table><thead><tr><th>Patrol</th><th>Inspeksi</th><th>NC ditemukan</th><th>CC gagal</th><th>Rata-rata NC/inspeksi</th></tr></thead>
          <tbody>{prod.map(p => <tr key={p.name}><td>{p.name}</td><td>{p.insp}</td><td>{p.nc}</td><td>{p.crit}</td><td>{p.insp ? (p.nc / p.insp).toFixed(1) : '0'}</td></tr>)}
            {prod.length === 0 && <tr><td colSpan={5} className="muted">Belum ada data — mulai patrol hari ini.</td></tr>}</tbody></table>
        <p className="muted">Jangan reward semata dari jumlah temuan; kombinasikan dengan kualitas evidence & closure.</p>
      </div>
      <div className="card">
        <h3>Perhatian segera</h3>
        {overdue.length === 0 && crit.length === 0 && <p className="ok">Tidak ada overdue atau CRITICAL terbuka. Pertahankan.</p>}
        {[...crit, ...overdue.filter(o => o.risk_level !== 'CRITICAL')].slice(0, 10).map((f: any) => (
          <div key={f.id} className="arearow"><span><b>{f.title}</b><br /><small className="muted">{f.area_id} · due {f.due_date ?? '-'} · {f.state}</small></span><span className={`badge ${f.risk_level}`}>{f.risk_level}</span></div>
        ))}
      </div>
    </Protected>
  );
}
