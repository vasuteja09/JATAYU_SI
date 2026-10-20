import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api, setAuthToken } from '../services/api';

export type UserRole = 'demo' | 'commander' | 'spares' | 'technician';

interface AuthState {
  isAuthenticated: boolean;
  username: string;
  role: UserRole;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ role: UserRole }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    username: '',
    role: 'demo',
    token: null,
  });

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.login(username, password);
    const role = (result.role as UserRole) || 'demo';
    setAuthToken(result.access_token);
    setAuth({
      isAuthenticated: true,
      username: result.username,
      role,
      token: result.access_token,
    });
    return { role };
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setAuth({ isAuthenticated: false, username: '', role: 'demo', token: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
