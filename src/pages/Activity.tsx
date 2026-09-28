import { useEffect, useMemo, useState } from 'react';
import { list } from '../services/store';
import { Protected } from '../components/ui';
import { inspectionCompliance } from '../services/engines';
import { findingRegister, inspectionSummary, download } from '../services/reporting';
import { can } from '../services/permissions';
import { humanize, t } from '../data/i18n';
import { useApp } from '../contexts/AppContext';
import { Icon } from '../components/icons';
import { AREAS } from '../data/master';

export default function Activity() {
  const { user, lang } = useApp();
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
  ).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)), [ins, date, shift, area]);

  const fRows = useMemo(() => fnd.filter(f =>
    rows.some(r => r.id === f.inspection_id) || (f.created_at?.slice(0, 10) === date)
  ), [fnd, rows, date]);

  const avg = rows.length ? Math.round(rows.reduce((a, b) => a + inspectionCompliance(b), 0) / rows.length) : 0;
  const crit = fRows.filter(f => f.risk_level === 'CRITICAL').length;

  return (
    <Protected>
      <div className="pagehead">
        <div><p className="kicker">{t('activity_kicker', lang)}</p><h2><Icon name="calendar" /> {t('activity_title', lang)}</h2><p className="muted">{t('activity_sub', lang)}</p></div>
        <div className="row">
          <button className="ghost" onClick={() => window.print()}><Icon name="printer" /> {t('activity_print', lang)}</button>
          {user && can(user.role, 'report.export') && <button onClick={() => download(`daily-${date}-${shift}.csv`, inspectionSummary(rows))}><Icon name="download" /> {t('activity_csv_insp', lang)}</button>}
          {user && can(user.role, 'report.export') && <button onClick={() => download(`temuan-${date}.csv`, findingRegister(fRows))}><Icon name="download" /> {t('activity_csv_fnd', lang)}</button>}
        </div>
      </div>
      <div className="card filterbar">
        <label>{t('activity_date', lang)}<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label>{t('activity_shift', lang)}<select value={shift} onChange={e => setShift(e.target.value)}>{['SEMUA', 'PAGI', 'SIANG', 'MALAM'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></label>
        <label>{t('activity_area', lang)}<select value={area} onChange={e => setArea(e.target.value)}><option value="SEMUA">{humanize('SEMUA')}</option>{AREAS.map(a => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}</select></label>
        <div className="statline"><span className="pill">{t('activity_inspections', lang, { n: rows.length })}</span><span className="pill">{t('activity_compliance', lang, { avg })}</span><span className={`pill ${crit ? 'bad' : 'ok'}`}>{t('activity_critical', lang, { n: crit })}</span><span className="pill">{t('activity_findings', lang, { n: fRows.length })}</span></div>
      </div>
      {rows.length === 0 && <div className="empty"><b>{t('activity_empty', lang, { date })}</b><p>{t('activity_empty_hint', lang)}</p></div>}
      {rows.map(i => {
        const fotos = att.filter(a => a.inspection_id === i.id);
        const temuan = fnd.filter(f => f.inspection_id === i.id);
        return (
          <div key={i.id} className="card report">
            <div className="rhead">
              <div><strong>{humanize(i.area_id)}</strong> · {humanize(i.shift)} · {i.date}<br /><small className="muted">{i.id} · {t('activity_by', lang, { name: i.inspector_name })} · {humanize(i.type)} · {t('activity_compact_comp', lang, { n: inspectionCompliance(i) })}</small></div>
              <span className={`badge ${i.overall_status}`}>{humanize(i.overall_status)}</span>
            </div>
            <div className="rmeta">
              <span><Icon name="pin" size={14} /> {i.gps ? `${Number(i.gps.lat).toFixed(5)}, ${Number(i.gps.lng).toFixed(5)} (±${i.gps.accuracy_m}m)` : '-'}</span>
              <span>{i.weather}</span>
              <span>{t('activity_items', lang, { n: i.responses?.length ?? 0 })}</span>
              <span><Icon name="camera" size={14} /> {t('activity_photos', lang, { n: fotos.length })}</span>
              {i.stop_work_triggered && <span className="pill bad">{t('inspect_stopwork', lang)}</span>}
              {(i.critical_control_failure ?? []).length > 0 && <span className="pill bad">{t('activity_cc_fail', lang, { ids: i.critical_control_failure.join(', ') })}</span>}
            </div>
            {temuan.length > 0 && <div className="rtable"><table><thead><tr><th>{t('activity_th_finding', lang)}</th><th>{t('activity_th_risk', lang)}</th><th>{t('activity_th_status', lang)}</th><th>{t('activity_th_pic', lang)}</th></tr></thead><tbody>
              {temuan.map((f: any) => <tr key={f.id}><td>{f.title}</td><td><span className={`badge ${f.risk_level}`}>{humanize(f.risk_level)}</span></td><td>{humanize(f.state)}</td><td>{f.pic_name ?? '-'}</td></tr>)}
            </tbody></table></div>}
            {fotos.length > 0 && <div className="thumbs">{fotos.slice(0, 8).map((p: any) => <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer"><img src={p.dataUrl} alt={p.filename} loading="lazy" /></a>)}</div>}
          </div>
        );
      })}
    </Protected>
  );
}
