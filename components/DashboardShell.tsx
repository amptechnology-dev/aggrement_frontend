"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <i className="pi pi-spin pi-spinner text-3xl text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <Sidebar
        role={user.role}
        user={user}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`transition-all duration-300 ${collapsed ? "md:pl-20" : "md:pl-64"}`}>
        <Navbar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={logout}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
}