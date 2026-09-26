import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import App from './App';
import { clearAll, loginAs } from './test/render';

beforeEach(async () => { await clearAll(); });

function renderApp(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('App routes', () => {
  it('tamu melihat login; rute tak dikenal kembali home-protected', async () => {
    const r = renderApp('/login');
    expect(await r.findByText('Masuk ke Patrol')).not.toBeNull();
    r.unmount();
    window.history.pushState({}, '', '/');
  });
  it('setiap rute terdaftar me-render halamannya (HSE_ADMIN)', async () => {
    await loginAs('HSE_ADMIN');
    const cases: Array<[string, string]> = [
      ['/', 'Selamat bertugas'],
      ['/inspect', 'Inspeksi Patrol Harian'],
      ['/activity', 'Daily Activity Report'],
      ['/findings', 'Manajemen Temuan'],
      ['/monitoring', 'Monitoring Safety Patrol'],
      ['/dashboard', 'Dashboard'],
      ['/master', 'Data Master'],
      ['/reports', 'Laporan'],
      ['/admin', 'Admin Produksi'],
      ['/jalan-tak-ada', 'Selamat bertugas']
    ];
    for (const [path, text] of cases) {
      const r = renderApp(path);
      expect(await r.findByText(new RegExp(text))).not.toBeNull();
      r.unmount();
      expect(screen.queryByText(new RegExp(text))).toBeNull();
    }
    window.history.pushState({}, '', '/');
  });
});
