import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Admin from './Admin';
import { useApp } from '../contexts/AppContext';
import type { Lang } from '../types';
import { clearAll, loginAs, renderWith } from '../test/render';
import { list } from '../services/store';

beforeEach(async () => { await clearAll(); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Admin', () => {
  it('EN: chrome admin terjemahan', async () => {
    let setLang: (l: Lang) => void = () => {};
    function Probe() { const c = useApp(); setLang = c.setLang; return null; }
    await loginAs('HSE_ADMIN');
    const r = renderWith('/admin', <><Probe /><Admin /></>);
    expect(await r.findByText('Admin Produksi')).not.toBeNull();
    await act(async () => { setLang('en-US'); });
    expect(await r.findByText('Production Admin')).not.toBeNull();
    expect(await r.findByText('Create account')).not.toBeNull();
  });
  async function open() {
    const me = await loginAs('HSE_ADMIN');
    const oldPass = me.email === 'adiyoga.hse@gmail.com' ? 'Password.2468' : 'HseAdm#2026!';
    const u = userEvent.setup();
    const r = renderWith('/admin', <Admin />);
    await r.findByText('Admin Produksi');
    return { u, r, me, oldPass };
  }
  it('kelola user: tambah, nonaktif/aktif, reset, hapus, ganti password', async () => {
    const { u, r, oldPass } = await open();
    await u.type(r.getByLabelText('Nama'), 'Petugas Baru');
    await u.type(r.getByLabelText('Email'), 'baru@sifang.co.id');
    await u.type(r.getByLabelText('Employee ID'), 'SIF-099');
    await u.type(r.getByLabelText('Password awal'), 'PasswordBaru1');
    await u.selectOptions(r.getByLabelText('Role'), 'SUPERVISOR');
    await u.click(r.getByText('Buat akun'));
    expect(await r.findByText('Petugas Baru')).not.toBeNull();
    await u.type(r.getByLabelText('Nama'), 'X');
    await u.type(r.getByLabelText('Email'), 'baru@sifang.co.id');
    await u.type(r.getByLabelText('Employee ID'), 'SIF-100');
    await u.type(r.getByLabelText('Password awal'), 'PasswordBaru2');
    await u.click(r.getByText('Buat akun'));
    expect(await r.findByText(/sudah ada/)).not.toBeNull();
    const toggles = r.getAllByText('Nonaktifkan');
    await u.click(toggles[0]);
    expect(await r.findByText('Aktifkan')).not.toBeNull();
    await u.click(r.getAllByText('Aktifkan')[0]);
    await u.click(r.getAllByText('Reset PW')[0]);
    await u.type(await r.findByPlaceholderText('min 8 karakter'), 'PasswordReset1');
    await u.click(r.getByText('Kirim'));
    expect(await r.findByText(/direset/)).not.toBeNull();
    await u.click(r.getByText('OK'));
    const dels = r.getAllByText('Hapus');
    await u.click(dels[dels.length - 1]);
    expect(await r.findByText(/Hapus pengguna\?/)).not.toBeNull();
    await u.click(r.getByText('OK'));
    await u.type(r.getByLabelText('Lama'), oldPass as string);
    await u.type(r.getByLabelText(/^Baru/), 'Password.Baru99');
    await u.click(r.getByText('Ganti password'));
    expect(await r.findByText(/diganti/)).not.toBeNull();
    await u.type(r.getByLabelText('Lama'), 'salah');
    await u.type(r.getByLabelText(/^Baru/), 'Password.Baru100');
    await u.click(r.getByText('Ganti password'));
    expect(await r.findByText(/lama salah/)).not.toBeNull();
  }, 30000);
  it('drive: gagal tanpa konfigurasi, lalu simpan + tes koneksi + retry', async () => {
    const { put: putDb, uid: uidDb } = await import('../services/store');
    await putDb('tickets', { id: uidDb('t'), ticket_id: 't1', uid: 'u', inspection_id: 'i', filename: 'f.jpg', mime_type: 'image/jpeg', sha256: 's', status: 'QUEUED', expires_at: 'x', attachment_id: 'a1' });
    await putDb('attachments', { id: 'a1', dataUrl: 'data:x' });
    const { u, r } = await open();
    expect(await r.findByText('t1')).not.toBeNull();
    await u.click(r.getByText('Tes koneksi'));
    expect(await r.findByText(/Belum dikonfigurasi/)).not.toBeNull();
    await u.clear(r.getByLabelText('Folder root Drive'));
    await u.type(r.getByLabelText('Folder root Drive'), 'HSE TEST');
    await u.type(r.getByLabelText('Apps Script Web App URL'), 'https://script/exec');
    await u.click(r.getByText('Simpan'));
    expect(await r.findByText(/disimpan/)).not.toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
    await u.click(r.getByText('Tes koneksi'));
    expect(await r.findByText(/reachable/)).not.toBeNull();
    await u.click(r.getByText('Retry'));
    expect(await r.findByText(/terkirim/)).not.toBeNull();
  });
  it('reset dibatalkan atau terlalu pendek: hash utuh', async () => {
    const { u, r } = await open();
    const users = await list('users');
    const target = users[0];
    await u.click(r.getAllByText('Reset PW')[0]);
    await u.click(r.getByText('Batal'));
    await u.click(r.getAllByText('Reset PW')[0]);
    await u.type(await r.findByPlaceholderText('min 8 karakter'), 'pendek');
    await u.click(r.getByText('Kirim'));
    const after = (await list('users')).find((x: { uid: string }) => x.uid === target.uid) as { pass_hash: string };
    expect(after.pass_hash).toBe((target as { pass_hash: string }).pass_hash);
  });
  it('hapus dibatalkan: jumlah tetap', async () => {
    const { u, r } = await open();
    const n0 = (await list('users')).length;
    const dels = r.getAllByText('Hapus');
    await u.click(dels[0]);
    await u.click(r.getByText('Batal'));
    expect((await list('users')).length).toBe(n0);
  });
});
