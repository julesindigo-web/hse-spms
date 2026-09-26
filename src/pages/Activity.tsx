import { useEffect, useMemo, useState } from 'react';
import { list } from '../services/store';
import { Protected } from '../components/ui';
import { inspectionCompliance } from '../services/engines';
import { findingRegister, inspectionSummary, download } from '../services/reporting';
import { can } from '../services/permissions';
import { useApp } from '../contexts/AppContext';
import { Icon } from '../components/icons';
import { AREAS } from '../data/master';

// Daily Activity Reporting — laporan aktivitas harian patrol per tanggal/shift/area (§30).
export default function Activity() {
  const { user } = useApp();
  const [ins, setIns] = useState<any[]>([]);
  const [fnd, setFnd] = useState<any[]>([]);
  const [att, setAtt] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState('SEMUA');
  const [area, setArea] = useState('SEMUA');

  useEffect(() => { (async () => { setIns(await list('inspections')); setFnd(await list('findings')); setAtt(await list('attachments')); })(); }, []);

  const rows = useMemo(() => ins.filter(i =>
    (i.date === date) && (shift === 'SEMUA' || i.shift === shift) && (area === 'SEMUA' || i.area_id === area)
  ).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), [ins, date, shift, area]);

  const fRows = useMemo(() => fnd.filter(f =>
    rows.some(r => r.id === f.inspection_id) || (f.created_at?.slice(0, 10) === date)
  ), [fnd, rows, date]);

  const avg = rows.length ? Math.round(rows.reduce((a, b) => a + inspectionCompliance(b), 0) / rows.length) : 0;
  const crit = fRows.filter(f => f.risk_level === 'CRITICAL').length;

  return (
    <Protected>
      <div className="pagehead">
        <div><h2><Icon name="calendar" /> Daily Activity Report</h2><p className="muted">Aktivitas patrol harian — ringkasan shift, compliance, temuan, critical control, evidence.</p></div>
        <div className="row">
          <button className="ghost" onClick={() => window.print()}><Icon name="printer" /> Cetak / PDF</button>
          {user && can(user.role, 'report.export') && <button onClick={() => download(`daily-${date}-${shift}.csv`, inspectionSummary(rows))}><Icon name="download" /> Inspeksi CSV</button>}
          {user && can(user.role, 'report.export') && <button onClick={() => download(`temuan-${date}.csv`, findingRegister(fRows))}><Icon name="download" /> Temuan CSV</button>}
        </div>
      </div>
      <div className="card filterbar">
        <label>Tanggal<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label>Shift<select value={shift} onChange={e => setShift(e.target.value)}><option>SEMUA</option><option>PAGI</option><option>SIANG</option><option>MALAM</option></select></label>
        <label>Area<select value={area} onChange={e => setArea(e.target.value)}><option value="SEMUA">SEMUA</option>{AREAS.map(a => <option key={a.id} value={a.id}>{a.name['id-ID']}</option>)}</select></label>
        <div className="statline"><span className="pill">{rows.length} inspeksi</span><span className="pill">Compliance {avg}%</span><span className={`pill ${crit ? 'bad' : 'ok'}`}>{crit} CRITICAL</span><span className="pill">{fRows.length} temuan</span></div>
      </div>
      {rows.length === 0 && <div className="empty"><b>Belum ada aktivitas {date}.</b><p>Mulai dari menu Inspeksi. Laporan kosong tetap valid sebagai bukti shift dilakukan.</p></div>}
      {rows.map(i => {
        const fotos = att.filter(a => a.inspection_id === i.id);
        const temuan = fnd.filter(f => f.inspection_id === i.id);
        return (
          <div key={i.id} className="card report">
            <div className="rhead">
              <div><strong>{i.area_id}</strong> · {i.shift} · {i.date}<br /><small className="muted">{i.id} · oleh {i.inspector_name} · {i.type} · compliance {inspectionCompliance(i)}%</small></div>
              <span className={`badge ${i.overall_status}`}>{i.overall_status}</span>
            </div>
            <div className="rmeta">
              <span><Icon name="pin" size={14} /> {i.gps ? `${Number(i.gps.lat).toFixed(5)}, ${Number(i.gps.lng).toFixed(5)} (±${i.gps.accuracy_m}m)` : '-'}</span>
              <span>{i.weather}</span>
              <span>{i.responses?.length ?? 0} item</span>
              <span><Icon name="camera" size={14} /> {fotos.length} foto</span>
              {i.stop_work_triggered && <span className="pill bad">STOP WORK</span>}
              {(i.critical_control_failure ?? []).length > 0 && <span className="pill bad">CC gagal: {(i.critical_control_failure ?? []).join(', ')}</span>}
            </div>
            {temuan.length > 0 && <div className="rtable"><table><thead><tr><th>Temuan</th><th>Risiko</th><th>Status</th><th>PIC</th></tr></thead><tbody>
              {temuan.map((f: any) => <tr key={f.id}><td>{f.title}</td><td><span className={`badge ${f.risk_level}`}>{f.risk_level}</span></td><td>{f.state}</td><td>{f.pic_name ?? '-'}</td></tr>)}
            </tbody></table></div>}
            {fotos.length > 0 && <div className="thumbs">{fotos.slice(0, 8).map((p: any) => <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer"><img src={p.dataUrl} alt={p.filename} loading="lazy" /></a>)}</div>}
          </div>
        );
      })}
    </Protected>
  );
}
