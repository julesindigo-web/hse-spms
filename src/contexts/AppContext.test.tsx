import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useRef } from 'react';
import { AppProvider, useApp } from './AppContext';
import { clearAll, loginAs } from '../test/render';
import { list, put } from '../services/store';

beforeEach(async () => { await clearAll(); });

function Probe({ on }: { on: (ctx: ReturnType<typeof useApp>) => void }) {
  const ctx = useApp();
  const ref = useRef(ctx);
  ref.current = ctx;
  on(ctx);
  return <p>{ctx.user ? ctx.user.email : 'tamu'}</p>;
}

describe('AppContext', () => {
  it('mulai tamu; login sukses menyimpan sesi; logout menghapus', async () => {
    let ctx: ReturnType<typeof useApp> | null = null;
    render(<AppProvider><Probe on={c => { ctx = c; }} /></AppProvider>);
    expect(await screen.findByText('tamu')).not.toBeNull();
    expect(ctx!.lang).toBe('id-ID');
    expect(ctx!.prodMode).toBe(false);
    let err: string | null = 'x';
    await act(async () => { err = await ctx!.login('patrol-sifang@gmail.com', '12345'); });
    expect(err).toBeNull();
    expect(await screen.findByText('patrol-sifang@gmail.com')).not.toBeNull();
    expect(localStorage.getItem('hse-session-v2')).toContain('patrol-sifang@gmail.com');
    await act(async () => { ctx!.setLang('en-US'); });
    expect(ctx!.lang).toBe('en-US');
    ctx!.logout();
    expect(localStorage.getItem('hse-session-v2')).toBeNull();
    expect(await screen.findByText('tamu')).not.toBeNull();
  });
  it('login gagal mengembalikan pesan', async () => {
    let ctx: ReturnType<typeof useApp> | null = null;
    render(<AppProvider><Probe on={c => { ctx = c; }} /></AppProvider>);
    await screen.findByText('tamu');
    let err: string | null = null;
    await act(async () => { err = await ctx!.login('patrol-sifang@gmail.com', 'salah'); });
    expect(err).toMatch('Kata sandi salah');
  });
  it('sesi rusak/nonaktif dibersihkan; refreshUser memuat ulang', async () => {
    await loginAs('PATROL');
    const users = await list('users');
    const { put } = await import('../services/store');
    const u = users.find((x: { role: string }) => x.role === 'PATROL');
    await put('users', { ...u, active: false });
    let ctx: ReturnType<typeof useApp> | null = null;
    render(<AppProvider><Probe on={c => { ctx = c; }} /></AppProvider>);
    await waitFor(() => expect(localStorage.getItem('hse-session-v2')).toBeNull());
    expect(await screen.findByText('tamu')).not.toBeNull();
    localStorage.setItem('hse-session-v2', JSON.stringify({ uid: 'tak-ada', email: 'x', role: 'PATROL' }));
    await act(async () => { ctx!.refreshUser(); });
    expect(await screen.findByText('x')).not.toBeNull();
  });
  it('konteks default tanpa provider: no-op aman', async () => {
    let ctx: ReturnType<typeof useApp> | null = null;
    render(<Probe on={c => { ctx = c; }} />);
    expect(await screen.findByText('tamu')).not.toBeNull();
    expect(ctx!.lang).toBe('id-ID');
    expect(ctx!.prodMode).toBe(true);
    await act(async () => {
      expect(await ctx!.login('a', 'b')).toBe('noop');
      ctx!.logout();
      ctx!.setLang('zh-CN');
      ctx!.refreshUser();
    });
    expect(await screen.findByText('tamu')).not.toBeNull();
  });
  it('sesi tanpa areas + unknown tetap valid', async () => {
    await loginAs('PATROL');
    const users = await list('users');
    const u = users.find((x: { role: string }) => x.role === 'PATROL');
    const { areas: _a, ...bare } = u;
    void _a;
    await put('users', bare);
    localStorage.setItem('hse-session-v2', JSON.stringify(bare));
    let ctx: ReturnType<typeof useApp> | null = null;
    render(<AppProvider><Probe on={c => { ctx = c; }} /></AppProvider>);
    expect(await screen.findByText(bare.email)).not.toBeNull();
    expect(ctx).not.toBeNull();
  });
  it('refreshUser menelan storage error tanpa crash', async () => {
    const me = await loginAs('PATROL');
    let ctx: ReturnType<typeof useApp> | null = null;
    render(<AppProvider><Probe on={c => { ctx = c; }} /></AppProvider>);
    expect(await screen.findByText(me.email as string)).not.toBeNull();
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('denied'); }, setItem: () => {}, removeItem: () => {} });
    await act(async () => { ctx!.refreshUser(); });
    expect(await screen.findByText(me.email as string)).not.toBeNull();
  });
  it('sesi korup dibersihkan deterministik (effect + refresh)', async () => {
    localStorage.setItem('hse-session-v2', 'bukan-json{');
    let ctx: ReturnType<typeof useApp> | null = null;
    render(<AppProvider><Probe on={c => { ctx = c; }} /></AppProvider>);
    expect(await screen.findByText('tamu')).not.toBeNull();
    await waitFor(() => expect(localStorage.getItem('hse-session-v2')).toBeNull(), { timeout: 8000 });
    await act(async () => { ctx!.refreshUser(); });
    expect(await screen.findByText('tamu')).not.toBeNull();
  });
});
