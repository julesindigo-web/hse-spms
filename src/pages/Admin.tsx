import { useEffect, useState } from 'react';
import { list, put, metaGet, audit, remove } from '../services/store';
import { Protected } from '../components/ui';
import { useApp } from '../contexts/AppContext';
import { getDriveSettings, saveDriveSettings, testDriveConnection, retryTicket } from '../services/photos';
import { Icon } from '../components/icons';
import { changePassword, sha256 } from '../services/auth';
import { ROLE_DESC } from '../services/permissions';
import { humanize } from '../data/i18n';
import { CHECKLIST_MASTER } from '../data/checklists';
import { uid } from '../services/store';

export default function Admin() {
  const { user } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [hash, setHash] = useState('');
  const [drv, setDrv] = useState({ appsScriptUrl: '', driveFolder: 'HSE SAFETY PATROL' });
  const [conn, setConn] = useState('');
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState({ old: '', nw: '' });
  const [nu, setNu] = useState({ name: '', email: '', emp: '', pass: '', role: 'PATROL' });

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
    if (users.some(u => u.email === email)) { setMsg('Email sudah ada.'); return; }
    const id = uid('u');
    await put('users', { id, uid: id, email, name: nu.name, employee_id: nu.emp, role: nu.role, active: true, areas: [], pass_hash: await sha256(nu.pass) });
    await audit(user!.uid, user!.role, 'CREATE_USER', 'users', id, email);
    setMsg(`Pengguna ${email} dibuat. Sampaikan password awal secara aman (lisan/tertulis), bukan via grup umum.`);
    setNu({ name: '', email: '', emp: '', pass: '', role: 'PATROL' });
    load();
  }
  async function resetPw(u: any) {
    const np = prompt(`Password baru untuk ${u.email} (min 8):`);
    if (!np || np.length < 8) return;
    await put('users', { ...u, pass_hash: await sha256(np), must_change: true });
    await audit(user!.uid, user!.role, 'RESET_PASSWORD', 'users', u.uid);
    alert('Password direset. Pengguna wajib ganti saat login berikut.');
  }

  return (
    <Protected action="user.manage">
      <p className="kicker">Kelola sistem — HSE Admin</p><h2><Icon name="gear" /> Admin Produksi</h2>
      {msg && <div className="card"><p className="ok">{msg}</p></div>}

      <div className="card">
        <h3><Icon name="users" /> Pengguna dan hak akses ({users.length})</h3>
        <div className="tablewrap"><table><thead><tr><th>Nama / Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {users.map(u => <tr key={u.uid}><td><b>{u.name}</b><br /><small className="muted">{u.email} · {u.employee_id}</small></td>
            <td><span className="pill">{humanize(u.role)}</span></td>
            <td>{u.active ? <span className="pill ok">aktif</span> : <span className="pill bad">nonaktif</span>}</td>
            <td><div className="row" style={{ margin: 0 }}>
              <button className="ghost sm" onClick={() => toggleActive(u)}>{u.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
              <button className="ghost sm" onClick={() => resetPw(u)}>Reset PW</button>
              <button className="ghost sm" onClick={async () => { if (confirm(`Hapus ${u.email}? Hanya bila benar-benar perlu — disarankan nonaktifkan.`)) { await remove('users', u.uid); load(); } }}>Hapus</button>
            </div></td></tr>)}
        </tbody></table></div>
        <details><summary>Matriks hak akses</summary><ul>{Object.entries(ROLE_DESC).map(([r, d]) => <li key={r}><b>{humanize(r)}</b>: {d}</li>)}</ul></details>
        <details><summary>Tambah pengguna baru</summary>
          <form onSubmit={addUser} className="formgrid" style={{ marginTop: 8 }}>
            <label>Nama<input value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} required /></label>
            <label>Email<input type="email" value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} required /></label>
            <label>Employee ID<input value={nu.emp} onChange={e => setNu({ ...nu, emp: e.target.value })} required /></label>
            <label>Password awal<input type="password" value={nu.pass} onChange={e => setNu({ ...nu, pass: e.target.value })} required minLength={8} /></label>
            <label>Role<select value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value })}>{['PATROL', 'SUPERVISOR', 'HSE_ADMIN', 'MANAGEMENT_VIEWER', 'HSE_AUDITOR_OPTIONAL'].map(r => <option key={r} value={r}>{humanize(r)}</option>)}</select></label>
            <button className="primary" type="submit">Buat akun</button>
          </form>
        </details>
      </div>

      <div className="grid2">
        <div className="card">
          <h3><Icon name="key" /> Password saya</h3>
          <div className="form"><label>Lama<input type="password" value={pw.old} onChange={e => setPw({ ...pw, old: e.target.value })} /></label>
            <label>Baru (min 8)<input type="password" value={pw.nw} onChange={e => setPw({ ...pw, nw: e.target.value })} /></label>
            <button className="primary" onClick={async () => { const m = await changePassword(user!.uid, pw.old, pw.nw); setMsg(m ?? 'Password diganti.'); setPw({ old: '', nw: '' }); }}>Ganti password</button></div>
        </div>
        <div className="card">
          <h3><Icon name="database" /> Master dan kuota</h3>
          <p>Hash master: <code>{hash}</code> ({CHECKLIST_MASTER.length} item, rev produksi). DRAFT lama memakai snapshot versinya.</p>
          <p className="muted">Kuota Spark: pantau di Firebase Console; threshold 50/75/90% + contingency Blaze. Jangan biarkan kuota menghentikan pencatatan safety-critical.</p>
        </div>
      </div>

      <div className="card">
          <h3><Icon name="link" /> Koneksi Google Drive — akun fungsional, bukan personal</h3>
        <div className="formgrid">
          <label style={{ gridColumn: '1/-1' }}>Apps Script Web App URL<input value={drv.appsScriptUrl} onChange={e => setDrv({ ...drv, appsScriptUrl: e.target.value })} placeholder="https://script.google.com/macros/s/…/exec" /></label>
          <label>Folder root Drive<input value={drv.driveFolder} onChange={e => setDrv({ ...drv, driveFolder: e.target.value })} /></label>
          <div className="row" style={{ alignItems: 'end' }}>
            <button className="primary sm" onClick={async () => { await saveDriveSettings({ ...drv, updated_at: new Date().toISOString(), updated_by: user!.uid }); setMsg('Pengaturan Drive disimpan.'); }}><Icon name="check" /> Simpan</button>
            <button className="ghost sm" onClick={async () => { setConn('Menguji…'); const r = await testDriveConnection(); setConn((r.ok ? '' : 'Perhatian: ') + r.msg); }}><Icon name="link" /> Tes koneksi</button>
          </div>
        </div>
        {conn && <p className="muted">{conn}</p>}
        <p className="muted">Alur: tiket Firestore (Queued, 24 jam, terikat UID) → POST base64 + tiket → Apps Script verifikasi ID Token independen + cek <code>ticket.uid==token.uid</code> + validasi MIME/ukuran/hash → Drive → Uploaded. Password tak pernah ke Apps Script.</p>
        <h4>Antrean upload ({tickets.length} terbaru)</h4>
        <div className="tablewrap"><table><thead><tr><th>Tiket</th><th>File</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {tickets.map(t => <tr key={t.id}><td><small>{t.ticket_id}</small></td><td>{t.filename}</td><td><span className="pill">{humanize(t.status)}</span></td>
            <td>{t.status === 'QUEUED' && <button className="ghost sm" onClick={async () => setConn(await retryTicket(t.ticket_id))}>Retry</button>}</td></tr>)}
          {tickets.length === 0 && <tr><td colSpan={4} className="muted">Antrean kosong — semua foto tersinkron.</td></tr>}
        </tbody></table></div>
      </div>
    </Protected>
  );
}
