'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type {
  AuthUserSummary,
  LoginRequest,
  RegisterRequest,
} from '@orbit/types';
import { orbitApi } from '@/lib/api';

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUserSummary | null;
  sessionMessage: string | null;
  login: (input: LoginRequest) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: () => void;
  expireSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Sign in to continue.';

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUserSummary | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const applyAuthentication = useCallback(
    (authentication: Awaited<ReturnType<typeof orbitApi.login>>): void => {
      setAccessToken(authentication.accessToken);
      setUser(authentication.user);
      setSessionMessage(null);
    },
    [],
  );

  const login = useCallback(async (input: LoginRequest): Promise<void> => {
    applyAuthentication(await orbitApi.login(input));
  }, [applyAuthentication]);

  const register = useCallback(
    async (input: RegisterRequest): Promise<void> => {
      applyAuthentication(await orbitApi.register(input));
    },
    [applyAuthentication],
  );

  const logout = useCallback((): void => {
    setAccessToken(null);
    setUser(null);
    setSessionMessage(null);
  }, []);

  const expireSession = useCallback((): void => {
    setAccessToken(null);
    setUser(null);
    setSessionMessage(SESSION_EXPIRED_MESSAGE);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ accessToken, user, sessionMessage, login, register, logout, expireSession }),
    [accessToken, user, sessionMessage, login, register, logout, expireSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
