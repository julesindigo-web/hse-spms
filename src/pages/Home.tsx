import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { list } from '../services/store';
import { useApp } from '../contexts/AppContext';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';
import { can } from '../services/permissions';
import { humanize, t } from '../data/i18n';
import { CHECKLIST_MASTER } from '../data/checklists';

export default function Home() {
  const { user, lang } = useApp();
  const [s, setS] = useState({ insp: 0, open: 0, crit: 0, pending: 0, today: 0 });
  useEffect(() => {
    (async () => {
      const [i, f, tk] = await Promise.all([list('inspections'), list('findings'), list('tickets')]);
      const t = new Date().toISOString().slice(0, 10);
      setS({
        insp: i.length, open: f.filter((x: any) => !['CLOSED', 'VERIFIED', 'REJECTED'].includes(x.state)).length,
        crit: f.filter((x: any) => x.risk_level === 'CRITICAL' && x.state !== 'CLOSED').length,
        pending: tk.filter((x: any) => x.status === 'QUEUED').length,
        today: i.filter((x: any) => x.date === t).length
      });
    })();
  }, []);
  const todayId = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Protected>
      <section className="hero" aria-label={t('home_kicker', lang, { date: todayId })}>
        <p className="kicker">{t('home_kicker', lang, { date: todayId })}</p>
        <h2>{t('home_hello', lang, { name: user?.name ?? '' })}</h2>
        <p className="sub">{t('home_sub', lang, { role: humanize(user?.role ?? ''), emp: user?.employee_id ?? '', today: t('home_today', lang, { n: s.today }) })}</p>
        <div className="hero-stats">
          <div><b>{s.insp}</b><span>{t('home_total', lang)}</span></div>
          <div><b>{s.open}</b><span>{t('monitor_open', lang)}</span></div>
          <div className={s.crit ? 'hs-bad' : ''}><b>{s.crit}</b><span>{t('monitor_critical', lang)}</span></div>
          <div><b>{s.pending}</b><span>{t('home_pending', lang)}</span></div>
        </div>
        <div className="cta-row">
          <Link className="btn light" to="/inspect"><Icon name="clipboard" /> {t('home_cta_inspect', lang)}</Link>
          <Link className="btn glass" to="/activity"><Icon name="calendar" /> {t('home_cta_daily', lang)}</Link>
          <Link className="btn glass" to="/monitoring"><Icon name="radar" /> {t('home_cta_monitor', lang)}</Link>
        </div>
      </section>
      <div className="grid2">
        <Link className="card link" to="/inspect"><h3><Icon name="clipboard" /> {t('home_card_inspect_t', lang)}</h3><p>{t('home_card_inspect_p', lang, { n: CHECKLIST_MASTER.length })}</p></Link>
        <Link className="card link" to="/activity"><h3><Icon name="calendar" /> {t('home_card_daily_t', lang)}</h3><p>{t('home_card_daily_p', lang)}</p></Link>
        <Link className="card link" to="/monitoring"><h3><Icon name="radar" /> {t('monitor_title', lang)}</h3><p>{t('home_card_monitor_p', lang)}</p></Link>
        <Link className="card link" to="/findings"><h3><Icon name="alert" /> {t('home_card_finding_t', lang)}</h3><p>{t('home_card_finding_p', lang)}</p></Link>
      </div>
      {user && can(user.role, 'audit.read') && <div className="grid2" style={{ marginTop: 14 }}>
        <Link className="card link" to="/dashboard"><h3><Icon name="report" /> {t('home_card_dash_t', lang)}</h3><p>{t('home_card_dash_p', lang)}</p></Link>
        <Link className="card link" to="/reports"><h3><Icon name="report" /> {t('home_card_report_t', lang)}</h3><p>{t('home_card_report_p', lang)}</p></Link>
      </div>}
      <div className="card warnbox"><strong><Icon name="radio" /> {t('home_warn_t', lang)}</strong><p className="muted" style={{ margin: '6px 0 0' }}>{t('home_warn_p', lang)}</p></div>
    </Protected>
  );
}
