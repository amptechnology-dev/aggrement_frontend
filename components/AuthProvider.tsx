"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMe, logoutApi } from "@/service/auth.service";
import { clearAuth } from "@/helper/authStorage";
import type { AuthUser } from "@/types/auth.types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const redirectToLogin = () => {
      clearAuth();
      window.location.href = "/login";
    };

    getMe()
      .then((res) => {
        if (cancelled) return;
        if (res.user.role === "TENANT") {
          redirectToLogin();
          return;
        }
        setUser(res.user);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) redirectToLogin();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      
    }
    clearAuth();
    window.location.href = "/login";
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, logout }),
    [user, loading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}