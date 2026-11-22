"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

const COLLAPSE_KEY = "sidebar-collapsed";

function ShellSkeleton() {
  return (
    <div className="h-dvh overflow-hidden bg-slate-50">
      <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white md:block" />
      <div className="md:pl-64">
        <div className="h-16 border-b border-slate-200 bg-white" />
        <div className="flex items-center justify-center py-32">
          <i className="pi pi-spin pi-spinner text-3xl text-[#1e5aa8]" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // sidebar-er abosthha mone rakho
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // storage block thakle default-i thakbe
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  // page badlale mobile menu bondho
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // mobile menu khola thakle Esc diye bondho
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  if (loading || !user) return <ShellSkeleton />;

  return (
    <div className="h-dvh overflow-hidden bg-slate-50">
      <Sidebar
        role={user.role}
        user={user}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex h-dvh flex-col transition-all duration-300 ${
          collapsed ? "md:pl-[76px]" : "md:pl-64"
        }`}
      >
        <Navbar
          user={user}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={logout}
        />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
}