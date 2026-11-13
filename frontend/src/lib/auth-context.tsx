"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  ApiError,
  clearSyllabusCache,
  setUnauthorizedHandler,
  setViewingAspirantId,
} from "@/lib/api";
import type { AuthUser, LoginApiResponse } from "@/types/auth";

const TOKEN_STORAGE_KEY = "upsc_mentor_token";
const USER_STORAGE_KEY = "upsc_mentor_user";
const VIEWING_STORAGE_KEY = "upsc_mentor_viewing";

/** The aspirant a mentor is currently looking at. */
export interface ViewingAspirant {
  id: string;
  displayName: string;
}

function readViewing(): ViewingAspirant | null {
  try {
    const raw = localStorage.getItem(VIEWING_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ViewingAspirant) : null;
  } catch {
    return null;
  }
}

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
  register: (displayName: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  /** Mentor only: whose preparation data the app is showing. */
  viewing: ViewingAspirant | null;
  setViewing: (aspirant: ViewingAspirant | null) => void;
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
  const [viewing, setViewingState] = useState<ViewingAspirant | null>(null);

  const setViewing = useCallback((aspirant: ViewingAspirant | null) => {
    // Update the API scope first so the next fetch already targets this aspirant.
    setViewingAspirantId(aspirant?.id ?? null);
    try {
      if (aspirant) localStorage.setItem(VIEWING_STORAGE_KEY, JSON.stringify(aspirant));
      else localStorage.removeItem(VIEWING_STORAGE_KEY);
    } catch {
      // storage unavailable - selection just won't survive a reload
    }
    setViewingState(aspirant);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(VIEWING_STORAGE_KEY);
    setViewingAspirantId(null);
    setViewingState(null);
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
      const storedViewing = readViewing();
      if (storedViewing) {
        setViewingAspirantId(storedViewing.id);
        setViewingState(storedViewing);
      }
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

  const startSession = useCallback((response: LoginApiResponse) => {
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

  const login = useCallback(
    async (email: string, password: string) => startSession(await authApi.login(email, password)),
    [startSession]
  );

  const register = useCallback(
    async (displayName: string, email: string, password: string) =>
      startSession(await authApi.register(displayName, email, password)),
    [startSession]
  );

  const value = useMemo(
    () => ({ user, token, status, login, register, logout, viewing, setViewing }),
    [user, token, status, login, register, logout, viewing, setViewing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiError };
