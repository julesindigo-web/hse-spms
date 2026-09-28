import { useEffect, useState } from 'react';
import { list, put, metaGet, audit, remove } from '../services/store';
import { Protected } from '../components/ui';
import { useApp } from '../contexts/AppContext';
import { getDriveSettings, saveDriveSettings, testDriveConnection, retryTicket } from '../services/photos';
import { Icon } from '../components/icons';
import { changePassword, sha256 } from '../services/auth';
import { ROLE_DESC } from '../services/permissions';
import { humanize, t } from '../data/i18n';
import { Dialog, type DialogState } from '../components/ui';
import { CHECKLIST_MASTER } from '../data/checklists';
import { uid } from '../services/store';

export default function Admin() {
  const { user, lang } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [hash, setHash] = useState('');
  const [drv, setDrv] = useState({ appsScriptUrl: '', driveFolder: 'HSE SAFETY PATROL' });
  const [conn, setConn] = useState('');
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState({ old: '', nw: '' });
  const [nu, setNu] = useState({ name: '', email: '', emp: '', pass: '', role: 'PATROL' });
  const [dialog, setDialog] = useState<DialogState | null>(null);

  async function load() {
    setUsers(await list('users'));
    setTickets((await list('tickets')).sort((a: any, b: any) => ((b.expires_at ?? '') > (a.expires_at ?? '') ? 1 : -1)).slice(0, 30));
    setHash(await metaGet('master_hash'));
    const d = await getDriveSettings();
    setDrv({ appsScriptUrl: d.appsScriptUrl, driveFolder: d.driveFolder });
  }
  useEffect(() => { load(); }, []);

  async function toggleActive(u: any) {
    await put('users', { ...u, active: !u.active });
    await audit(user!.uid, user!.role, u.active ? 'DISABLE_USER' : 'ENABLE_USER', 'users', u.uid);
    load();
  }
  async function addUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = nu.email.toLowerCase().trim();
    if (users.some(u => u.email === email)) { setMsg(t('admin_dup', lang)); return; }
    const id = uid('u');
    await put('users', { id, uid: id, email, name: nu.name, employee_id: nu.emp, role: nu.role, active: true, areas: [], pass_hash: await sha256(nu.pass) });
    await audit(user!.uid, user!.role, 'CREATE_USER', 'users', id, email);
    setMsg(t('admin_created', lang, { email }));
    setNu({ name: '', email: '', emp: '', pass: '', role: 'PATROL' });
    load();
  }
  function resetPw(u: any) {
    setDialog({
      mode: 'prompt', title: t('admin_resetpw_title', lang), message: t('admin_resetpw_msg', lang, { email: u.email }),
      placeholder: t('admin_resetpw_ph', lang),
      onSubmit: async np => {
        if (!np || np.length < 8) return;
        await put('users', { ...u, pass_hash: await sha256(np), must_change: true });
        await audit(user!.uid, user!.role, 'RESET_PASSWORD', 'users', u.uid);
        setDialog({ mode: 'notice', title: t('admin_resetpw_title', lang), message: t('admin_resetpw_done', lang) });
      }
    });
  }
  function askDelete(u: any) {
    setDialog({
      mode: 'confirm', title: t('admin_delete_title', lang), message: t('admin_delete_msg', lang, { email: u.email }), danger: true,
      onSubmit: async () => { await remove('users', u.uid); load(); }
    });
  }

  return (
    <Protected action="user.manage">
      {dialog && <Dialog state={dialog} onClose={() => setDialog(null)} />}
      <p className="kicker">{t('admin_kicker', lang)}</p><h2><Icon name="gear" /> {t('admin_title', lang)}</h2>
      {msg && <div className="card"><p className="ok">{msg}</p></div>}

      <div className="card">
        <h3><Icon name="users" /> {t('admin_users', lang, { n: users.length })}</h3>
        <div className="tablewrap"><table><thead><tr><th>{t('admin_th_name', lang)}</th><th>{t('admin_th_role', lang)}</th><th>{t('admin_th_status', lang)}</th><th>{t('admin_th_action', lang)}</th></tr></thead><tbody>
          {users.map(u => <tr key={u.uid}><td><b>{u.name}</b><br /><small className="muted">{u.email} · {u.employee_id}</small></td>
            <td><span className="pill">{humanize(u.role)}</span></td>
            <td>{u.active ? <span className="pill ok">aktif</span> : <span className="pill bad">nonaktif</span>}</td>
            <td><div className="row" style={{ margin: 0 }}>
              <button className="ghost sm" onClick={() => toggleActive(u)}>{u.active ? t('admin_disable', lang) : t('admin_enable', lang)}</button>
              <button className="ghost sm" onClick={() => resetPw(u)}>{t('admin_resetpw', lang)}</button>
              <button className="ghost sm" onClick={() => askDelete(u)}>{t('admin_delete', lang)}</button>
            </div></td></tr>)}
        </tbody></table></div>
        <details><summary>{t('admin_matrix', lang)}</summary><ul>{Object.entries(ROLE_DESC).map(([r, d]) => <li key={r}><b>{humanize(r)}</b>: {d}</li>)}</ul></details>
        <details><summary>{t('admin_add_title', lang)}</summary>
          <form onSubmit={addUser} className="formgrid" style={{ marginTop: 8 }}>
            <label>{t('admin_f_name', lang)}<input value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} required /></label>
            <label>{t('admin_f_email', lang)}<input type="email" value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} required /></label>
            <label>{t('admin_f_emp', lang)}<input value={nu.emp} onChange={e => setNu({ ...nu, emp: e.target.value })} required /></label>
            <label>{t('admin_f_pass', lang)}<input type="password" value={nu.pass} onChange={e => setNu({ ...nu, pass: e.target.value })} required minLength={8} /></label>
            <label>{t('admin_th_role', lang)}<select value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value })}>{['PATROL', 'SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER', 'HSE_AUDITOR_OPTIONAL'].map(r => <option key={r} value={r}>{humanize(r)}</option>)}</select></label>
            <button className="primary" type="submit">{t('admin_create', lang)}</button>
          </form>
        </details>
      </div>

      <div className="grid2">
        <div className="card">
          <h3><Icon name="key" /> {t('admin_mypw', lang)}</h3>
          <div className="form"><label>{t('admin_old', lang)}<input type="password" value={pw.old} onChange={e => setPw({ ...pw, old: e.target.value })} /></label>
            <label>{t('admin_new', lang)}<input type="password" value={pw.nw} onChange={e => setPw({ ...pw, nw: e.target.value })} /></label>
            <button className="primary" onClick={async () => { const m = await changePassword(user!.uid, pw.old, pw.nw); setMsg(m ?? t('admin_changed', lang)); setPw({ old: '', nw: '' }); }}>{t('admin_changepw', lang)}</button></div>
        </div>
        <div className="card">
          <h3><Icon name="database" /> {t('admin_master_t', lang)}</h3>
          <p>{t('admin_hash_a', lang)}<code>{hash}</code> {t('admin_hash_b', lang, { n: CHECKLIST_MASTER.length })}</p>
          <p className="muted">{t('admin_quota', lang)}</p>
        </div>
      </div>

      <div className="card">
          <h3><Icon name="link" /> {t('admin_drive_t', lang)}</h3>
        <div className="formgrid">
          <label style={{ gridColumn: '1/-1' }}>{t('admin_drive_url', lang)}<input value={drv.appsScriptUrl} onChange={e => setDrv({ ...drv, appsScriptUrl: e.target.value })} placeholder="https://script.google.com/macros/s/…/exec" /></label>
          <label>{t('admin_drive_folder', lang)}<input value={drv.driveFolder} onChange={e => setDrv({ ...drv, driveFolder: e.target.value })} /></label>
          <div className="row" style={{ alignItems: 'end' }}>
            <button className="primary sm" onClick={async () => { await saveDriveSettings({ ...drv, updated_at: new Date().toISOString(), updated_by: user!.uid }); setMsg(t('admin_saved', lang)); }}><Icon name="check" /> {t('admin_save', lang)}</button>
            <button className="ghost sm" onClick={async () => { setConn(t('admin_testing', lang)); const r = await testDriveConnection(); setConn((r.ok ? '' : t('admin_attention', lang)) + r.msg); }}><Icon name="link" /> {t('admin_testconn', lang)}</button>
          </div>
        </div>
        {conn && <p className="muted">{conn}</p>}
        <p className="muted">{t('admin_flow', lang)}</p>
        <h4>{t('admin_queue', lang, { n: tickets.length })}</h4>
        <div className="tablewrap"><table><thead><tr><th>{t('admin_th_ticket', lang)}</th><th>{t('admin_th_file', lang)}</th><th>{t('admin_th_status', lang)}</th><th>{t('admin_th_action', lang)}</th></tr></thead><tbody>
          {tickets.map(x => <tr key={x.id}><td><small>{x.ticket_id}</small></td><td>{x.filename}</td><td><span className="pill">{humanize(x.status)}</span></td>
            <td>{x.status === 'QUEUED' && <button className="ghost sm" onClick={async () => setConn(await retryTicket(x.ticket_id))}>{t('admin_retry', lang)}</button>}</td></tr>)}
          {tickets.length === 0 && <tr><td colSpan={4} className="muted">{t('admin_queue_empty', lang)}</td></tr>}
        </tbody></table></div>
      </div>
    </Protected>
  );
}
