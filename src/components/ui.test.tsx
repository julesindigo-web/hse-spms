import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, useApp } from '../contexts/AppContext';
import type { Lang } from '../types';
import { Layout, Protected, CriticalModal, Empty, Dialog, DESIGNER } from './ui';
import { loginAs, clearAll } from '../test/render';

beforeEach(async () => { await clearAll(); });

function shell(ui: React.ReactNode) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>
    </AppProvider>
  );
}

describe('DESIGNER', () => {
  it('brand tercatat', () => { expect(DESIGNER).toBe('Priastama Adiyoga'); });
});

describe('Layout', () => {
  it('tamu: tautan Masuk + footer brand', async () => {
    shell(<Layout><p>isi</p></Layout>);
    expect(await screen.findByText('Masuk')).not.toBeNull();
    expect(screen.getByText(/Product Design/)).not.toBeNull();
    expect(screen.getByAltText(/Priastama Adiyoga/)).toHaveAttribute('src', '/brand/pa-logo-768.png');
  });
  it('login: menu lengkap + admin untuk HSE_ADMIN saja', async () => {
    const me = await loginAs('PATROL');
    shell(<Layout><p>isi</p></Layout>);
    expect(await screen.findByText(me.name as string)).not.toBeNull();
    expect(screen.queryByText('Admin')).toBeNull();
  });
  it('logout kembali ke login', async () => {
    const me = await loginAs('HSE_ADMIN');
    const u = userEvent.setup();
    shell(<Layout><p>isi</p></Layout>);
    expect(await screen.findByText(me.name as string)).not.toBeNull();
    await u.click(screen.getByText('Keluar'));
    expect(await screen.findByText('Masuk')).not.toBeNull();
  });
  it('ganti bahasa tersedia', async () => {
    const u = userEvent.setup();
    shell(<Layout><p>isi</p></Layout>);
    const sel = await screen.findByLabelText('Bahasa');
    expect(await screen.findByText('Inspeksi')).not.toBeNull();
    await u.selectOptions(sel, 'en-US');
    expect((sel as HTMLSelectElement).value).toBe('en-US');
    expect(await screen.findByText('Inspection')).not.toBeNull();
    expect(screen.queryByText('Inspeksi')).toBeNull();
    await u.selectOptions(sel, 'id-ID');
    expect(await screen.findByText('Inspeksi')).not.toBeNull();
  });
});

describe('Protected', () => {
  it('tamu / role salah / aksi kurang / lolos', async () => {
    shell(<Protected><p>rahasia</p></Protected>);
    expect(await screen.findByText(/Perlu masuk|masuk/)).not.toBeNull();
  });
  it('blokir role', async () => {
    await loginAs('PATROL');
    shell(<Protected roles={['HSE_ADMIN']} action="user.manage"><p>x</p></Protected>);
    expect(await screen.findByText('Akses ditolak')).not.toBeNull();
    expect(screen.getByText(/User Manage/)).not.toBeNull();
  });
  it('blokir aksi + tampilkan izin', async () => {
    await loginAs('PATROL');
    shell(<Protected action="user.manage"><p>x</p></Protected>);
    expect(await screen.findByText('Izin tidak cukup')).not.toBeNull();
  });
  it('lolos dengan role dan aksi cukup', async () => {
    await loginAs('HSE_ADMIN');
    shell(<Protected roles={['HSE_ADMIN']} action="user.manage"><p>boleh</p></Protected>);
    expect(await screen.findByText('boleh')).not.toBeNull();
  });
  it('EN: penolakan dan modal terjemahan', async () => {
    let setLang: (l: Lang) => void = () => {};
    function Probe() { const c = useApp(); setLang = c.setLang; return null; }
    await loginAs('PATROL');
    const r = render(
      <AppProvider>
        <MemoryRouter initialEntries={['/']}><><Probe /><Protected roles={['HSE_ADMIN']}><p>x</p></Protected></></MemoryRouter>
      </AppProvider>
    );
    expect(await r.findByText('Akses ditolak')).not.toBeNull();
    await act(async () => { setLang('en-US'); });
    expect(await r.findByText('Access denied')).not.toBeNull();
  });
});

