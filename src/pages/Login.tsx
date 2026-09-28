import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { t } from '../data/i18n';
import { BrandMark } from '../components/icons';
import { DESIGNER } from '../components/ui';

export default function Login() {
  const { login, lang } = useApp();
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
          <img src="/brand/pa-logo-768.png" alt="Priastama Adiyoga — Product Design" />
        </div>
        <div className="authbrand"><BrandMark size={44} />
          <div><h1>Safety Patrol</h1><p>{t('login_subtitle', lang)}</p></div>
        </div>
        <form onSubmit={go} className="form">
          <label>{t('login_email', lang)}<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@sifang.co.id" required autoComplete="username" /></label>
          <label>{t('password', lang)}
            <div className="passrow">
              <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required autoComplete="current-password" />
              <button type="button" className="ghost" onClick={() => setShow(s => !s)}>{show ? t('login_hide', lang) : t('login_show', lang)}</button>
            </div>
          </label>
          {err && <p className="errbox">{err}</p>}
          <button type="submit" className="primary big" disabled={busy}>{busy ? t('login_busy', lang) : t('login_submit', lang)}</button>
        </form>
        <details className="help"><summary>{t('login_accounts_hint', lang)}</summary>
          <ul>
            <li><code>patrol-sifang@gmail.com</code> — {t('login_acc_patrol', lang)}</li>
            <li><code>adiyoga.hse@gmail.com</code> — {t('login_acc_admin', lang)}</li>
            <li><code>patrol1@sifang.co.id</code> — PATROL {t('login_acc_backup', lang)}</li>
            <li><code>supervisor@sifang.co.id</code> — SUPERVISOR</li>
          </ul>
          <p className="muted">{t('login_forgot_a', lang)}<Link to="/admin">Admin → Pengguna</Link>{t('login_forgot_b', lang)}</p>
        </details>
        <div className="authfoot">
          <BrandMark size={20} />
          <small>Product Design by <b>{DESIGNER}</b></small>
        </div>
      </div>
    </div>
  );
}
