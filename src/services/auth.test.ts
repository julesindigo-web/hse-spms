import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sha256, ensureAccounts, loginLocal, changePassword, REQUIRED_ACCOUNTS, DEFAULT_ACCOUNTS } from './auth';
import { list, put, get } from './store';

beforeEach(async () => {
  const { clearStores } = await import('../test/db');
  await clearStores(['users', 'audit']);
  const { metaPut } = await import('./store');
  await metaPut('accounts_v2', false);
});

describe('sha256', () => {
  it('deterministik dan berbeda per input', async () => {
    expect(await sha256('abc')).toBe(await sha256('abc'));
    expect(await sha256('abc')).not.toBe(await sha256('abd'));
  });
  it('mencakup kedua jalur subtle/fallback', async () => {
    const c = globalThis.crypto as Crypto | undefined;
    if (c?.subtle) {
      vi.spyOn(c.subtle, 'digest').mockRejectedValueOnce(new Error('subtle down'));
      const h = await sha256('jatuh');
      expect(h.startsWith('f')).toBe(true);
    } else {
      vi.stubGlobal('crypto', { subtle: { digest: async () => new Uint8Array([1, 2, 3]).buffer } });
      expect(await sha256('x')).toBe('010203');
      vi.unstubAllGlobals();
    }
  });
});

describe('ensureAccounts', () => {
  it('menanam default + required, idempoten', async () => {
    await ensureAccounts();
    const users = await list('users');
    expect(users.length).toBeGreaterThanOrEqual(6 + REQUIRED_ACCOUNTS.length);
    for (const r of REQUIRED_ACCOUNTS) {
      expect(users.some((u: { email: string }) => u.email === r.email)).toBe(true);
    }
    await ensureAccounts();
    expect((await list('users')).length).toBe(users.length);
  });
  it('memperbaiki akun required yang dirusak per field', async () => {
    await ensureAccounts();
    const target = REQUIRED_ACCOUNTS[0].email;
    const fields: Array<[string, unknown]> = [
      ['pass_hash', 'rusak'],
      ['role', 'SUPERVISOR'],
      ['active', false],
      ['name', 'Salah'],
      ['employee_id', 'XXX']
    ];
    for (const [f, v] of fields) {
      const users = await list('users');
      const acc = users.find((u: { email: string }) => u.email === target);
      await put('users', { ...acc, [f]: v });
      await ensureAccounts();
      const fixed = (await get('users', acc.uid)) as Record<string, unknown>;
      expect(fixed[f]).not.toBe(v);
    }
    // employee_id hilang → jalur update; email hilang → dibuat ulang
    const users = await list('users');
    const acc = users.find((u: { email: string }) => u.email === target);
    const { employee_id: _m, ...noEmp } = acc;
    void _m;
    await put('users', noEmp);
    await ensureAccounts();
    expect(((await get('users', acc.uid)) as Record<string, unknown>).employee_id).toBe(REQUIRED_ACCOUNTS[0].employee_id);
    const { email: _e, ...noEmail } = (await get('users', acc.uid)) as Record<string, unknown>;
    void _e;
    await put('users', noEmail);
    await ensureAccounts();
    const recreated = (await list('users')).find((u: { email: string }) => u.email === target) as Record<string, unknown>;
    expect(recreated.employee_id).toBe(REQUIRED_ACCOUNTS[0].employee_id);
    // pencarian melewati record tanpa email tanpa gagal
    expect((await loginLocal('tak@ada.xx', 'p')).error).toMatch('tidak terdaftar');
  });
});

describe('loginLocal', () => {
  it('email tak dikenal, nonaktif, password salah, sukses', async () => {
    await ensureAccounts();
    expect((await loginLocal('tidak@ada.id', 'x')).error).toMatch('tidak terdaftar');
    const users = await list('users');
    const acc = users[0];
    await put('users', { ...acc, active: false });
    expect((await loginLocal(acc.email, 'salah')).error).toMatch('nonaktif');
    await put('users', { ...acc, active: true });
    expect((await loginLocal(acc.email, 'salah')).error).toMatch('Kata sandi salah');
    const ok = await loginLocal(REQUIRED_ACCOUNTS[1].email, REQUIRED_ACCOUNTS[1].pass);
    expect(ok.user?.role).toBe('HSE_ADMIN');
    expect((ok.user as unknown as Record<string, unknown>).pass_hash).toBeUndefined();
  });
});

describe('changePassword', () => {
  it('akun hilang, lama salah, baru pendek, sukses', async () => {
    await ensureAccounts();
    expect(await changePassword('tak-ada', 'a', 'b')).toMatch('tidak ditemukan');
    const users = await list('users');
    const acc = users.find((u: { email: string }) => u.email === REQUIRED_ACCOUNTS[0].email);
    expect(await changePassword(acc.uid, 'salah', 'Password.Baru1')).toMatch('lama salah');
    expect(await changePassword(acc.uid, REQUIRED_ACCOUNTS[0].pass, 'pendek')).toMatch('minimal 8');
    // sukses pada akun non-required (required disinkron ulang oleh ensureAccounts)
    const plain = users.find((u: { email: string }) => u.email === DEFAULT_ACCOUNTS[0].email);
    expect(await changePassword(plain.uid, DEFAULT_ACCOUNTS[0].pass, 'Password.Baru1')).toBeNull();
    const ok = await loginLocal(plain.email, 'Password.Baru1');
    expect(ok.user?.uid).toBe(plain.uid);
  });
});
