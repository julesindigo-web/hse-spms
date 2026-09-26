import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createUploadTicket, sha256Hex } from './drive';
import { list } from './store';

beforeEach(async () => {
  const { clearStores } = await import('../test/db');
  await clearStores(['attachments', 'tickets', 'meta']);
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('drive compat', () => {
  it('sha256Hex alias pseudoSha; createUploadTicket mengantre', async () => {
    expect(sha256Hex('a')).toMatch(/^sha-/);
    const r = await createUploadTicket('u', 'insp-1', 'f.jpg', 'image/jpeg', 'data:abc');
    expect(r).toBe('insp-1');
    expect((await list('attachments')).length).toBe(1);
  });
});
