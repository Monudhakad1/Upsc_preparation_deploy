"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi, ApiError } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

const TOKEN_STORAGE_KEY = "upsc_mentor_token";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// NOTE (Phase 1 tradeoff): the JWT lives in localStorage for simplicity.
// It is a bearer token, not "preparation data" (spec section 1 is about
// syllabus/revision data always living in Postgres, which it does), but
// localStorage is readable by any script on the page. A future phase can
// swap this for an httpOnly cookie set via a Next.js route handler without
// touching any component that calls useAuth().
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }
      try {
        const me = await authApi.me(stored);
        if (cancelled) return;
        setUser(me);
        setToken(stored);
        setStatus("authenticated");
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (!cancelled) setStatus("unauthenticated");
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const loggedInUser: AuthUser = {
      id: response.userId,
      email: response.email,
      displayName: response.displayName,
      role: response.role,
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(loggedInUser);
    setStatus("authenticated");
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, token, status, login, logout }),
    [user, token, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiError };
