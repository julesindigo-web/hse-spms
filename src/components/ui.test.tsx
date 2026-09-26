import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../contexts/AppContext';
import { Layout, Protected, CriticalModal, Empty, DESIGNER } from './ui';
import { loginAs, clearAll } from '../test/render';

beforeEach(async () => { await clearAll(); });

function shell(ui: React.ReactNode) {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
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
    await u.selectOptions(sel, 'en-US');
    expect((sel as HTMLSelectElement).value).toBe('en-US');
    await u.selectOptions(sel, 'id-ID');
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
    expect(screen.getByText(/user\.manage/)).not.toBeNull();
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
});

describe('CriticalModal', () => {
  it('null saat tutup; confirm/cancel saat buka', async () => {
    const { container } = render(<CriticalModal open={false} onConfirm={() => {}} onCancel={() => {}} />);
    expect(container.innerHTML).toBe('');
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const u = userEvent.setup();
    const r = render(<CriticalModal open onConfirm={onConfirm} onCancel={onCancel} />);
    expect(r.getByText(/STOP WORK/)).not.toBeNull();
    await u.click(r.getByText(/Sudah radio/));
    expect(onConfirm).toHaveBeenCalled();
    await u.click(r.getByText(/Batal/));
    expect(onCancel).toHaveBeenCalled();
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
