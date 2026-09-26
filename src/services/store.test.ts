import { describe, it, expect, vi, beforeEach } from 'vitest';
import { put, list, get, remove, metaGet, metaPut, uid, audit, ensureSeed } from './store';

beforeEach(async () => {
  const { clearStores } = await import('../test/db');
  await clearStores(['inspections', 'findings', 'actions', 'attachments', 'tickets', 'audit', 'meta', 'users']);
});

describe('store', () => {
  it('uid unik berprefix', () => {
    const a = uid('x');
    expect(a.startsWith('x_')).toBe(true);
    expect(uid('x')).not.toBe(a);
  });
  it('put/list/get/remove roundtrip', async () => {
    await put('inspections', { id: 'i1', v: 1 });
    expect(await get('inspections', 'i1')).toEqual({ id: 'i1', v: 1 });
    expect((await list('inspections')).length).toBe(1);
    await remove('inspections', 'i1');
    expect(await get('inspections', 'i1')).toBeUndefined();
  });
  it('put tanpa id ditolak', async () => {
    await expect(put('inspections', { v: 1 } as never)).rejects.toThrow('value.id');
    await expect(put('inspections', null as never)).rejects.toThrow('value.id');
  });
  it('store tak dikenal kembali aman (fallback catch)', async () => {
    expect(await list('tak-ada')).toEqual([]);
    expect(await get('tak-ada', 'x')).toBeUndefined();
    await remove('tak-ada', 'x');
  });
  it('metaGet/metaPut + audit tak menggagalkan', async () => {
    expect(await metaGet('belum-ada')).toBeUndefined();
    await metaPut('k', { a: 1 });
    expect(await metaGet('k')).toEqual({ a: 1 });
    await audit('u', 'PATROL', 'EV', 'ent', 'e1', 'd');
    expect((await list('audit')).length).toBe(1);
  });
  it('ensureSeed idempoten + mengisi default', async () => {
    await ensureSeed();
    expect(await metaGet('master_hash')).toBe('prod-316-v2.0');
    expect(await metaGet('master_revision')).toBe('v2.0-produksi');
    expect((await metaGet('drive_settings')).driveFolder).toBe('HSE SAFETY PATROL');
    await ensureSeed();
    expect(await metaGet('seeded_prod_v2')).toBe(true);
  });
  it('fallback memori saat IndexedDB gagal', async () => {
    vi.resetModules();
    vi.stubGlobal('indexedDB', undefined);
    const fresh = await import('./store');
    await fresh.put('inspections', { id: 'm1', v: 1 });
    expect(await fresh.get('inspections', 'm1')).toEqual({ id: 'm1', v: 1 });
    expect(await fresh.list('inspections')).toEqual([{ id: 'm1', v: 1 }]);
    await fresh.metaPut('k', 1);
    expect(await fresh.metaGet('k')).toBe(1);
    await fresh.audit('u', 'PATROL', 'E', 'e', '1');
    await fresh.remove('inspections', 'm1');
    expect(await fresh.get('inspections', 'm1')).toBeUndefined();
    await fresh.ensureSeed();
    expect(await fresh.metaGet('master_hash')).toBe('prod-316-v2.0');
    vi.unstubAllGlobals();
  });
});
