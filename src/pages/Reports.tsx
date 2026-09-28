import { useEffect, useState } from 'react';
import { list } from '../services/store';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';
import { findingRegister, inspectionSummary, download } from '../services/reporting';
import { humanize, t } from '../data/i18n';
import { useApp } from '../contexts/AppContext';

export default function Reports() {
  const { lang } = useApp();
  const [f, setF] = useState<any[]>([]);
  const [ins, setIns] = useState<any[]>([]);
  const [au, setAu] = useState<any[]>([]);
  useEffect(() => { (async () => { setF(await list('findings')); setIns(await list('inspections')); setAu(await list('audit')); })(); }, []);
  return (
    <Protected>
      <p className="kicker">{t('report_kicker', lang)}</p><h2><Icon name="report" /> {t('report_title', lang)}</h2>
      <div className="card">
        <div className="row">
          <button onClick={() => download(`finding-register-${Date.now()}.csv`, findingRegister(f))}><Icon name="download" /> {t('report_csv_finding', lang)}</button>
          <button onClick={() => download(`inspection-summary-${Date.now()}.csv`, inspectionSummary(ins))}><Icon name="download" /> {t('report_csv_summary', lang)}</button>
          <button onClick={() => window.print()}><Icon name="printer" /> {t('report_print', lang)}</button>
        </div>
        <p className="muted">{t('report_evidence', lang)}</p>
      </div>
      <div className="card"><h3>{t('report_audit', lang, { n: au.length })}</h3>
        <ul className="audit">{au.slice(-50).reverse().map((a: any) => <li key={a.id}><small>{a.at}</small> <b>{humanize(a.event)}</b> {a.entity}/{a.entity_id} oleh {a.actor_uid} — {a.detail ?? ''}</li>)}</ul>
      </div>
    </Protected>
  );
}
