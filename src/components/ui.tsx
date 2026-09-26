import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { can, type Action } from '../services/permissions';
import { Icon, BrandMark } from './icons';

export const DESIGNER = 'Priastama Adiyoga';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, lang, setLang } = useApp();
  const nav = useNavigate();
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="HSE Safety Patrol — beranda">
          <BrandMark />
          <span className="brandtxt"><strong>Safety Patrol</strong><small>Sifang Mining · v2.0</small></span>
        </Link>
        <nav className="menu" aria-label="Navigasi utama">
          <NavLink to="/" end><Icon name="home" /> Home</NavLink>
          <NavLink to="/inspect"><Icon name="clipboard" /> Inspeksi</NavLink>
          <NavLink to="/activity"><Icon name="calendar" /> Harian</NavLink>
          <NavLink to="/findings"><Icon name="alert" /> Temuan</NavLink>
          <NavLink to="/monitoring"><Icon name="radar" /> Monitoring</NavLink>
          <NavLink to="/master"><Icon name="database" /> Master</NavLink>
          <NavLink to="/reports"><Icon name="report" /> Laporan</NavLink>
          {user?.role === 'HSE_ADMIN' && <NavLink to="/admin"><Icon name="gear" /> Admin</NavLink>}
        </nav>
        <div className="userbox">
          <select value={lang} onChange={e => setLang(e.target.value as any)} aria-label="Bahasa">
            <option value="id-ID">ID</option><option value="zh-CN">中文</option><option value="en-US">EN</option>
          </select>
          {user ? (
            <span className="who"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="who-txt"><b>{user.name}</b><small>{user.role}</small></span>
              <button className="ghost sm" onClick={() => { logout(); nav('/login'); }}>Keluar</button>
            </span>
          ) : <Link className="btn primary sm" to="/login">Masuk</Link>}
        </div>
      </header>
      <main className="content">{children}</main>
      <footer className="foot">
        <div className="foot-line" aria-hidden="true"><span /><BrandMark size={22} /><span /></div>
        <p className="foot-brand">Product Design by <b>{DESIGNER}</b></p>
        <small>HSE Safety Patrol v2.0 · Offline-first · Radio/verbal adalah jalur utama STOP WORK (RULE-021) · Aplikasi sebagai dokumentasi dan backup</small>
      </footer>
    </div>
  );
}

export function Protected({ children, roles, action }: { children: React.ReactNode; roles?: string[]; action?: Action }) {
  const { user } = useApp();
  if (!user) return <div className="card center"><span className="big-ic"><Icon name="lock" size={30} /></span><h3>Akses memerlukan login</h3><p>Silakan <Link to="/login">masuk dengan akun dinas</Link> untuk memakai aplikasi produksi ini.</p></div>;
  if (roles && !roles.includes(user.role)) return <div className="card center"><span className="big-ic"><Icon name="shield" size={30} /></span><h3>Akses ditolak</h3><p>Role <b>{user.role}</b> tidak diizinkan untuk halaman ini.{action ? ` Izin yang dibutuhkan: ${action}.` : ''} (RBAC §2)</p></div>;
  if (action && !can(user.role, action)) return <div className="card center"><span className="big-ic"><Icon name="shield" size={30} /></span><h3>Izin tidak cukup</h3><p>Aksi <b>{action}</b> memerlukan role lebih tinggi. (Enforcement lapis UI dan data §22)</p></div>;
  return <>{children}</>;
}

export function CriticalModal({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="modalback" role="dialog" aria-modal="true" aria-label="Konfirmasi kondisi kritis">
      <div className="modal modal-crit">
        <p className="modal-kicker"><Icon name="radio" /> STOP WORK — KONDISI KRITIS</p>
        <h2>Sudah menghubungi supervisor via radio?</h2>
        <p className="warn">Aplikasi adalah jalur <b>sekunder</b> — radio/verbal langsung adalah jalur <b>utama</b> untuk keselamatan jiwa (§15 RULE-021). Notifikasi digital tertunda saat perangkat offline.</p>
        <ol className="steps">
          <li>Hentikan aktivitas berbahaya dan amankan personel (radio terlebih dahulu).</li>
          <li>Lengkapi immediate action, foto, GPS, dan deskripsi.</li>
          <li>Submit — diteruskan ke Supervisor dan HSE Admin sebagai dokumentasi dan tindak lanjut.</li>
        </ol>
        <div className="row end">
          <button className="ghost" onClick={onCancel}>Batal — kembali amankan area</button>
          <button className="danger" onClick={onConfirm}><Icon name="check" /> Sudah radio — lanjut submit</button>
        </div>
      </div>
    </div>
  );
}

export function Empty({ title, hint, icon = 'search' }: { title: string; hint?: string; icon?: 'search' | 'clipboard' | 'camera' }) {
  return <div className="empty"><span className="big-ic"><Icon name={icon} size={30} /></span><b>{title}</b>{hint && <p className="muted">{hint}</p>}</div>;
}
