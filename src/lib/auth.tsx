import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { get, post, setUnauthorizedHandler, tokenStore } from './api';

export type Role = 'super_admin' | 'admin' | 'moderator' | 'support';
export type Admin = { id: number; name: string; email: string; role: Role };

type Ctx = {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<Ctx>(null as never);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    setUnauthorizedHandler(() => { tokenStore.clear(); setAdmin(null); });
    if (tokenStore.get()) {
      get<{ admin: Admin }>('/auth/me').then((r) => setAdmin(r.admin)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
    }
  }, []);

  const value: Ctx = {
    admin,
    loading,
    login: async (email, password) => {
      const r = await post<{ token: string; admin: Admin }>('/auth/login', { email, password });
      tokenStore.set(r.token);
      setAdmin(r.admin);
    },
    logout: async () => {
      await post('/auth/logout').catch(() => {});
      tokenStore.clear();
      setAdmin(null);
    },
    can: (...roles) => !!admin && (admin.role === 'super_admin' || roles.includes(admin.role)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
