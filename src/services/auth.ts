import type { AppUser, Role } from '../types';
import { get, list, put, metaGet, metaPut, uid, audit } from './store';

const SALT = 'hse-spms-v2-sifang';

export async function sha256(text: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return 'f' + h.toString(16);
  }
}

export interface LocalAccount extends AppUser { pass_hash: string; must_change?: boolean; }

export const DEFAULT_ACCOUNTS: Array<{ email: string; pass: string; name: string; employee_id: string; role: Role; areas: string[] }> = [
  { email: 'patrol1@sifang.co.id', pass: 'Patrol#2026', name: 'Patroli Lapangan 1', employee_id: 'SIF-001', role: 'PATROL', areas: ['HAUL_ROAD', 'SLOPE', 'LOADING', 'DISPOSAL'] },
  { email: 'patrol2@sifang.co.id', pass: 'Patrol#2026', name: 'Patroli Lapangan 2', employee_id: 'SIF-002', role: 'PATROL', areas: ['PIT_STOP', 'WATER', 'FUEL'] },
  { email: 'supervisor@sifang.co.id', pass: 'Spv#2026!', name: 'Supervisor Tambang', employee_id: 'SIF-010', role: 'SUPERVISOR', areas: [] },
  { email: 'hse@sifang.co.id', pass: 'HseAdm#2026!', name: 'HSE Admin', employee_id: 'SIF-020', role: 'HSE_ADMIN', areas: [] },
  { email: 'management@sifang.co.id', pass: 'Mgmt#2026!', name: 'Manajemen Viewer', employee_id: 'SIF-030', role: 'MANAGEMENT_VIEWER', areas: [] },
  { email: 'auditor@sifang.co.id', pass: 'Audit#2026!', name: 'HSE Auditor', employee_id: 'SIF-040', role: 'HSE_AUDITOR_OPTIONAL', areas: [] }
];

export const REQUIRED_ACCOUNTS: Array<{ email: string; pass: string; name: string; employee_id: string; role: Role; areas: string[] }> = [
  { email: 'patrol-sifang@gmail.com', pass: '12345', name: 'Patroli Sifang', employee_id: 'SIF-PATROL-01', role: 'PATROL', areas: ['HAUL_ROAD', 'SLOPE', 'LOADING', 'DISPOSAL', 'PIT_STOP', 'WATER', 'FUEL', 'WEATHER'] },
  { email: 'adiyoga.hse@gmail.com', pass: 'Password.2468', name: 'Adiyoga — HSE Administrator', employee_id: 'SIF-ADM-01', role: 'HSE_ADMIN', areas: [] }
];

async function upsertRequired(): Promise<void> {
  const users = (await list('users')) as LocalAccount[];
  for (const a of REQUIRED_ACCOUNTS) {
    const email = a.email.toLowerCase();
    const found = users.find(u => (u.email || '').toLowerCase() === email);
    const pass_hash = await sha256(a.pass);
    if (!found) {
      const id = uid('u');
      const acc: LocalAccount = {
        uid: id, email, name: a.name, employee_id: a.employee_id,
        role: a.role, active: true, areas: a.areas, pass_hash, must_change: false
      };
      await put('users', { ...acc, id: acc.uid } as any);
      await audit(id, a.role, 'CREATE_USER', 'users', id, `required account ${email}`);
    } else {
      const need = found.pass_hash !== pass_hash || found.role !== a.role || !found.active ||
        found.name !== a.name || (found.employee_id ?? '') !== a.employee_id;
      if (need) {
        await put('users', {
          ...found, name: a.name, employee_id: a.employee_id, role: a.role,
          active: true, areas: a.areas, pass_hash
        } as any);
        await audit(found.uid, a.role, 'RESET_PASSWORD', 'users', found.uid, `required account synced ${email}`);
      }
    }
  }
}

export async function ensureAccounts(): Promise<void> {
  const done = await metaGet('accounts_v2');
  if (!done) {
    for (const a of DEFAULT_ACCOUNTS) {
      const id = uid('u');
      const acc: LocalAccount = {
        uid: id, email: a.email.toLowerCase(), name: a.name, employee_id: a.employee_id,
        role: a.role, active: true, areas: a.areas, pass_hash: await sha256(a.pass), must_change: true
      };
      await put('users', { ...acc, id: acc.uid } as any);
    }
    await metaPut('accounts_v2', true);
  }
  await upsertRequired();
}

export async function loginLocal(email: string, pass: string): Promise<{ user?: AppUser; error?: string }> {
  await ensureAccounts();
  const users = (await list('users')) as LocalAccount[];
  const found = users.find(u => (u.email || '').toLowerCase() === email.trim().toLowerCase());
  if (!found) return { error: 'Email tidak terdaftar. Hubungi HSE_ADMIN.' };
  if (!found.active) return { error: 'Akun nonaktif. Hubungi HSE Admin.' };
  const h = await sha256(pass);
  if (h !== (found as any).pass_hash) return { error: 'Kata sandi salah.' };
  const { pass_hash: _p, ...safe } = found as any;
  await audit(found.uid, found.role, 'LOGIN', 'users', found.uid);
  return { user: safe as AppUser };
}

export async function changePassword(uidv: string, oldPass: string, newPass: string): Promise<string | null> {
  const acc = (await get('users', uidv)) as LocalAccount | undefined;
  if (!acc) return 'Akun tidak ditemukan';
  if ((await sha256(oldPass)) !== acc.pass_hash) return 'Kata sandi lama salah';
  if (newPass.length < 8) return 'Kata sandi baru minimal 8 karakter';
  await put('users', { ...acc, pass_hash: await sha256(newPass), must_change: false });
  await audit(uidv, acc.role, 'CHANGE_PASSWORD', 'users', uidv);
  return null;
}
