import { useEffect, useMemo, useState } from 'react';
import { CHECKLIST_MASTER, MODULES, MASTER_REVISION } from '../data/checklists';
import { AREAS, CRITICAL_CONTROLS, STOP_WORK_TRIGGERS } from '../data/master';
import { useApp } from '../contexts/AppContext';
import { Protected, CriticalModal, Empty } from '../components/ui';
import { put, uid, audit, list } from '../services/store';
import { scoreFinding } from '../services/engines';
import { compressPhoto, queuePhoto } from '../services/photos';
import { captureGps, gpsBadge } from '../services/location';
import { can } from '../services/permissions';
import { Icon } from '../components/icons';
import type { InspectionResponse, InspectionType, ResultStatus } from '../types';

interface RowVal { r: ResultStatus; note: string; actual: string; unit: string; photos: string[] }

export default function InspectionPage() {
  const { user } = useApp();
  const [area, setArea] = useState('HAUL_ROAD');
  const [sub, setSub] = useState('');
  const [shift, setShift] = useState<'PAGI' | 'SIANG' | 'MALAM'>('PAGI');
  const [type, setType] = useState<InspectionType>('DAILY_PATROL');
  const [weather, setWeather] = useState('Cerah');
  const [module, setModule] = useState(MODULES[6] ?? MODULES[0]);
  const [results, setResults] = useState<Record<string, RowVal>>({});
  const [failedCC, setFailedCC] = useState<string[]>([]);
  const [stopWork, setStopWork] = useState(false);
  const [immediate, setImmediate] = useState('');
  const [gps, setGps] = useState<any>(null);
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

  async function onPhoto(id: string, file: File) {
    if (!user) return;
    try {
      const c = await compressPhoto(file);
      const attId = await queuePhoto({ uidUser: user.uid, inspection_id: 'draft', checklist_id: id, filename: `${id}_${Date.now()}.jpg`, mime: 'image/jpeg', dataUrl: c.dataUrl, lat: gps?.lat, lng: gps?.lng, acc: gps?.accuracy_m });
      const atts = await list('attachments');
      const rec = atts.find((a: any) => a.id === attId);
      set(id, { photos: [...(results[id]?.photos ?? []), rec?.dataUrl ?? c.dataUrl] });
      setMsg(`Foto ${id} tersimpan (${c.size_kb}KB, ${c.width}×${c.height}) → antrean Drive.`);
    } catch (e: any) { setMsg(`Gagal foto: ${e?.message ?? e}`); }
  }

  function validate(): string | null {
    if (!area) return 'Area wajib dipilih.';
    const ncNoNote = CHECKLIST_MASTER.filter(c => results[c.id]?.r === 'NC' && !results[c.id]?.note.trim());
    if (ncNoNote.length > 0) return `${ncNoNote.length} item NC belum ada catatan/actual value (${ncNoNote.slice(0, 3).map(c => c.id).join(', ')}…).`;
    const ncNoPhoto = CHECKLIST_MASTER.filter(c => c.is_critical_linked && results[c.id]?.r === 'NC' && (results[c.id]?.photos ?? []).length === 0);
    if (ncNoPhoto.length > 0) return `${ncNoPhoto.length} item kritis NC wajib foto (${ncNoPhoto.slice(0, 3).map(c => c.id).join(', ')}…).`;
    if ((failedCC.length > 0 || stopWork) && !immediate.trim()) return 'Critical/STOP WORK wajib isi Immediate action.';
    return null;
  }

  async function submit() {
    if (!user || !can(user.role, 'inspect.submit')) { setMsg('Role tidak boleh submit.'); return; }
    const err = validate();
    if (err && !showCrit) { setMsg(err); return; }
    const needCrit = failedCC.length > 0 || stopWork;
    if (needCrit && !showCrit) { setShowCrit(true); return; }
    setBusy(true);
    try {
      const responses: InspectionResponse[] = CHECKLIST_MASTER.filter(c => results[c.id]).map(c => {
        const v = results[c.id];
        return { checklist_id: c.id, result: v.r, actual_value: v.actual || undefined, note: v.note || undefined, equipment_unit_id: v.unit || undefined, photo_ids: [], standard_snapshot: `${c.standard_ref} (rev ${c.revision})`, revision_snapshot: MASTER_REVISION };
      });
      const g = gps ?? await captureGps();
      const insp = {
        id: uid('insp'), date: new Date().toISOString().slice(0, 10), shift,
        inspector_uid: user.uid, inspector_name: user.name, area_id: area, sub_area_id: sub || undefined, type,
        gps: { lat: g.lat, lng: g.lng, accuracy_m: g.accuracy_m, captured_at: g.captured_at },
        weather, state: 'SUBMITTED', responses,
        critical_control_failure: failedCC, stop_work_triggered: stopWork, immediate_action: immediate,
        overall_status: failedCC.length > 0 || stopWork ? 'CRITICAL' : ncCount > 0 ? 'WATCH' : 'SAFE',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      await put('inspections', insp as any);
      // Simpan foto draft → kaitkan ke inspeksi (update attachment inspection_id)
      const atts = await list('attachments');
      for (const a of atts.filter((x: any) => x.inspection_id === 'draft')) {
        await put('attachments', { ...a, inspection_id: insp.id });
      }
      for (const c of CHECKLIST_MASTER.filter(c => results[c.id]?.r === 'NC')) {
        const { score, level } = scoreFinding(failedCC.includes(c.critical_control_id ?? '') ? 5 : 3, 3);
        await put('findings', {
          id: uid('fnd'), inspection_id: insp.id, area_id: area, title: `${c.id} — ${c.label['id-ID']}`,
          description: `${results[c.id].actual ? `Aktual: ${results[c.id].actual}. ` : ''}${results[c.id].note || 'Non-conformity dari patrol'}`,
          immediate_action: immediate || (stopWork ? 'STOP WORK + radio supervisor' : 'Tindak lanjut PIC'),
          severity: failedCC.includes(c.critical_control_id ?? '') ? 5 : 3, likelihood: 3, risk_score: score, risk_level: stopWork ? 'CRITICAL' : level,
          state: stopWork || level === 'CRITICAL' ? 'IMMEDIATE_ACTION' : 'OPEN',
          evidence_ids: [], closure_approval_level: stopWork || level === 'CRITICAL' ? 'DUAL_SIGN_OFF' : 'STANDARD',
          created_by: user.uid, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        } as any);
      }
      await audit(user.uid, user.role, 'SUBMIT_INSPECTION', 'inspections', insp.id, `${responses.length} respons, stop=${stopWork}, gps±${g.accuracy_m}m`);
      setMsg(`OK|Inspeksi ${insp.id} tersimpan — ${responses.length} item, ${ncCount} NC. Lihat di Harian dan Monitoring.`);
      setResults({}); setFailedCC([]); setStopWork(false); setImmediate('');
    } finally { setBusy(false); setShowCrit(false); }
  }

  const areaSubs = AREAS.find(a => a.id === area)?.sub_areas ?? [];

  return (
    <Protected action="inspect.create">
      <div className="pagehead"><div><h2><Icon name="clipboard" /> Inspeksi Patrol Harian</h2><p className="muted">Rev {MASTER_REVISION} · {CHECKLIST_MASTER.length} item · {doneCount} diisi · {ncCount} NC · GPS: {gps ? gpsBadge(gps) : 'mengambil…'}</p></div>
        <button className="ghost" onClick={() => captureGps().then(g => { setGps(g); setMsg('GPS diperbarui: ' + gpsBadge(g)); })}><Icon name="pin" /> Refresh GPS</button></div>

      <div className="card formgrid">
        <label>Area*<select value={area} onChange={e => { setArea(e.target.value); setSub(''); }}>{AREAS.map(a => <option key={a.id} value={a.id}>{a.name['id-ID']}</option>)}</select></label>
        <label>Sub-area<select value={sub} onChange={e => setSub(e.target.value)}><option value="">—</option>{areaSubs.map(s => <option key={s.id} value={s.id}>{s.name['id-ID']}</option>)}</select></label>
        <label>Shift*<select value={shift} onChange={e => setShift(e.target.value as any)}><option>PAGI</option><option>SIANG</option><option>MALAM</option></select></label>
        <label>Tipe*<select value={type} onChange={e => setType(e.target.value as InspectionType)}><option>DAILY_PATROL</option><option>POST_RAIN</option><option>FOLLOW_UP</option><option>SPECIAL_INSPECTION</option><option>INCIDENT_RELATED</option><option>PRE_OPERATION</option></select></label>
        <label>Cuaca*<select value={weather} onChange={e => setWeather(e.target.value)}><option>Cerah</option><option>Berawan</option><option>Hujan ringan</option><option>Hujan lebat</option><option>Petir</option><option>Berkabut/debu tebal</option></select></label>
        <label>Cari item<input placeholder="mis. TM-003 / berm / rem…" value={q} onChange={e => setQ(e.target.value)} /></label>
      </div>

      <div className="card">
        <h3><Icon name="shield" /> Critical control gagal? <small className="muted">(otomatis CRITICAL, override compliance §14)</small></h3>
        <div className="chips">{CRITICAL_CONTROLS.map(c => <label key={c.id} className="chip"><input type="checkbox" checked={failedCC.includes(c.id)} onChange={e => setFailedCC(p => e.target.checked ? [...p, c.id] : p.filter(x => x !== c.id))} /> <b>{c.id}</b> {c.name['id-ID']}</label>)}</div>
        <label className="chip dangerline" style={{ marginTop: 8 }}><input type="checkbox" checked={stopWork} onChange={e => setStopWork(e.target.checked)} /> STOP WORK — {STOP_WORK_TRIGGERS.length} trigger §15 (radio terlebih dahulu)</label>
        {(failedCC.length > 0 || stopWork) && <label style={{ marginTop: 8 }}>Immediate action*<textarea value={immediate} onChange={e => setImmediate(e.target.value)} placeholder="Tindakan langsung yang sudah dilakukan di lapangan…" rows={2} /></label>}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>{module} — {items.length} item</h3>
          <select value={module} onChange={e => setModule(e.target.value)} style={{ maxWidth: 300 }}>{MODULES.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
        {items.length === 0 && <Empty title="Tidak ada item cocok" hint="Ubah kata kunci atau modul." />}
        {items.map(it => {
          const v = results[it.id] ?? { r: 'C' as ResultStatus, note: '', actual: '', unit: '', photos: [] };
          return (
            <div key={it.id} className="checkrow">
              <div><strong>{it.id}</strong> — {it.label['id-ID']}<br /><small className="muted">Standar: {it.standard_ref} · {it.param_type}{it.is_critical_linked ? ` · Terkait ${it.critical_control_id}` : ''}{it.requires_photo_on_nc ? ' · Foto wajib saat NC' : ''}</small></div>
              <div className="seg" role="radiogroup" aria-label={it.id}>
                {(['C', 'NC', 'OBS', 'NA'] as ResultStatus[]).map(r => <button key={r} data-on={v.r === r ? r : ''} className={v.r === r ? 'btnsel' : ''} onClick={() => set(it.id, { r })} title={r === 'C' ? 'Comply' : r === 'NC' ? 'Non-conformity' : r === 'OBS' ? 'Observation' : 'Not applicable'}>{r}</button>)}
              </div>
              {(it.unit_specific || v.r !== 'C') && (
                <div className="formgrid">
                  {it.unit_specific && <label>Unit alat<input placeholder="mis. HD-042 / EX-011" value={v.unit} onChange={e => set(it.id, { unit: e.target.value })} /></label>}
                  {v.r !== 'C' && <label>Nilai aktual (actual)<input placeholder="mis. lebar 8,2 m / grade 14% / foto…" value={v.actual} onChange={e => set(it.id, { actual: e.target.value })} /></label>}
                </div>
              )}
              {v.r === 'NC' && <label>Catatan NC*<textarea value={v.note} onChange={e => set(it.id, { note: e.target.value })} placeholder="Deskripsi kondisi + lokasi patok + bahaya…" rows={2} /></label>}
              <div className="photoline">
                <label className="btn ghost sm" style={{ margin: 0 }}><Icon name="camera" /> {v.photos.length ? `Tambah foto (${v.photos.length})` : 'Tambah foto'}<input type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(it.id, f); e.target.value = ''; }} /></label>
                <small className="muted">Kompresi otomatis 300–800KB (§17) · tersimpan + antre Drive</small>
                {v.photos.length > 0 && <div className="thumbs">{v.photos.map((p, i) => <a key={i} href={p} target="_blank" rel="noreferrer"><img src={p} alt={`${it.id}-${i}`} /></a>)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="row"><button className="primary" style={{ flex: 1 }} onClick={submit} disabled={busy}><Icon name="check" /> {busy ? 'Menyimpan…' : `Submit inspeksi (${doneCount} item)`}</button></div>
        {msg && <p className={msg.startsWith('OK|') ? 'ok' : 'err'}>{msg.replace(/^OK\|/, '')}</p>}
        <p className="muted">Validasi: NC wajib catatan · NC kritis wajib foto · Critical/STOP wajib immediate action. Submitted tak bisa diedit patrol (§21) — koreksi via amendment/supervisor.</p>
      </div>
      <CriticalModal open={showCrit} onConfirm={submit} onCancel={() => setShowCrit(false)} />
    </Protected>
  );
}
