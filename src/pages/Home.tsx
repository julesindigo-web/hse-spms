import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { list } from '../services/store';
import { useApp } from '../contexts/AppContext';
import { Protected } from '../components/ui';
import { Icon } from '../components/icons';
import { can } from '../services/permissions';

export default function Home() {
  const { user } = useApp();
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
  return (
    <Protected>
      <div className="pagehead"><div><h2>Selamat datang, {user?.name}</h2><p className="muted">{user?.role} · {user?.employee_id} · Shift hari ini: <b>{s.today} inspeksi</b></p></div></div>
      <div className="kpis">
        <div className="kpi"><span>Inspeksi total</span><b>{s.insp}</b></div>
        <div className="kpi warn"><span>Temuan terbuka</span><b>{s.open}</b></div>
        <div className="kpi bad"><span>CRITICAL terbuka</span><b>{s.crit}</b></div>
        <div className="kpi"><span>Foto antre Drive</span><b>{s.pending}</b></div>
      </div>
      <div className="grid2">
        <Link className="card link" to="/inspect"><h3><Icon name="clipboard" /> Inspeksi Patrol Harian</h3><p>Mulai patrol: area, GPS, 316 checklist C/NC/OBS/NA dengan foto per item, critical control, dan STOP WORK.</p></Link>
        <Link className="card link" to="/activity"><h3><Icon name="calendar" /> Daily Activity Report</h3><p>Laporan aktivitas harian per tanggal, shift, dan area — lengkap dengan foto, export CSV, dan cetak PDF.</p></Link>
        <Link className="card link" to="/monitoring"><h3><Icon name="radar" /> Monitoring Safety Patrol</h3><p>Status area live, tren 7 hari, produktivitas patrol, serta daftar overdue.</p></Link>
        <Link className="card link" to="/findings"><h3><Icon name="alert" /> Temuan dan PIC</h3><p>Assign PIC, due date, corrective action, verifikasi, dan dual sign-off CRITICAL.</p></Link>
      </div>
      {user && can(user.role, 'audit.read') && <div className="grid2">
        <Link className="card link" to="/dashboard"><h3><Icon name="report" /> Dashboard Klasik</h3><p>Compliance, critical/high/open/overdue, dan tren closure.</p></Link>
        <Link className="card link" to="/reports"><h3><Icon name="report" /> Laporan dan Audit</h3><p>Finding register, inspection summary, dan audit trail.</p></Link>
      </div>}
      <div className="card warnbox"><strong><Icon name="radio" /> STOP WORK — radio terlebih dahulu, aplikasi kemudian.</strong><p className="muted" style={{ margin: '6px 0 0' }}>Komunikasi radio/verbal langsung ke supervisor/KTT adalah jalur utama. Aplikasi (foto, GPS, deskripsi, email) berfungsi sebagai dokumentasi, tindak lanjut, dan audit trail (§15 RULE-021). Dialog CRITICAL selalu mengingatkan sebelum submit.</p></div>
    </Protected>
  );
}
