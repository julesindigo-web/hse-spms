import { useEffect, useState } from 'react';
import { list, put, audit } from '../services/store';
import { useApp } from '../contexts/AppContext';
import { Protected, Empty, Dialog, type DialogState } from '../components/ui';
import { canCloseFinding } from '../services/engines';
import { humanize, t } from '../data/i18n';
import { can } from '../services/permissions';
import { Icon } from '../components/icons';
import type { Finding } from '../types';

export default function Findings() {
  const { user, lang } = useApp();
  const [items, setItems] = useState<Finding[]>([]);
  const [att, setAtt] = useState<any[]>([]);
  const [filter, setFilter] = useState('OPEN_ALL');
  const [second, setSecond] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const notice = (message: string) => setDialog({ mode: 'notice', title: t('finding_title', lang), message });
  async function load() {
    setItems(((await list('findings')) as Finding[]).sort((a: any, b: any) => ((b.created_at ?? '') > (a.created_at ?? '') ? 1 : -1)));
    setAtt(await list('attachments'));
  }
  useEffect(() => { load(); }, []);

  async function act(f: Finding, next: Finding['state'], extra: Partial<Finding> = {}) {
    const me = user!;
    if (next === 'VERIFIED' && !can(me.role, 'finding.verify')) { notice(t('finding_verify_denied', lang)); return; }
    if ((next === 'VERIFIED' || next === 'CLOSED') && me.role === 'PATROL') { notice(t('finding_patrol_locked', lang)); return; }
    if (next === 'CLOSED') {
      const c = canCloseFinding({ ...f, ...extra }, me.role, second[f.id] || (extra as any).second_approver_uid);
      if (!c.ok) { notice(t('finding_denied', lang, { reason: c.reason })); return; }
    }
    const upd = { ...f, ...extra, state: next, updated_at: new Date().toISOString() } as any;
    if (next === 'CLOSED' && (f as any).risk_level === 'CRITICAL') {
      upd.second_approver_uid = second[f.id];
      upd.second_approver_at = new Date().toISOString();
      await audit(me.uid, me.role, 'SECOND_APPROVAL_CRITICAL_CLOSURE', 'findings', f.id, `dual sign-off oleh ${upd.second_approver_uid}`);
    }
    await put('findings', upd);
    await audit(me.uid, me.role, `FINDING_${next}`, 'findings', f.id);
    load();
  }

  const shown = items.filter(f => filter === 'ALL' ? true : filter === 'OPEN_ALL' ? !['CLOSED', 'VERIFIED', 'REJECTED'].includes(f.state) : filter === 'CRITICAL' ? (f as any).risk_level === 'CRITICAL' : ((f as any).due_date && (f as any).due_date < new Date().toISOString().slice(0, 10) && !['CLOSED', 'VERIFIED'].includes(f.state)));

  function startAssign(f: Finding) {
    if (!can(user!.role, 'finding.assign')) { notice(t('finding_assign_denied', lang)); return; }
    setDialog({
      mode: 'prompt', title: t('finding_assign', lang), message: t('finding_assign_pic_msg', lang),
      placeholder: t('finding_assign_pic_ph', lang), defaultValue: (f as any).pic_name ?? '',
      onSubmit: pic => askDue(f, pic)
    });
  }
  function askDue(f: Finding, pic: string) {
    setDialog({
      mode: 'prompt', title: t('finding_due_title', lang), message: t('finding_due_msg', lang),
      placeholder: t('finding_due_ph', lang),
      defaultValue: (f as any).due_date ?? new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
      onSubmit: due => { act(f, 'ASSIGNED', { pic_name: pic, due_date: due || undefined } as any); }
    });
  }
  function startReject(f: Finding) {
    setDialog({
      mode: 'prompt', title: t('finding_reject', lang), message: t('finding_reject_msg', lang),
      placeholder: t('finding_reject_ph', lang),
      onSubmit: r => { if (r) act(f, 'REJECTED', { reject_reason: r } as any); }
    });
  }

  return (
    <Protected>
      <div className="pagehead"><div><p className="kicker">{t('finding_kicker', lang)}</p><h2><Icon name="alert" /> {t('finding_title', lang)}</h2><p className="muted">{t('finding_sub', lang, { shown: shown.length, total: items.length })}</p></div>
        <div className="row">{['OPEN_ALL', 'CRITICAL', 'OVERDUE', 'ALL'].map(x => <button key={x} className={filter === x ? 'btnsel' : 'ghost'} onClick={() => setFilter(x)}>{x === 'OPEN_ALL' ? t('finding_open', lang) : humanize(x)}</button>)}</div></div>
      {shown.length === 0 && <Empty title={t('finding_empty', lang)} hint={t('finding_empty_hint', lang)} />}
      {dialog && <Dialog state={dialog} onClose={() => setDialog(null)} />}
      {shown.map(f => {
        const fa = att.filter(a => a.inspection_id === (f as any).inspection_id).slice(0, 6);
        const isCrit = (f as any).risk_level === 'CRITICAL';
        return (
          <div key={f.id} className={`card ${isCrit ? 'crit' : ''}`}>
            <div className="rhead"><div><strong>{(f as any).title}</strong><br /><small className="muted">{humanize((f as any).area_id)} · {(f as any).id} · {(f as any).created_at?.slice(0, 16).replace('T', ' ')}</small></div>
              <span><span className={`badge ${(f as any).risk_level}`}>{humanize((f as any).risk_level)} {(f as any).risk_score}</span> <span className="badge">{humanize(f.state)}</span></span></div>
            <p>{(f as any).description}</p>
            <p className="muted">{t('finding_immediate_label', lang)}{(f as any).immediate_action} · {t('finding_pic_label', lang)}{(f as any).pic_name ?? '-'} {t('finding_due', lang, { d: (f as any).due_date ?? '-' })} · {humanize((f as any).closure_approval_level)}</p>
            {fa.length > 0 && <div className="thumbs">{fa.map((p: any) => <a key={p.id} href={p.dataUrl} target="_blank" rel="noreferrer"><img src={p.dataUrl} alt={p.filename} /></a>)}</div>}
            <div className="row">
              <button className="ghost sm" onClick={() => startAssign(f)}><Icon name="user" /> {t('finding_assign', lang)}</button>
              <button className="ghost sm" onClick={() => act(f, 'IN_PROGRESS')}><Icon name="wrench" /> {t('finding_progress', lang)}</button>
              <button className="ghost sm" onClick={() => act(f, 'PENDING_VERIFICATION')}><Icon name="search" /> {t('finding_ask_verify', lang)}</button>
              <button className="ghost sm" onClick={() => act(f, 'VERIFIED')}><Icon name="check" /> {t('finding_verify', lang)}</button>
              <button className="ghost sm" onClick={() => act(f, 'REOPENED')}><Icon name="refresh" /> {t('finding_reopen', lang)}</button>
              <button className="ghost sm" onClick={() => startReject(f)}>{t('finding_reject', lang)}</button>
            </div>
            {isCrit ? (
              <div className="photoline"><input placeholder={t('finding_second_ph', lang)} value={second[f.id] ?? ''} onChange={e => setSecond(s => ({ ...s, [f.id]: e.target.value }))} style={{ flex: 1 }} />
                <button className="danger sm" onClick={() => act(f, 'CLOSED')}><Icon name="lock" /> {t('finding_close_dual', lang)}</button></div>
            ) : <div className="row"><button className="primary sm" onClick={() => act(f, 'CLOSED')}><Icon name="lock" /> {t('finding_close', lang)}</button></div>}
          </div>
        );
      })}
    </Protected>
  );
}
