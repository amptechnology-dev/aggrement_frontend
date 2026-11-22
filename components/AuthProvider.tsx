"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMe, logoutApi } from "@/service/auth.service";
import { clearAuth } from "@/helper/authStorage";
import { getHomePath } from "@/helper/navigation";
import type { AuthUser, Role } from "@/types/auth.types";

export type Portal = "admin" | "tenant";

const PORTAL_ROLES: Record<Portal, readonly Role[]> = {
  admin: ["SUPER_ADMIN", "OWNER"],
  tenant: ["TENANT"],
};

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

interface AuthProviderProps {
  portal: Portal;
  children: ReactNode;
}

export default function AuthProvider({ portal, children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((res) => {
        if (cancelled) return;

        // onno portal-er role hole nijer home-e pathao
        if (!PORTAL_ROLES[portal].includes(res.user.role)) {
          window.location.href = getHomePath(res.user.role);
          return;
        }
        setUser(res.user);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        window.location.href = "/login";
      });

    return () => {
      cancelled = true;
    };
  }, [portal]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // API fail korleo local session muche felbo
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