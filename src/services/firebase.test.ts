import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => { vi.resetModules(); vi.unstubAllEnvs(); });

describe('firebase init', () => {
  it('mode DEMO tanpa env: app/auth/db null', async () => {
    const m = await import('./firebase');
    expect(m.DEMO).toBe(true);
    expect(m.app).toBeNull();
    expect(m.auth).toBeNull();
    expect(m.dbfs).toBeNull();
    expect(m.APPS_SCRIPT_URL).toBeUndefined();
  });
  it('terinisialisasi dengan env lengkap', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'k');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'd');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'p');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'a');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 's');
    vi.stubEnv('VITE_APPS_SCRIPT_URL', 'https://script/exec');
    const m = await import('./firebase');
    expect(m.DEMO).toBe(false);
    expect(m.app).not.toBeNull();
    expect(m.auth).not.toBeNull();
    expect(m.dbfs).not.toBeNull();
    expect(m.APPS_SCRIPT_URL).toBe('https://script/exec');
  });
});
