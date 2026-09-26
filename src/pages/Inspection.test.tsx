import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InspectionPage from './Inspection';
import { clearAll, loginAs, renderWith } from '../test/render';
import { list, put, uid } from '../services/store';
import { compressPhoto } from '../services/photos';

vi.mock('../services/photos', () => ({
  getDriveSettings: vi.fn(async () => ({ appsScriptUrl: '', driveFolder: 'F', updated_at: '', updated_by: '' })),
  saveDriveSettings: vi.fn(),
  testDriveConnection: vi.fn(),
  compressPhoto: vi.fn(async () => ({ dataUrl: 'data:img', width: 100, height: 100, size_kb: 50 })),
  pseudoSha: (s: string) => 'sha-' + s.length,
  queuePhoto: vi.fn(async () => 'att-1'),
  retryTicket: vi.fn()
}));

beforeEach(async () => { await clearAll(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('Inspection', () => {
  async function open() {
    await loginAs('PATROL');
    const u = userEvent.setup();
    const r = renderWith('/inspect', <InspectionPage />);
    await r.findByText('Inspeksi Patrol Harian');
    return { u, r };
  }
  function rows(r: ReturnType<typeof renderWith>) {
    return r.container.querySelectorAll('.checkrow');
  }
  function fill(el: Element | null, v: string) {
    fireEvent.change(el!, { target: { value: v } });
  }
  async function ncRow(u: ReturnType<typeof userEvent.setup>, r: ReturnType<typeof renderWith>, idx: number, note: string, actual = '', unit = '') {
    const row = rows(r)[idx];
    const btns = row.querySelectorAll('.seg button');
    await u.click(btns[1]);
    if (note) fill(row.querySelector('textarea'), note);
    const texts = row.querySelectorAll('input:not([type="file"]):not([type="checkbox"])');
    if (actual && texts[1]) fill(texts[1], actual);
    if (unit && texts[0]) fill(texts[0], unit);
  }
  async function uploadPhoto(u: ReturnType<typeof userEvent.setup>, r: ReturnType<typeof renderWith>, idx: number) {
    const input = rows(r)[idx].querySelector('input[type="file"]') as HTMLInputElement;
    await u.upload(input, new File(['x'], 'f.jpg', { type: 'image/jpeg' }));
  }

  it('ganti modul/shift/tipe/cuaca/area + cari item + empty', async () => {
    const { u, r } = await open();
    await u.selectOptions(r.getByLabelText(/Modul checklist/), 'TRAFFIC_MANAGEMENT');
    expect(r.getByText(/TRAFFIC_MANAGEMENT — 55 item/)).not.toBeNull();
    await u.selectOptions(r.getByLabelText(/Shift/), 'MALAM');
    await u.selectOptions(r.getByLabelText(/Tipe/), 'POST_RAIN');
    await u.selectOptions(r.getByLabelText('Cuaca*'), 'Hujan lebat');
    fill(r.getByPlaceholderText(/mis. TM-003/), 'berm');
    await u.selectOptions(r.getByLabelText(/^Area/), 'SLOPE');
    fill(r.getByPlaceholderText(/mis. TM-003/), 'zzz-tidak-ada');
    expect(await r.findByText('Tidak ada item cocok')).not.toBeNull();
  });

  it('validasi: NC tanpa catatan ditolak; NC kritis wajib foto; sukses submit', async () => {
    const { u, r } = await open();
    await u.selectOptions(r.getByLabelText(/Modul checklist/), 'TRAFFIC_MANAGEMENT');
    await u.selectOptions(r.getByLabelText(/^Area/), 'PIT_STOP');
    await u.selectOptions(r.getByLabelText('Sub-area'), 'PIT_STOP-A');
    await put('attachments', { id: 'att-1', inspection_id: 'draft', filename: 's.jpg', mime: 'image/jpeg', sha256: 's', size_kb: 1, upload_status: 'QUEUED', dataUrl: 'data:seeded' });
    await ncRow(u, r, 0, '');
    await u.click(r.getByText(/Submit inspeksi/));
    expect(await r.findByText(/belum ada catatan/)).not.toBeNull();
    fill(rows(r)[0].querySelector('textarea'), 'Berm rendah');
    await u.click(r.getByText(/Submit inspeksi/));
    expect(await r.findByText(/item kritis NC wajib foto/)).not.toBeNull();
    await uploadPhoto(u, r, 0);
    await uploadPhoto(u, r, 0);
    await ncRow(u, r, 1, 'Sempit sedikit');
    await u.click(rows(r)[2].querySelectorAll('.seg button')[0]);
    const r23 = rows(r)[22];
    await u.click(r23.querySelectorAll('.seg button')[2]);
    const t23 = r23.querySelectorAll('input:not([type="file"]):not([type="checkbox"])');
    fill(t23[0], 'HD-042');
    fill(t23[1], '0,5 m');
    await u.click(r.getByText(/Submit inspeksi/));
    expect(await r.findByText(/tersimpan —/, {}, { timeout: 10000 })).not.toBeNull();
    expect((await list('inspections')).length).toBe(1);
    expect((await list('findings')).length).toBe(2);
    const atts = await list('attachments');
    expect(atts.every((a: { inspection_id: string }) => a.inspection_id !== 'draft')).toBe(true);
  });

  it('stop work saja + CC-005: modal radio + immediate wajib', async () => {
    const { u, r } = await open();
    await u.selectOptions(r.getByLabelText(/Modul checklist/), 'TRAFFIC_MANAGEMENT');
    await u.click(r.getByRole('checkbox', { name: /STOP WORK/ }));
    await ncRow(u, r, 0, 'Berm jebol');
    await uploadPhoto(u, r, 0);
    await u.click(r.getByText(/Submit inspeksi/));
    expect(await r.findByText(/wajib isi Immediate action/)).not.toBeNull();
    fill(r.getByPlaceholderText(/Tindakan langsung/), 'Area disterilkan, radio supervisor');
    await u.click(r.getByText(/Submit inspeksi/));
    expect(await r.findByText(/Sudah menghubungi supervisor/)).not.toBeNull();
    await u.click(r.getByText(/kembali amankan area/));
    await u.click(r.getByText(/Submit inspeksi/));
    await u.click(r.getByText(/Sudah radio — lanjut submit/));
    expect(await r.findByText(/tersimpan —/, {}, { timeout: 10000 })).not.toBeNull();
    await u.click(r.getByRole('checkbox', { name: /CC-001/ }));
    await u.click(r.getByRole('checkbox', { name: /CC-001/ }));
    await u.click(r.getByRole('checkbox', { name: /CC-005/ }));
    await ncRow(u, r, 0, 'Retak memanjang', '2 cm', 'EX-011');
    await uploadPhoto(u, r, 0);
    fill(r.getByPlaceholderText(/Tindakan langsung/), 'Tutup jalur, pasang rambu');
    await u.click(r.getByText(/Submit inspeksi/));
    await u.click(r.getByText(/Sudah radio — lanjut submit/));
    expect((await list('inspections')).length).toBe(2);
    const fnds = await list('findings');
    expect(fnds.some((f: { severity: number }) => f.severity === 5)).toBe(true);
    expect(fnds.some((f: { risk_level: string }) => f.risk_level === 'CRITICAL')).toBe(true);
  });

  it('modul non-unit + foto sukses/gagal/batal + refresh GPS + submit SAFE', async () => {
    const { u, r } = await open();
    await u.selectOptions(r.getByLabelText(/Modul checklist/), 'PERSONNEL_PPE');
    await u.selectOptions(r.getByLabelText(/Modul checklist/), 'LIGHTNING_WEATHER');
    await u.selectOptions(r.getByLabelText(/Modul checklist/), 'LOADING_POINT');
    const rs = rows(r);
    const btns = rs[0].querySelectorAll('.seg button');
    await u.click(btns[2]);
    const texts = rs[0].querySelectorAll('input:not([type="file"]):not([type="checkbox"])');
    fill(texts[0], 'HD-042');
    await uploadPhoto(u, r, 1);
    expect(await r.findByText(/tersimpan \(/)).not.toBeNull();
    const cancelInput = rs[1].querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(cancelInput, 'files', { value: null, configurable: true });
    fireEvent.change(cancelInput);
    vi.mocked(compressPhoto).mockRejectedValueOnce(new Error('rusak'));
    await uploadPhoto(u, r, 1);
    expect(await r.findByText(/Gagal foto: rusak/)).not.toBeNull();
    vi.mocked(compressPhoto).mockRejectedValueOnce('gagal-tanpa-pesan');
    await uploadPhoto(u, r, 1);
    expect(await r.findByText(/Gagal foto: gagal-tanpa-pesan/)).not.toBeNull();
    await u.click(r.getByText('Refresh GPS'));
    await u.click(r.getByText(/Submit inspeksi/));
    expect(await r.findByText(/tersimpan —/, {}, { timeout: 10000 })).not.toBeNull();
  });
});
