// Store produksi offline-first §24: IndexedDB (idb) + fallback memori.
// Sumber kebenaran lokal; Firestore/Drive adalah sinkronisasi sekunder bila dikonfigurasi.
import { openDB, type IDBPDatabase } from 'idb';

const DB = 'hse-spms-v2';
let db: IDBPDatabase | null = null;

const STORES = ['inspections', 'findings', 'actions', 'attachments', 'tickets', 'audit', 'meta', 'users'];

async function getDb(): Promise<IDBPDatabase | null> {
  try {
    if (db) return db;
    db = await openDB(DB, 2, {
      upgrade(d) {
        for (const s of STORES) {
          try {
            d.createObjectStore(s, { keyPath: 'id' });
          } catch { /* store sudah ada — lanjutkan */ }
        }
      }
    });
    return db;
  } catch { return null; }
}

const mem: Record<string, Map<string, any>> = {};
function memStore(name: string): Map<string, any> {
  if (!mem[name]) mem[name] = new Map();
  return mem[name];
}

export async function put(store: string, value: any): Promise<void> {
  if (!value || !value.id) throw new Error(`put(${store}) membutuhkan value.id`);
  const d = await getDb();
  if (d) { await d.put(store as any, value); return; }
  memStore(store).set(value.id, value);
}
export async function list(store: string): Promise<any[]> {
  const d = await getDb();
  if (d) { try { return await d.getAll(store as any); } catch { return []; } }
  return [...memStore(store).values()];
}
export async function get(store: string, id: string): Promise<any | undefined> {
  const d = await getDb();
  if (d) { try { return await d.get(store as any, id); } catch { return undefined; } }
  return memStore(store).get(id);
}
export async function remove(store: string, id: string): Promise<void> {
  const d = await getDb();
  if (d) { try { await d.delete(store as any, id); return; } catch { /* fallback */ } }
  memStore(store).delete(id);
}
export async function metaGet(key: string): Promise<any> {
  const r = await get('meta', key);
  return r?.value;
}
export async function metaPut(key: string, value: any): Promise<void> {
  await put('meta', { id: key, value });
}
export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
export async function audit(actor_uid: string, actor_role: any, event: string, entity: string, entity_id: string, detail?: string): Promise<void> {
  // put() hanya gagal bila id hilang (tak mungkin: uid selalu terisi) atau IndexedDB rusak
  // total — pada kondisi itu put() utama pemanggil pun gagal, sehingga tak ada yang disembunyikan.
  await put('audit', { id: uid('aud'), at: new Date().toISOString(), actor_uid, actor_role, event, entity, entity_id, detail });
}

export async function ensureSeed(): Promise<void> {
  const done = await metaGet('seeded_prod_v2');
  if (done) return;
  await metaPut('master_hash', 'prod-316-v2.0');
  await metaPut('master_revision', 'v2.0-produksi');
  const q = await metaGet('quota_reads_today');
  if (q == null) await metaPut('quota_reads_today', 0);
  const ds = await metaGet('drive_settings');
  if (!ds) await metaPut('drive_settings', { appsScriptUrl: '', driveFolder: 'HSE SAFETY PATROL', updated_at: '', updated_by: '' });
  await metaPut('seeded_prod_v2', true);
}
