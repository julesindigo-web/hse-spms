import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { can, type Action } from '../services/permissions';
import { t, humanize } from '../data/i18n';
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
        <nav className="menu" aria-label={t('ui_nav_label', lang)}>
          <NavLink to="/" end><Icon name="home" /> {t('nav_home', lang)}</NavLink>
          <NavLink to="/inspect"><Icon name="clipboard" /> {t('nav_inspect', lang)}</NavLink>
          <NavLink to="/activity"><Icon name="calendar" /> {t('nav_activity', lang)}</NavLink>
          <NavLink to="/findings"><Icon name="alert" /> {t('findings', lang)}</NavLink>
          <NavLink to="/monitoring"><Icon name="radar" /> {t('nav_monitoring', lang)}</NavLink>
          <NavLink to="/master"><Icon name="database" /> {t('nav_master', lang)}</NavLink>
          <NavLink to="/reports"><Icon name="report" /> {t('reports', lang)}</NavLink>
          {user?.role === 'HSE_ADMIN' && <NavLink to="/admin"><Icon name="gear" /> {t('admin', lang)}</NavLink>}
        </nav>
        <div className="userbox">
          <select value={lang} onChange={e => setLang(e.target.value as any)} aria-label={t('ui_lang_label', lang)}>
            <option value="id-ID">ID</option><option value="zh-CN">中文</option><option value="en-US">EN</option>
          </select>
          {user ? (
            <span className="who"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="who-txt"><b>{user.name}</b><small>{user.role}</small></span>
              <button className="ghost sm" onClick={() => { logout(); nav('/login'); }}>{t('logout', lang)}</button>
            </span>
          ) : <Link className="btn primary sm" to="/login">{t('login', lang)}</Link>}
        </div>
      </header>
      <main className="content">{children}</main>
      <footer className="foot">
        <div className="designer-chip">
          <img src="/brand/pa-logo-768.png" alt="Priastama Adiyoga — Product Design" loading="lazy" />
        </div>
        <p className="foot-brand">Product Design</p>
        <small>{t('ui_foot', lang)}</small>
      </footer>
    </div>
  );
}

export function Protected({ children, roles, action }: { children: React.ReactNode; roles?: string[]; action?: Action }) {
  const { user, lang } = useApp();
  if (!user) return <div className="card center"><span className="big-ic"><Icon name="lock" size={30} /></span><h3>{t('ui_need_login', lang)}</h3><p>{t('ui_login_prefix', lang)}<Link to="/login">{t('ui_login_link', lang)}</Link>{t('ui_login_suffix', lang)}</p></div>;
  if (roles && !roles.includes(user.role)) return <div className="card center"><span className="big-ic"><Icon name="shield" size={30} /></span><h3>{t('ui_denied', lang)}</h3><p>{t('ui_role_a', lang)}<b>{humanize(user.role)}</b>{t('ui_role_b', lang)}{action ? t('ui_need_perm', lang, { action: humanize(action) }) : ''}</p></div>;
  if (action && !can(user.role, action)) return <div className="card center"><span className="big-ic"><Icon name="shield" size={30} /></span><h3>{t('ui_insufficient', lang)}</h3><p>{t('ui_action_a', lang)}<b>{humanize(action)}</b>{t('ui_action_b', lang)}</p></div>;
  return <>{children}</>;
}

export interface DialogState {
  mode: 'notice' | 'confirm' | 'prompt';
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  danger?: boolean;
  onSubmit?: (value: string) => void;
}

export function useDialogKeys(active: boolean, onEscape: () => void, boxRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!active) return;
    const box = boxRef.current!;
    box.querySelector<HTMLElement>('button, input')?.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onEscape(); return; }
      if (e.key !== 'Tab') return;
      const items = Array.from(box.querySelectorAll<HTMLElement>('button, input')).filter(el => !el.hasAttribute('disabled'));
      const firstEl = items[0], lastEl = items[items.length - 1];
      const ae = document.activeElement as HTMLElement | null;
      if (e.shiftKey && ae === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && ae === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [active, onEscape, boxRef]);
}

export function Dialog({ state, onClose }: { state: DialogState | null; onClose: () => void }) {
  const { lang } = useApp();
  const [val, setVal] = useState('');
  const boxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (state) setVal(state.defaultValue ?? ''); }, [state]);
  useDialogKeys(!!state, onClose, boxRef);
  if (!state) return null;
  const submit = () => {
    onClose();
    if (state.mode !== 'notice' && state.onSubmit) state.onSubmit(val);
  };
  return (
    <div className="modalback" role="dialog" aria-modal="true" aria-label={state.title}>
      <div className="modal" ref={boxRef}>
        <h2>{state.title}</h2>
        <p className="muted">{state.message}</p>
        {state.mode === 'prompt' && <label><input aria-label={state.title} placeholder={state.placeholder ?? ''} value={val} onChange={e => setVal(e.target.value)} /></label>}
        <div className="row end">
          {state.mode !== 'notice' && <button className="ghost" onClick={onClose}>{t('dialog_cancel', lang)}</button>}
          <button className={state.danger ? 'danger' : 'primary'} onClick={submit}>{state.mode === 'prompt' ? t('dialog_submit', lang) : t('dialog_ok', lang)}</button>
        </div>
      </div>
    </div>
  );
}

export function CriticalModal({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  const { lang } = useApp();
  const boxRef = useRef<HTMLDivElement | null>(null);
  useDialogKeys(open, onCancel, boxRef);
  if (!open) return null;
  return (
    <div className="modalback" role="dialog" aria-modal="true" aria-label={t('ui_crit_kicker', lang)}>
      <div className="modal modal-crit" ref={boxRef}>
        <p className="modal-kicker"><Icon name="radio" /> {t('ui_crit_kicker', lang)}</p>
        <h2>{t('ui_crit_title', lang)}</h2>
        <p className="warn">{t('ui_crit_warn', lang)}</p>
        <ol className="steps">
          <li>{t('ui_crit_s1', lang)}</li>
          <li>{t('ui_crit_s2', lang)}</li>
          <li>{t('ui_crit_s3', lang)}</li>
        </ol>
        <div className="row end">
          <button className="ghost" onClick={onCancel}>{t('ui_crit_cancel', lang)}</button>
          <button className="danger" onClick={onConfirm}><Icon name="check" /> {t('ui_crit_confirm', lang)}</button>
        </div>
      </div>
    </div>
  );
}

export function Empty({ title, hint, icon = 'search' }: { title: string; hint?: string; icon?: 'search' | 'clipboard' | 'camera' }) {
  return <div className="empty"><span className="big-ic"><Icon name={icon} size={30} /></span><b>{title}</b>{hint && <p className="muted">{hint}</p>}</div>;
}
