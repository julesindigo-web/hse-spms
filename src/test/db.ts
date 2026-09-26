import { openDB } from 'idb';
import { metaPut, remove } from '../services/store';

export async function clearStores(names: string[]): Promise<void> {
  await metaPut('__init', 1);
  const db = await openDB('hse-spms-v2', 2);
  for (const s of names) {
    try {
      await db.clear(s);
    } catch {}
  }
  await remove('meta', '__init');
}
