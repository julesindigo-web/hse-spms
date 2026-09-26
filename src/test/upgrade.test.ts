import { describe, it, expect, vi } from 'vitest';

describe('store upgrade', () => {
  it('toleran store ganda saat naik versi skema', async () => {
    vi.resetModules();
    const { openDB, deleteDB } = await import('idb');
    await deleteDB('hse-spms-v2');
    const v1 = await openDB('hse-spms-v2', 1, {
      upgrade(d) {
        d.createObjectStore('meta', { keyPath: 'id' });
        d.createObjectStore('users', { keyPath: 'id' });
      }
    });
    v1.close();
    const fresh = await import('../services/store');
    await fresh.put('meta', { id: 'k', value: 1 });
    expect(await fresh.get('meta', 'k')).toEqual({ id: 'k', value: 1 });
    expect(await fresh.list('users')).toEqual([]);
    await fresh.put('users', { id: 'u1', v: 2 });
    expect((await fresh.list('users')).length).toBe(1);
  });
});
