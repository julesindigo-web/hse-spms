import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser, Lang } from '../types';
import { ensureSeed, list, audit } from '../services/store';
import { ensureAccounts, loginLocal } from '../services/auth';
import { DEMO } from '../services/firebase';

interface AppCtx {
  user: AppUser | null; lang: Lang; setLang: (l: Lang) => void;
  login: (email: string, pass: string) => Promise<string | null>;
  logout: () => void; refreshUser: () => void; prodMode: boolean;
}
const C = createContext<AppCtx>({ user: null, lang: 'id-ID', setLang: () => {}, login: async () => 'noop', logout: () => {}, refreshUser: () => {}, prodMode: true });

const KEY = 'hse-session-v2';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [lang, setLang] = useState<Lang>('id-ID');
  useEffect(() => {
    (async () => {
      await ensureSeed();
      await ensureAccounts();
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const u = JSON.parse(raw) as AppUser;
          // revalidasi active (§3: perubahan role ditegakkan setelah sinkron)
          const users = await list('users');
          const cur = users.find((x: any) => x.uid === u.uid);
          if (cur && cur.active) setUser({ uid: cur.uid, email: cur.email, name: cur.name, employee_id: cur.employee_id, role: cur.role, active: true, areas: cur.areas ?? [] });
          else localStorage.removeItem(KEY);
        }
      } catch { /* abaikan sesi rusak */ }
    })();
  }, []);
  async function login(email: string, pass: string): Promise<string | null> {
    const r = await loginLocal(email, pass);
    if (r.error) return r.error;
    setUser(r.user!);
    localStorage.setItem(KEY, JSON.stringify(r.user));
    return null;
  }
  function logout() { setUser(null); localStorage.removeItem(KEY); }
  function refreshUser() {
    try { const raw = localStorage.getItem(KEY); if (raw) setUser(JSON.parse(raw)); } catch { /* noop */ }
  }
  return <C.Provider value={{ user, lang, setLang, login, logout, refreshUser, prodMode: !DEMO }}>{children}</C.Provider>;
}
export const useApp = () => useContext(C);
