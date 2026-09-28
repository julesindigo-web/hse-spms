import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Findings from './Findings';
import { useApp } from '../contexts/AppContext';
import type { Lang } from '../types';
import { clearAll, loginAs, renderWith } from '../test/render';
import { put, uid, list } from '../services/store';

beforeEach(async () => { await clearAll(); });
afterEach(() => { vi.unstubAllGlobals(); });

async function seed() {
  const at = (sec: number) => new Date(Date.now() - sec * 1000).toISOString();
  const base = {
    area_id: 'HAUL_ROAD', description: 'D', immediate_action: 'A',
    severity: 3, likelihood: 3, evidence_ids: [], created_by: 'u', updated_at: at(0)
  };
  await put('findings', { ...base, id: uid('f'), title: 'Temuan Rutin', risk_score: 9, risk_level: 'MEDIUM', state: 'OPEN', closure_approval_level: 'STANDARD', created_at: at(300) });
  await put('findings', { ...base, id: uid('f'), title: 'Kritis Jalan', risk_score: 25, risk_level: 'CRITICAL', state: 'IMMEDIATE_ACTION', closure_approval_level: 'DUAL_SIGN_OFF', created_at: at(200) });
  await put('findings', { ...base, id: uid('f'), title: 'Lewat Tempo', risk_score: 6, risk_level: 'MEDIUM', state: 'ASSIGNED', closure_approval_level: 'STANDARD', due_date: '2020-01-01', created_at: at(100) });
  await put('findings', { ...base, id: uid('f'), title: 'Akan Datang', risk_score: 3, risk_level: 'LOW', state: 'OPEN', closure_approval_level: 'STANDARD', due_date: '2099-01-01', created_at: at(50) });
  await put('findings', { ...base, id: uid('f'), title: 'Tanpa Waktu', risk_score: 4, risk_level: 'MEDIUM', state: 'OPEN', closure_approval_level: 'STANDARD' });
  await put('findings', { ...base, id: uid('f'), title: 'Tanpa Waktu 2', risk_score: 2, risk_level: 'LOW', state: 'OPEN', closure_approval_level: 'STANDARD' });
  await put('attachments', { id: uid('a'), filename: 'bukti.jpg', dataUrl: 'data:bukti' });
}

