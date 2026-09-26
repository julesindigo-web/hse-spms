import { useEffect, useState } from 'react';
import { list, put, audit } from '../services/store';
import { useApp } from '../contexts/AppContext';
import { Protected, Empty } from '../components/ui';
import { canCloseFinding } from '../services/engines';
import { can } from '../services/permissions';
import { Icon } from '../components/icons';
import type { Finding } from '../types';

export default function Findings() {
  const { user } = useApp();
  const [items, setItems] = useState<Finding[]>([]);
  const [att, setAtt] = useState<any[]>([]);
  const [filter, setFilter] = useState('OPEN_ALL');
  const [second, setSecond] = useState<Record<string, string>>({});
  async function load() {
    setItems(((await list('findings')) as Finding[]).sort((a: any, b: any) => ((b.created_at ?? '') > (a.created_at ?? '') ? 1 : -1)));
    setAtt(await list('attachments'));
  }
  useEffect(() => { load(); }, []);

  async function act(f: Finding, next: Finding['state'], extra: Partial<Finding> = {}) {
    if (!user) return;
    if (next === 'ASSIGNED' && !can(user.role, 'finding.assign')) return alert('Hanya SUPERVISOR/HSE_ADMIN yang bisa assign PIC.');
    if (next === 'VERIFIED' && !can(user.role, 'finding.verify')) return alert('Hanya SUPERVISOR/HSE_ADMIN yang bisa verify.');
    if ((next === 'VERIFIED' || next === 'CLOSED') && user.role === 'PATROL') return alert('PATROL tidak bisa verify/close (§6 RULE-003).');
    if (next === 'CLOSED') {
      const c = canCloseFinding({ ...f, ...extra }, user.role, second[f.id] || (extra as any).second_approver_uid);
      if (!c.ok) return alert('Ditolak: ' + c.reason);
    }
    const upd = { ...f, ...extra, state: next, updated_at: new Date().toISOString() } as any;
    if (next === 'CLOSED' && (f as any).risk_level === 'CRITICAL') {
      upd.second_approver_uid = second[f.id] || (extra as any).second_approver_uid;
      upd.second_approver_at = new Date().toISOString();
      await audit(user.uid, user.role, 'SECOND_APPROVAL_CRITICAL_CLOSURE', 'findings', f.id, `dual sign-off oleh ${upd.second_approver_uid}`);
    }
    await put('findings', upd);
    await audit(user.uid, user.role, `FINDING_${next}`, 'findings', f.id);
    load();
  }

  const shown = items.filter(f => filter === 'ALL' ? true : filter === 'OPEN_ALL' ? !['CLOSED', 'VERIFIED', 'REJECTED'].includes(f.state) : filter === 'CRITICAL' ? (f as any).risk_level === 'CRITICAL' : filter === 'OVERDUE' ? ((f as any).due_date && (f as any).due_date < new Date().toISOString().slice(0, 10) && !['CLOSED', 'VERIFIED'].includes(f.state)) : true);

  return (
    <Protected>
      <div className="pagehead"><div><p className="kicker">Tindak lanjut korektif</p><h2><Icon name="alert" /> Manajemen Temuan</h2><p className="muted">{shown.length}/{items.length} temuan · alur OPEN→…→CLOSED + REOPENED/REJECTED (§6) · CRITICAL dual sign-off (§2)</p></div>
        <div className="row">{['OPEN_ALL', 'CRITICAL', 'OVERDUE', 'ALL'].map(x => <button key={x} className={filter === x ? 'btnsel' : 'ghost'} onClick={() => setFilter(x)}>{x === 'OPEN_ALL' ? 'Terbuka' : x}</button>)}</div></div>
      {shown.length === 0 && <Empty title="Tidak ada temuan pada filter ini" hint="Temuan NC otomatis terbentuk dari Inspeksi. Critical tampil di sini + Monitoring." />}
      {shown.map(f => {
        const fa = att.filter(a => a.inspection_id === (f as any).inspection_id).slice(0, 6);
        const isCrit = (f as any).risk_level === 'CRITICAL';
        return (
          <div key={f.id} className={`card ${isCrit ? 'crit' : ''}`}>
            <div className="rhead"><div><strong>{(f as any).title}</strong><br /><small className="muted">{(f as any).area_id} · {(f as any).id} · {(f as any).created_at?.slice(0, 16).replace('T', ' ')}</small></div>
              <span><span className={`badge ${(f as any).risk_level}`}>{(f as any).risk_level} {(f as any).risk_score}</span> <span className="badge">{f.state}</span></span></div>
            <p>{(f as any).description}</p>
            <p className="muted">Immediate: {(f as any).immediate_action} · PIC: {(f as any).pic_name ?? '-'} (due {(f as any).due_date ?? '-'}) · {(f as any).closure_approval_level}</p>
            {fa.length > 0 && <div className="thumbs">{fa.map((p: any) => <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer"><img src={p.dataUrl} alt={p.filename} /></a>)}</div>}
            <div className="row">
              <button className="ghost sm" onClick={() => { const pic = prompt('Nama PIC?', (f as any).pic_name ?? ''); if (pic === null) return; const due = prompt('Due date YYYY-MM-DD?', (f as any).due_date ?? new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)); act(f, 'ASSIGNED', { pic_name: pic, due_date: due || undefined } as any); }}><Icon name="user" /> Assign PIC</button>
              <button className="ghost sm" onClick={() => act(f, 'IN_PROGRESS')}><Icon name="wrench" /> Progress</button>
              <button className="ghost sm" onClick={() => act(f, 'PENDING_VERIFICATION')}><Icon name="search" /> Minta verifikasi</button>
              <button className="ghost sm" onClick={() => act(f, 'VERIFIED')}><Icon name="check" /> Verify</button>
              <button className="ghost sm" onClick={() => act(f, 'REOPENED')}><Icon name="refresh" /> Reopen</button>
              <button className="ghost sm" onClick={() => { const r = prompt('Alasan reject (invalid/duplikat)?'); if (r) act(f, 'REJECTED', { reject_reason: r } as any); }}>Reject</button>
            </div>
            {isCrit ? (
              <div className="photoline"><input placeholder="second_approver (email/uid, ≠ verifier)" value={second[f.id] ?? ''} onChange={e => setSecond(s => ({ ...s, [f.id]: e.target.value }))} style={{ flex: 1 }} />
                <button className="danger sm" onClick={() => act(f, 'CLOSED')}><Icon name="lock" /> Close + dual sign-off</button></div>
            ) : <div className="row"><button className="primary sm" onClick={() => act(f, 'CLOSED')}><Icon name="lock" /> Close</button></div>}
          </div>
        );
      })}
    </Protected>
  );
}
