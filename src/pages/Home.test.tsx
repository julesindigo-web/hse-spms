import { describe, it, expect, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import Home from './Home';
import { useApp } from '../contexts/AppContext';
import type { Lang } from '../types';
import { clearAll, loginAs, renderWith } from '../test/render';
import { put, uid } from '../services/store';

beforeEach(async () => { await clearAll(); });

describe('Home', () => {
  it('EN: chrome home terjemahan', async () => {
    let setLang: (l: Lang) => void = () => {};
    function Probe() { const c = useApp(); setLang = c.setLang; return null; }
    await loginAs('PATROL');
    const r = renderWith('/', <><Probe /><Home /></>);
    expect(await r.findByText(/Selamat bertugas/)).not.toBeNull();
    await act(async () => { setLang('en-US'); });
    expect(await r.findByText(/Have a good shift/)).not.toBeNull();
    expect(await r.findByText('Daily Patrol Inspection')).not.toBeNull();
  });
  it('PATROL: hero + 4 kartu, tanpa audit', async () => {
    await loginAs('PATROL');
    renderWith('/', <Home />);
    expect(await screen.findByText(/Selamat bertugas/)).not.toBeNull();
    expect(screen.getByText('Inspeksi Patrol Harian')).not.toBeNull();
    expect(screen.queryByText('Dashboard Klasik')).toBeNull();
    expect(screen.getAllByText(/Stop Work/).length).toBeGreaterThanOrEqual(2);
  });
  it('HSE_ADMIN: kartu audit + statistik terhitung', async () => {
    const me = await loginAs('HSE_ADMIN');
    await put('inspections', { id: uid('insp'), date: new Date().toISOString().slice(0, 10), responses: [] });
    await put('findings', { id: uid('f'), risk_level: 'CRITICAL', state: 'OPEN' });
    await put('tickets', { id: 't', ticket_id: 't', status: 'QUEUED' });
    void me;
    renderWith('/', <Home />);
    expect(await screen.findByText('Dashboard Klasik')).not.toBeNull();
    expect(screen.getByText('Laporan dan Audit')).not.toBeNull();
  });
});
