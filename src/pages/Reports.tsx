import { useEffect, useState } from 'react';
import { list } from '../services/store';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';
import { findingRegister, inspectionSummary, download } from '../services/reporting';

export default function Reports() {
  const [f, setF] = useState<any[]>([]);
  const [ins, setIns] = useState<any[]>([]);
  const [au, setAu] = useState<any[]>([]);
  useEffect(() => { (async () => { setF(await list('findings')); setIns(await list('inspections')); setAu(await list('audit')); })(); }, []);
  return (
    <Protected>
      <p className="kicker">Dokumentasi dan audit trail</p><h2><Icon name="report" /> Laporan (§30) + Audit (§31)</h2>
      <div className="card">
        <div className="row">
          <button onClick={() => download(`finding-register-${Date.now()}.csv`, findingRegister(f))}><Icon name="download" /> Finding Register CSV</button>
          <button onClick={() => download(`inspection-summary-${Date.now()}.csv`, inspectionSummary(ins))}><Icon name="download" /> Inspection Summary CSV</button>
          <button onClick={() => window.print()}><Icon name="printer" /> Cetak / PDF (via browser)</button>
        </div>
        <p className="muted">Evidence Index: attachments di menu Admin. Export penuh hanya HSE_ADMIN (RBAC §2).</p>
      </div>
      <div className="card"><h3>Audit Trail ({au.length})</h3>
        <ul className="audit">{au.slice(-50).reverse().map((a: any) => <li key={a.id}><small>{a.at}</small> <b>{a.event}</b> {a.entity}/{a.entity_id} oleh {a.actor_uid} — {a.detail ?? ''}</li>)}</ul>
      </div>
    </Protected>
  );
}
