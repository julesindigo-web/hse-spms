import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { BrandMark } from '../components/icons';
import { DESIGNER } from '../components/ui';

export default function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const m = await login(email, pass);
    setBusy(false);
    if (m) setErr(m); else nav('/');
  }
  return (
    <div className="authwrap">
      <div className="authcard">
        <div className="brandhero">
          <img src="/brand/pa-logo-768.jpg" alt="Priastama Adiyoga — Product Design" fetchPriority="high" />
        </div>
        <div className="authbrand"><BrandMark size={44} />
          <div><h1>Safety Patrol</h1><p>PT Sifang Mining Indonesia · v2.0 produksi</p></div>
        </div>
        <form onSubmit={go} className="form">
          <label>Email dinas<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@sifang.co.id" required autoComplete="username" /></label>
          <label>Kata sandi
            <div className="passrow">
              <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required autoComplete="current-password" />
              <button type="button" className="ghost" onClick={() => setShow(s => !s)}>{show ? 'Sembunyi' : 'Lihat'}</button>
            </div>
          </label>
          {err && <p className="errbox">{err}</p>}
          <button type="submit" className="primary big" disabled={busy}>{busy ? 'Memeriksa…' : 'Masuk ke Patrol'}</button>
        </form>
        <details className="help"><summary>Akun terdaftar (password dibagikan admin via jalur aman)</summary>
          <ul>
            <li><code>patrol-sifang@gmail.com</code> — PATROL (karyawan patrol)</li>
            <li><code>adiyoga.hse@gmail.com</code> — HSE_ADMIN (administrator master)</li>
            <li><code>patrol1@sifang.co.id</code> — PATROL cadangan</li>
            <li><code>supervisor@sifang.co.id</code> — SUPERVISOR</li>
          </ul>
          <p className="muted">Lupa password? Hubungi HSE_ADMIN untuk reset di <Link to="/admin">Admin → Pengguna</Link>. Akun dinonaktifkan via <code>active=false</code>, bukan hapus (§3).</p>
        </details>
        <div className="authfoot">
          <BrandMark size={20} />
          <small>Product Design by <b>{DESIGNER}</b></small>
        </div>
      </div>
    </div>
  );
}
