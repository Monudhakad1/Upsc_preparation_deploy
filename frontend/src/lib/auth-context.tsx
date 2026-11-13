"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi, ApiError, clearSyllabusCache, setUnauthorizedHandler } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

const TOKEN_STORAGE_KEY = "upsc_mentor_token";
const USER_STORAGE_KEY = "upsc_mentor_user";

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

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

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    clearSyllabusCache();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // Any authed API call that comes back 401 (expired token) signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) {
        authApi.wakeUp(); // start the (possibly sleeping) backend while the user types
        setStatus("unauthenticated");
        return;
      }

      // Render immediately from the cached user instead of blocking the whole
      // app on /api/auth/me (which can take a while on a cold backend).
      const cachedUser = readCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        setToken(stored);
        setStatus("authenticated");
      }

      // Verify the token in the background. Only an explicit 401/403 signs out -
      // a network error (backend waking up) keeps the session.
      try {
        const me = await authApi.me(stored);
        if (cancelled) return;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
        setUser(me);
        setToken(stored);
        setStatus("authenticated");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          logout();
        } else if (!cachedUser) {
          setStatus("unauthenticated");
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const loggedInUser: AuthUser = {
      id: response.userId,
      email: response.email,
      displayName: response.displayName,
      role: response.role,
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
    setToken(response.token);
    setUser(loggedInUser);
    setStatus("authenticated");
    return loggedInUser;
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
