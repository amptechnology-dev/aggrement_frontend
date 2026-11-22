"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import "primeicons/primeicons.css";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "@/components/AuthProvider"; // tomar path e adjust koro

const STORAGE_KEY = "sidebarCollapsed";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  if (loading || !user) {
    return (
      <div style={{ display: "grid", minHeight: "100vh", placeItems: "center" }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: 28, color: "#1e5aa8" }} />
      </div>
    );
  }

  return (
    <div className="amp-shell">
      <Sidebar
        role={user.role}
        user={user}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`amp-main${collapsed ? " is-collapsed" : ""}`}>
        <Navbar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={logout}
        />
        <main className="amp-content">{children}</main>
      </div>
    </div>
  );
}