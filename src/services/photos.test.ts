import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDriveSettings, saveDriveSettings, testDriveConnection, compressPhoto, pseudoSha, queuePhoto, retryTicket } from './photos';
import { metaPut, list } from './store';

beforeEach(async () => {
  const { clearStores } = await import('../test/db');
  await clearStores(['attachments', 'tickets', 'meta']);
  vi.unstubAllGlobals();
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('drive settings', () => {
  it('default lalu tersimpan', async () => {
    const d0 = await getDriveSettings();
    expect(d0.driveFolder).toBe('HSE SAFETY PATROL');
    await saveDriveSettings({ appsScriptUrl: 'https://x/exec', driveFolder: 'F', updated_at: 't', updated_by: 'u' });
    expect((await getDriveSettings()).appsScriptUrl).toBe('https://x/exec');
  });
});

describe('testDriveConnection', () => {
  it('tanpa URL → belum dikonfigurasi', async () => {
    await metaPut('drive_settings', { appsScriptUrl: '', driveFolder: 'F', updated_at: '', updated_by: '' });
    const r = await testDriveConnection();
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch('Belum dikonfigurasi');
  });
  it('GET 200 → ok; non-200 → panduan', async () => {
    await metaPut('drive_settings', { appsScriptUrl: 'https://x/exec', driveFolder: 'F', updated_at: '', updated_by: '' });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
    expect((await testDriveConnection()).ok).toBe(true);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403 })));
    const r = await testDriveConnection();
    expect(r.ok).toBe(false);
    expect(r.msg).toMatch('403');
  });
  it('fetch gugur → aman lokal; abort saat hang', async () => {
    await metaPut('drive_settings', { appsScriptUrl: 'https://x/exec', driveFolder: 'F', updated_at: '', updated_by: '' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect((await testDriveConnection()).ok).toBe(false);
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'gagal-tanpa-pesan'; }));
    expect((await testDriveConnection()).msg).toMatch('gagal-tanpa-pesan');
    vi.useFakeTimers();
    let aborted = false;
    vi.stubGlobal('fetch', vi.fn((_u: string, o: RequestInit) => new Promise((_res, rej) => {
      o.signal?.addEventListener('abort', () => { aborted = true; rej(new DOMException('aborted', 'AbortError')); });
    })));
    const p = testDriveConnection();
    await vi.advanceTimersByTimeAsync(8000);
    const r = await p;
    expect(aborted).toBe(true);
    expect(r.ok).toBe(false);
    vi.useRealTimers();
  });
});

describe('pseudoSha', () => {
  it('deterministik; string kosong aman', () => {
    expect(pseudoSha('abc')).toBe(pseudoSha('abc'));
    expect(pseudoSha('')).toMatch(/^sha-/);
    expect(pseudoSha('a'.repeat(25000))).toMatch(/^sha-/);
  });
});

function mockCanvas(lengths: number[]) {
  let i = 0;
  const ctx = { drawImage() {} };
  const cv = {
    width: 0, height: 0,
    getContext: () => ctx,
    toDataURL: () => 'x'.repeat(lengths[Math.min(i++, lengths.length - 1)])
  };
  vi.spyOn(document, 'createElement').mockReturnValue(cv as unknown as HTMLElement);
  vi.stubGlobal('createImageBitmap', async () => ({ width: 2000, height: 1000 }));
}

describe('compressPhoto', () => {
  it('tanpa loop saat sudah kecil; loop saat besar; berhenti di q minimum', async () => {
    mockCanvas([100]);
    const small = await compressPhoto(new File(['a'], 'a.jpg', { type: 'image/jpeg' }));
    expect(small.width).toBe(1600);
    expect(small.height).toBe(800);
    expect(small.size_kb).toBeLessThan(800);
    vi.restoreAllMocks();

    mockCanvas([900 * 1024, 100]);
    const big = await compressPhoto(new File(['a'], 'a.jpg', { type: 'image/jpeg' }));
    expect(big.size_kb).toBeLessThan(800);
    vi.restoreAllMocks();

    mockCanvas(Array(12).fill(900 * 1024));
    const stubborn = await compressPhoto(new File(['a'], 'a.jpg', { type: 'image/jpeg' }));
    expect(stubborn.size_kb).toBeGreaterThan(800);
    vi.restoreAllMocks();
  });
});

describe('queuePhoto & retryTicket', () => {
  it('antre + attachment; dorong bridge bila URL ada; diam bila gagal', async () => {
    await metaPut('drive_settings', { appsScriptUrl: '', driveFolder: 'F', updated_at: '', updated_by: '' });
    const id = await queuePhoto({ uidUser: 'u', inspection_id: 'i', filename: 'f.jpg', mime: 'image/jpeg', dataUrl: 'data:x' });
    expect((await list('attachments')).some((a: { id: string }) => a.id === id)).toBe(true);
    expect((await list('tickets')).length).toBe(1);

    await metaPut('drive_settings', { appsScriptUrl: 'https://x/exec', driveFolder: 'F', updated_at: '', updated_by: '' });
    const fetchOk = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchOk);
    await queuePhoto({ uidUser: 'u', inspection_id: 'i', checklist_id: 'TM-001', filename: 'g.jpg', mime: 'image/jpeg', dataUrl: 'data:y', lat: 1, lng: 2, acc: 3 });
    expect(fetchOk).toHaveBeenCalled();

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    await queuePhoto({ uidUser: 'u', inspection_id: 'i', filename: 'h.jpg', mime: 'image/jpeg', dataUrl: 'data:z' });
    expect((await list('tickets')).length).toBe(3);
  });
  it('retry: belum konfigurasi / ok / non-ok / gagal', async () => {
    await metaPut('drive_settings', { appsScriptUrl: '', driveFolder: 'F', updated_at: '', updated_by: '' });
    expect(await retryTicket('t')).toMatch('belum dikonfigurasi');
    await metaPut('drive_settings', { appsScriptUrl: 'https://x/exec', driveFolder: 'F', updated_at: '', updated_by: '' });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })));
    expect(await retryTicket('t')).toMatch('terkirim');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    expect(await retryTicket('t')).toMatch('500');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('net'); }));
    expect(await retryTicket('t')).toMatch('Gagal retry');
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'putus'; }));
    expect(await retryTicket('t')).toMatch('putus');
  });
});
