import { describe, it, expect, vi, afterEach } from 'vitest';
import { captureGps, gpsBadge } from './location';
import type { GpsFix } from './location';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('captureGps', () => {
  it('mocked saat tanpa geolocation', async () => {
    const g = await captureGps();
    expect(g.mocked).toBe(true);
    expect(g.accuracy_m).toBe(9999);
  });
  it('sukses via getCurrentPosition', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition(ok: (p: unknown) => void) {
          ok({ coords: { latitude: -3.9, longitude: 122.5, accuracy: 12 } });
        }
      }
    });
    const g = await captureGps();
    expect(g.lat).toBe(-3.9);
    expect(g.mocked).toBe(false);
    expect(g.accuracy_m).toBe(12);
  });
  it('akurasi hilang → 9999', async () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition(ok: (p: unknown) => void) {
          ok({ coords: { latitude: 1, longitude: 2 } });
        }
      }
    });
    expect((await captureGps()).accuracy_m).toBe(9999);
  });
  it('mocked saat error callback', async () => {
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition(_ok: unknown, err: (e: unknown) => void) { err(new Error('denied')); } }
    });
    expect((await captureGps()).mocked).toBe(true);
  });
  it('mocked saat timeout tanpa respons', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition() {} } });
    const g = await captureGps(-999);
    expect(g.mocked).toBe(true);
  });
});

describe('gpsBadge', () => {
  const good: GpsFix = { lat: -3.9, lng: 122.5, accuracy_m: 12, captured_at: 'x' };
  it('kasus kosong, nol, buruk, baik', () => {
    expect(gpsBadge(undefined)).toMatch('tidak tersedia');
    expect(gpsBadge({ lat: 0, lng: 0, accuracy_m: 9999, captured_at: 'x', mocked: true })).toMatch('tidak tersedia');
    expect(gpsBadge({ lat: 0, lng: 5, accuracy_m: 9999, captured_at: 'x' })).toMatch('>50m');
    expect(gpsBadge({ ...good, accuracy_m: 51 })).toMatch('>50m');
    expect(gpsBadge(good)).toBe('±12m');
  });
});