describe('Findings', () => {
  it('EN: chrome temuan terjemahan', async () => {
    let setLang: (l: Lang) => void = () => {};
    function Probe() { const c = useApp(); setLang = c.setLang; return null; }
    await loginAs('SUPERVISOR');
    await seed();
    const r = renderWith('/findings', <><Probe /><Findings /></>);
    expect(await r.findByText('Manajemen Temuan')).not.toBeNull();
    await act(async () => { setLang('en-US'); });
    expect(await r.findByText('Finding Management')).not.toBeNull();
    expect((await r.findAllByText('Request verification')).length).toBeGreaterThan(0);
  });
  it('SUPERVISOR: filter + assign + progress + verify + close', async () => {
    await loginAs('SUPERVISOR');
    await seed();
    const u = userEvent.setup();
    const r = renderWith('/findings', <Findings />);
    expect(await r.findByText('Manajemen Temuan')).not.toBeNull();
    async function stateOf(title: string): Promise<string> {
      const items = (await list('findings')) as { title: string; state: string }[];
      return items.find(f => f.title === title)?.state ?? 'HILANG';
    }
    await u.click(r.getAllByText('Assign PIC')[0]);
    await u.type(await r.findByPlaceholderText('Nama PIC'), 'Budi');
    await u.click(r.getByText('Kirim'));
    const dueInput = await r.findByPlaceholderText('YYYY-MM-DD');
    await u.clear(dueInput);
    await u.type(dueInput, '2026-12-31');
    await u.click(r.getByText('Kirim'));
    await waitFor(async () => expect(await stateOf('Akan Datang')).toBe('ASSIGNED'), { timeout: 8000 });
    await u.click(screen.getByRole('button', { name: 'Overdue' }));
    await u.click(r.getAllByText('Progress')[0]);
    await waitFor(async () => expect(await stateOf('Lewat Tempo')).toBe('IN_PROGRESS'), { timeout: 8000 });
    await u.click(r.getAllByText('Verify')[0]);
    await waitFor(async () => expect(await stateOf('Lewat Tempo')).toBe('VERIFIED'), { timeout: 8000 });
    await u.click(screen.getByRole('button', { name: 'Overdue' }));
    await u.click(screen.getByRole('button', { name: 'All' }));
    await u.click(r.getAllByText('Close')[0]);
    await waitFor(async () => expect(await stateOf('Akan Datang')).toBe('CLOSED'), { timeout: 8000 });
    await u.click(screen.getByRole('button', { name: 'Critical' }));
    await u.click(screen.getByRole('button', { name: 'All' }));
  });
  it('PATROL ditolak verify/close; CRITICAL dual sign-off HSE_ADMIN', async () => {
    await loginAs('PATROL');
    await seed();
    const u = userEvent.setup();
    const r = renderWith('/findings', <Findings />);
    await r.findByText('Manajemen Temuan');
    await u.click(r.getAllByText('Verify')[0]);
    expect(await r.findByText('Hanya Supervisor/HSE Admin yang bisa verify.')).not.toBeNull();
    await u.click(r.getByText('OK'));
    await u.click(r.getAllByText('Close')[0]);
    expect(await r.findByText('Patrol tidak bisa verify/close.')).not.toBeNull();
  });
  it('assign via dialog: batal, due kosong, reject kosong', async () => {
    await loginAs('HSE_ADMIN');
    await seed();
    const u = userEvent.setup();
    const r = renderWith('/findings', <Findings />);
    await r.findByText('Manajemen Temuan');
    await u.click(r.getAllByText('Assign PIC')[0]);
    await u.click(r.getByText('Batal'));
    expect(((await list('findings')) as { title: string; state: string }[]).find(f => f.title === 'Akan Datang')?.state).toBe('OPEN');
    await u.click(r.getAllByText('Assign PIC')[0]);
    await u.type(await r.findByPlaceholderText('Nama PIC'), 'Budi');
    await u.click(r.getByText('Kirim'));
    const dueInput = await r.findByPlaceholderText('YYYY-MM-DD');
    await u.clear(dueInput);
    await u.click(r.getByText('Kirim'));
    expect((await list('findings')).some((f: { state: string; pic_name?: string; due_date?: string }) => f.state === 'ASSIGNED' && f.pic_name === 'Budi' && f.due_date === undefined)).toBe(true);
    await u.click(r.getAllByText('Assign PIC')[3]);
    await u.type(await r.findByPlaceholderText('Nama PIC'), 'Budi');
    await u.click(r.getByText('Kirim'));
    const dueInput2 = await r.findByPlaceholderText('YYYY-MM-DD');
    await u.clear(dueInput2);
    await u.click(r.getByText('Kirim'));
    expect((await list('findings')).some((f: { title: string; pic_name?: string }) => f.title === 'Temuan Rutin' && f.pic_name === 'Budi')).toBe(true);
    await u.click(r.getAllByText('Reject')[0]);
    await u.click(r.getByText('Kirim'));
    expect((await list('findings')).every((f: { state: string }) => f.state !== 'REJECTED')).toBe(true);
  });
  it('PATROL assign ditolak karena izin', async () => {
    await loginAs('PATROL');
    await seed();
    const u = userEvent.setup();
    const r = renderWith('/findings', <Findings />);
    await r.findByText('Manajemen Temuan');
    await u.click(r.getAllByText('Assign PIC')[0]);
    expect(await r.findByText('Hanya Supervisor/HSE Admin yang bisa assign PIC.')).not.toBeNull();
  });
  it('HSE_ADMIN: tutup CRITICAL dengan second approver; reject + reopen', async () => {
    await loginAs('HSE_ADMIN');
    await seed();
    const u = userEvent.setup();
    const r = renderWith('/findings', <Findings />);
    await r.findByText('Manajemen Temuan');
    await u.click(r.getByText('Close + dual sign-off'));
    expect(await r.findByText(/Ditolak: /)).not.toBeNull();
    await u.click(r.getByText('OK'));
    await u.type(r.getByPlaceholderText(/Second approver/), 'spv@sifang.co.id');
    await u.click(r.getByText('Close + dual sign-off'));
    async function stateOf(title: string): Promise<string> {
      const items = (await list('findings')) as { title: string; state: string }[];
      return items.find(f => f.title === title)?.state ?? 'HILANG';
    }
    await waitFor(async () => expect(await stateOf('Kritis Jalan')).toBe('CLOSED'), { timeout: 8000 });
    await u.click(r.getAllByText('Reject')[0]);
    await u.type(await r.findByPlaceholderText('invalid/duplikat…'), 'duplikat');
    await u.click(r.getByText('Kirim'));
    await waitFor(async () => expect(await stateOf('Akan Datang')).toBe('REJECTED'), { timeout: 8000 });
    await u.click(r.getAllByText('Reopen')[0]);
    await waitFor(async () => expect(await stateOf('Lewat Tempo')).toBe('REOPENED'), { timeout: 8000 });
    await u.click(r.getAllByText('Minta verifikasi')[0]);
  });
  it('kosong → empty state', async () => {
    await loginAs('SUPERVISOR');
    const r = renderWith('/findings', <Findings />);
    expect(await r.findByText(/Tidak ada temuan pada filter ini/)).not.toBeNull();
  });
});
