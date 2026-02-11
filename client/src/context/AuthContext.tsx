import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import type { User, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (nextUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolvePersistedAvatar = () => {
    const extras = localStorage.getItem('profileExtras');
    if (!extras) return null;

    try {
      const parsed = JSON.parse(extras) as { avatarUrl?: string };
      return typeof parsed.avatarUrl === 'string' && parsed.avatarUrl ? parsed.avatarUrl : null;
    } catch {
      return null;
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser) as User;
      const avatarUrl = resolvePersistedAvatar();
      setUser(avatarUrl ? { ...parsedUser, avatarUrl } : parsedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    const { token: newToken, user: newUser } = response.data;
    const avatarUrl = resolvePersistedAvatar();
    const hydratedUser = avatarUrl ? { ...newUser, avatarUrl } : newUser;

    // Save to state and localStorage
    setToken(newToken);
    setUser(hydratedUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(hydratedUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
