import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, setToken as persistToken, clearToken, me, login as apiLogin, ApiError } from '@/lib/api';
import type { UserRole } from '@/lib/api';

export interface User {
  id: number;
  tipo: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const profile = await me(); 
      setUser({ id: profile.user_id, tipo: profile.role });
    } catch (err) {
      clearToken(); 
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { token } = await apiLogin(email, password);
    persistToken(token);
    await loadProfile();
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}