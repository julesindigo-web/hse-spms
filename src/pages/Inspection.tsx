import { useEffect, useMemo, useState } from 'react';
import { CHECKLIST_MASTER, MODULES, MASTER_REVISION } from '../data/checklists';
import { AREAS, CRITICAL_CONTROLS, STOP_WORK_TRIGGERS } from '../data/master';
import { humanize, t } from '../data/i18n';
import { useApp } from '../contexts/AppContext';
import { Protected, CriticalModal, Empty } from '../components/ui';
import { put, uid, audit, list } from '../services/store';
import { scoreFinding } from '../services/engines';
import { compressPhoto, queuePhoto } from '../services/photos';
import { captureGps, gpsBadge, type GpsFix } from '../services/location';
import { Icon } from '../components/icons';
import type { InspectionResponse, InspectionType, ResultStatus } from '../types';

interface RowVal { r: ResultStatus; note: string; actual: string; unit: string; photos: string[] }

export default function InspectionPage() {
  const { user, lang } = useApp();
  const [area, setArea] = useState('HAUL_ROAD');
  const [sub, setSub] = useState('');
  const [shift, setShift] = useState<'PAGI' | 'SIANG' | 'MALAM'>('PAGI');
  const [type, setType] = useState<InspectionType>('DAILY_PATROL');
  const [weather, setWeather] = useState('Cerah');
  const [module, setModule] = useState(MODULES[6]);
  const [results, setResults] = useState<Record<string, RowVal>>({});
  const [failedCC, setFailedCC] = useState<string[]>([]);
  const [stopWork, setStopWork] = useState(false);
  const [immediate, setImmediate] = useState('');
  const [gps, setGps] = useState<GpsFix>({ lat: 0, lng: 0, accuracy_m: 9999, captured_at: '', mocked: true });
  const [showCrit, setShowCrit] = useState(false);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { captureGps().then(setGps); }, []);
  const items = useMemo(() => {
    const base = CHECKLIST_MASTER.filter(c => c.module === module);
    if (!q.trim()) return base;
    return base.filter(c => (c.id + c.label['id-ID'] + c.label['en-US']).toLowerCase().includes(q.toLowerCase()));
  }, [module, q]);

  const doneCount = Object.keys(results).length;
  const ncCount = Object.values(results).filter(v => v.r === 'NC').length;

  function set(id: string, patch: Partial<RowVal>) {
    setResults(prev => {
      const cur: RowVal = prev[id] ?? { r: 'C', note: '', actual: '', unit: '', photos: [] };
      return { ...prev, [id]: { ...cur, ...patch } };
    });
  }

  function photosOf(id: string): string[] {
    const v = results[id];
    return v ? v.photos : [];
  }

  async function onPhoto(id: string, file: File) {
    try {
      const c = await compressPhoto(file);
      const attId = await queuePhoto({ uidUser: user!.uid, inspection_id: 'draft', checklist_id: id, filename: `${id}_${Date.now()}.jpg`, mime: 'image/jpeg', dataUrl: c.dataUrl, lat: gps.lat, lng: gps.lng, acc: gps.accuracy_m });
      const atts = await list('attachments');
      const rec = atts.find((a: any) => a.id === attId);
      const url = rec ? rec.dataUrl : c.dataUrl;
      set(id, { photos: [...photosOf(id), url] });
      setMsg(t('inspect_photo_saved', lang, { id, size: c.size_kb, w: c.width, h: c.height }));
    } catch (e: any) { setMsg(t('inspect_photo_fail', lang, { e: e?.message ?? e })); }
  }

  function validate(): string | null {
    const ncNoNote = CHECKLIST_MASTER.filter(c => results[c.id]?.r === 'NC' && !results[c.id]?.note.trim());
    if (ncNoNote.length > 0) return t('inspect_val_note', lang, { n: ncNoNote.length, ids: ncNoNote.slice(0, 3).map(c => c.id).join(', ') });
    const ncNoPhoto = CHECKLIST_MASTER.filter(c => c.is_critical_linked && results[c.id]?.r === 'NC' && photosOf(c.id).length === 0);
    if (ncNoPhoto.length > 0) return t('inspect_val_photo', lang, { n: ncNoPhoto.length, ids: ncNoPhoto.slice(0, 3).map(c => c.id).join(', ') });
    if ((failedCC.length > 0 || stopWork) && !immediate.trim()) return t('inspect_val_immediate', lang);
    return null;
  }

  async function submit() {
    const err = validate();
    if (err) { setMsg(err); return; }
    const needCrit = failedCC.length > 0 || stopWork;
    if (needCrit && !showCrit) { setShowCrit(true); return; }
    setBusy(true);
    try {
      const responses: InspectionResponse[] = CHECKLIST_MASTER.filter(c => results[c.id]).map(c => {
        const v = results[c.id];
        return { checklist_id: c.id, result: v.r, actual_value: v.actual || undefined, note: v.note || undefined, equipment_unit_id: v.unit || undefined, photo_ids: [], standard_snapshot: `${c.standard_ref} (rev ${c.revision})`, revision_snapshot: MASTER_REVISION };
      });
      const g = gps;
      const insp = {
        id: uid('insp'), date: new Date().toISOString().slice(0, 10), shift,
        inspector_uid: user!.uid, inspector_name: user!.name, area_id: area, sub_area_id: sub || undefined, type,
        gps: { lat: g.lat, lng: g.lng, accuracy_m: g.accuracy_m, captured_at: g.captured_at },
        weather, state: 'SUBMITTED', responses,
        critical_control_failure: failedCC, stop_work_triggered: stopWork, immediate_action: immediate,
        overall_status: failedCC.length > 0 || stopWork ? 'CRITICAL' : ncCount > 0 ? 'WATCH' : 'SAFE',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      await put('inspections', insp as any);
      const atts = await list('attachments');
      for (const a of atts.filter((x: any) => x.inspection_id === 'draft')) {
        await put('attachments', { ...a, inspection_id: insp.id });
      }
      for (const c of CHECKLIST_MASTER.filter(c => results[c.id]?.r === 'NC')) {
        const { score, level } = scoreFinding(failedCC.includes(c.critical_control_id ?? '') ? 5 : 3, 3);
        await put('findings', {
          id: uid('fnd'), inspection_id: insp.id, area_id: area, title: `${c.id} — ${c.label['id-ID']}`,
          description: `${results[c.id].actual ? `Aktual: ${results[c.id].actual}. ` : ''}${results[c.id].note}`,
          immediate_action: immediate || 'Tindak lanjut PIC',
          severity: failedCC.includes(c.critical_control_id ?? '') ? 5 : 3, likelihood: 3, risk_score: score, risk_level: stopWork ? 'CRITICAL' : level,
          state: stopWork || level === 'CRITICAL' ? 'IMMEDIATE_ACTION' : 'OPEN',
          evidence_ids: [], closure_approval_level: stopWork || level === 'CRITICAL' ? 'DUAL_SIGN_OFF' : 'STANDARD',
          created_by: user!.uid, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        } as any);
      }
      await audit(user!.uid, user!.role, 'SUBMIT_INSPECTION', 'inspections', insp.id, `${responses.length} respons, stop=${stopWork}, gps±${g.accuracy_m}m`);
      setMsg(`OK|${t('inspect_saved', lang, { id: insp.id, n: responses.length, nc: ncCount })}`);
      setResults({}); setFailedCC([]); setStopWork(false); setImmediate('');
    } finally { setBusy(false); setShowCrit(false); }
  }

  const areaSubs = AREAS.find(a => a.id === area)!.sub_areas;

  return (
    <Protected action="inspect.create">
      <div className="pagehead"><div><p className="kicker">{t('inspect_kicker', lang)}</p><h2><Icon name="clipboard" /> {t('inspect_title', lang)}</h2><p className="muted">{t('inspect_sub', lang, { rev: MASTER_REVISION, total: CHECKLIST_MASTER.length, done: doneCount, nc: ncCount, gps: gpsBadge(gps) })}</p></div>
        <button className="ghost" onClick={() => captureGps().then(g => { setGps(g); setMsg(t('inspect_gps_updated', lang, { g: gpsBadge(g) })); })}><Icon name="pin" /> {t('inspect_refresh_gps', lang)}</button></div>

      <div className="card formgrid">
        <label>{t('inspect_area', lang)}<select value={area} onChange={e => { setArea(e.target.value); setSub(''); }}>{AREAS.map(a => <option key={a.id} value={a.id}>{a.name[lang]}</option>)}</select></label>
        <label>{t('inspect_subarea', lang)}<select value={sub} onChange={e => setSub(e.target.value)}><option value="">—</option>{areaSubs.map(s => <option key={s.id} value={s.id}>{s.name[lang]}</option>)}</select></label>
        <label>{t('inspect_shift', lang)}<select value={shift} onChange={e => setShift(e.target.value as any)}>{['PAGI', 'SIANG', 'MALAM'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select></label>
        <label>{t('inspect_type', lang)}<select value={type} onChange={e => setType(e.target.value as InspectionType)}>{(['DAILY_PATROL', 'POST_RAIN', 'FOLLOW_UP', 'SPECIAL_INSPECTION', 'INCIDENT_RELATED', 'PRE_OPERATION'] as InspectionType[]).map(x => <option key={x} value={x}>{humanize(x)}</option>)}</select></label>
        <label>{t('inspect_weather', lang)}<select value={weather} onChange={e => setWeather(e.target.value)}><option>Cerah</option><option>Berawan</option><option>Hujan ringan</option><option>Hujan lebat</option><option>Petir</option><option>Berkabut/debu tebal</option></select></label>
        <label>{t('inspect_search', lang)}<input placeholder={t('inspect_search_ph', lang)} value={q} onChange={e => setQ(e.target.value)} /></label>
      </div>

      <div className="card">
        <h3><Icon name="shield" /> {t('inspect_cc_title', lang)} <small className="muted">{t('inspect_cc_auto', lang)}</small></h3>
        <div className="chips">{CRITICAL_CONTROLS.map(c => <label key={c.id} className="chip"><input type="checkbox" checked={failedCC.includes(c.id)} onChange={e => setFailedCC(p => e.target.checked ? [...p, c.id] : p.filter(x => x !== c.id))} /> <b>{c.id}</b> {c.name['id-ID']}</label>)}</div>
        <label className="chip dangerline" style={{ marginTop: 8 }}><input type="checkbox" checked={stopWork} onChange={e => setStopWork(e.target.checked)} /> {t('inspect_stopwork', lang)} — {STOP_WORK_TRIGGERS.length} {t('inspect_triggers', lang)} ({t('inspect_radio_first', lang)})</label>
        {(failedCC.length > 0 || stopWork) && <label style={{ marginTop: 8 }}>{t('inspect_immediate', lang)}<textarea value={immediate} onChange={e => setImmediate(e.target.value)} placeholder={t('inspect_immediate_ph', lang)} rows={2} /></label>}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>{humanize(module)} — {items.length} item</h3>
          <select aria-label={t('inspect_module_label', lang)} value={module} onChange={e => setModule(e.target.value)} style={{ maxWidth: 300 }}>{MODULES.map(m => <option key={m} value={m}>{humanize(m)}</option>)}</select>
        </div>
        {items.length === 0 && <Empty title={t('inspect_empty', lang)} hint={t('inspect_empty_hint', lang)} />}
        {items.map(it => {
          const v = results[it.id] ?? { r: 'C' as ResultStatus, note: '', actual: '', unit: '', photos: [] };
          return (
            <div key={it.id} className="checkrow">
              <div><strong>{it.id}</strong> — {it.label['id-ID']}<br /><small className="muted">Standar: {it.standard_ref} · {humanize(it.param_type)}{it.is_critical_linked ? ` · Terkait ${it.critical_control_id}` : ''}{it.requires_photo_on_nc ? ' · Foto wajib saat NC' : ''}</small></div>
              <div className="seg" role="radiogroup" aria-label={it.id}>
                {(['C', 'NC', 'OBS', 'NA'] as ResultStatus[]).map(r => <button key={r} data-on={v.r === r ? r : ''} className={v.r === r ? 'btnsel' : ''} onClick={() => set(it.id, { r })} title={r === 'C' ? 'Comply' : r === 'NC' ? 'Non-conformity' : r === 'OBS' ? 'Observation' : 'Not applicable'}>{r}</button>)}
              </div>
              {(it.unit_specific || v.r !== 'C') && (
                <div className="formgrid">
                  {it.unit_specific && <label>{t('inspect_unit', lang)}<input placeholder={t('inspect_unit_ph', lang)} value={v.unit} onChange={e => set(it.id, { unit: e.target.value })} /></label>}
                  {v.r !== 'C' && <label>{t('inspect_actual', lang)}<input placeholder={t('inspect_actual_ph', lang)} value={v.actual} onChange={e => set(it.id, { actual: e.target.value })} /></label>}
                </div>
              )}
              {v.r === 'NC' && <label>{t('inspect_nc_note', lang)}<textarea value={v.note} onChange={e => set(it.id, { note: e.target.value })} placeholder={t('inspect_nc_note_ph', lang)} rows={2} /></label>}
              <div className="photoline">
                <label className="btn ghost sm" style={{ margin: 0 }}><Icon name="camera" /> {v.photos.length ? `${t('inspect_add_photo', lang)} (${v.photos.length})` : t('inspect_add_photo', lang)}<input type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(it.id, f); e.target.value = ''; }} /></label>
                <small className="muted">{t('inspect_compress', lang)}</small>
                {v.photos.length > 0 && <div className="thumbs">{v.photos.map((p, i) => <a key={i} href={p} target="_blank" rel="noreferrer"><img src={p} alt={`${it.id}-${i}`} /></a>)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="row"><button className="primary" style={{ flex: 1 }} onClick={submit} disabled={busy}><Icon name="check" /> {busy ? t('inspect_saving', lang) : `${t('inspect_submit', lang)} (${doneCount} item)`}</button></div>
        {msg && <p role="status" className={msg.startsWith('OK|') ? 'ok' : 'err'}>{msg.replace(/^OK\|/, '')}</p>}
        <p className="muted">{t('inspect_validation', lang)}</p>
      </div>
      <CriticalModal open={showCrit} onConfirm={submit} onCancel={() => setShowCrit(false)} />
    </Protected>
  );
}