describe('CriticalModal', () => {
  it('null saat tutup; confirm/cancel saat buka', async () => {
    const { container } = render(<CriticalModal open={false} onConfirm={() => {}} onCancel={() => {}} />);
    expect(container.innerHTML).toBe('');
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const u = userEvent.setup();
    const r = render(<CriticalModal open onConfirm={onConfirm} onCancel={onCancel} />);
    expect(r.getByText(/Stop Work/)).not.toBeNull();
    await u.click(r.getByText(/Sudah radio/));
    expect(onConfirm).toHaveBeenCalled();
    await u.click(r.getByText(/Batal/));
    expect(onCancel).toHaveBeenCalled();
  });
  it('Escape membatalkan; tombol lain tidak', async () => {
    const onCancel = vi.fn();
    const r = render(<CriticalModal open onConfirm={() => {}} onCancel={onCancel} />);
    expect(r.getByText(/Stop Work/)).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
  it('Tab menjebak fokus di modal kritis', async () => {
    const r = render(<CriticalModal open onConfirm={() => {}} onCancel={() => {}} />);
    const btns = r.getAllByRole('button');
    expect(btns.length).toBe(2);
    btns[btns.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(btns[0]);
  });
});

describe('Dialog', () => {
  it('null → kosong', () => {
    const r = render(<Dialog state={null} onClose={() => {}} />);
    expect(r.container.innerHTML).toBe('');
  });
  it('notice: OK menutup tanpa submit', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const u = userEvent.setup();
    const r = render(<Dialog state={{ mode: 'notice', title: 'Info', message: 'Halo', onSubmit }} onClose={onClose} />);
    expect(r.getByText('Halo')).not.toBeNull();
    await u.click(r.getByText('OK'));
    expect(onClose).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it('confirm danger: Batal vs OK', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const u = userEvent.setup();
    const r = render(<Dialog state={{ mode: 'confirm', title: 'Yakin?', message: 'Hapus?', danger: true, onSubmit }} onClose={onClose} />);
    await u.click(r.getByText('Batal'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    await u.click(r.getByText('OK'));
    expect(onSubmit).toHaveBeenCalledWith('');
  });
  it('prompt: isi + kirim', async () => {
    const onSubmit = vi.fn();
    const u = userEvent.setup();
    const r = render(<Dialog state={{ mode: 'prompt', title: 'Nama', message: 'Siapa?', placeholder: 'Ketik', defaultValue: 'Awal', onSubmit }} onClose={() => {}} />);
    const input = r.getByPlaceholderText('Ketik') as HTMLInputElement;
    expect(input.value).toBe('Awal');
    await u.clear(input);
    await u.type(input, 'Budi');
    await u.click(r.getByText('Kirim'));
    expect(onSubmit).toHaveBeenCalledWith('Budi');
  });
  it('prompt tanpa placeholder: kirim kosong', async () => {
    const onSubmit = vi.fn();
    const u = userEvent.setup();
    const r = render(<Dialog state={{ mode: 'prompt', title: 'Alasan', message: 'Kenapa?', onSubmit }} onClose={() => {}} />);
    await u.click(r.getByText('Kirim'));
    expect(onSubmit).toHaveBeenCalledWith('');
  });
  it('confirm tanpa handler: OK hanya menutup', async () => {
    const onClose = vi.fn();
    const u = userEvent.setup();
    const r = render(<Dialog state={{ mode: 'confirm', title: 'Yakin?', message: 'Lanjut?' }} onClose={onClose} />);
    await u.click(r.getByText('OK'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('Escape menutup; Enter diabaikan', async () => {
    const onClose = vi.fn();
    render(<Dialog state={{ mode: 'notice', title: 'T', message: 'M' }} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('Tab menjebak fokus; sisanya diam', async () => {
    const r = render(<Dialog state={{ mode: 'confirm', title: 'T', message: 'M', onSubmit: () => {} }} onClose={() => {}} />);
    const btns = r.getAllByRole('button');
    expect(btns.length).toBe(2);
    btns[1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(btns[0]);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btns[1]);
    btns[0].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(btns[0]);
    btns[1].focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btns[1]);
  });
});

describe('Empty', () => {
  it('default dan custom icon + hint', () => {
    const a = render(<Empty title="Kosong" />);
    expect(a.getByText('Kosong')).not.toBeNull();
    a.unmount();
    const b = render(<Empty title="T" hint="h" icon="camera" />);
    expect(b.getByText('h')).not.toBeNull();
  });
});
