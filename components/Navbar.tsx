"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getPageTitle } from "@/helper/navigation";
import { ROLE_LABELS } from "@/helper/constants";
import type { AuthUser } from "@/types/auth.types";

interface NavbarProps {
  user: AuthUser;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
  onLogout: () => Promise<void>;
}

export default function Navbar({
  user,
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  onLogout,
}: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await onLogout();
  };

  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-teal-600";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onOpenMobile} className={`${iconBtn} md:hidden`} aria-label="Open menu">
          <i className="pi pi-bars" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`${iconBtn} hidden md:flex`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`pi ${collapsed ? "pi-angle-double-right" : "pi-angle-double-left"}`} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{getPageTitle(pathname)}</h1>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-3 transition hover:border-teal-300"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-sm font-bold uppercase text-white">
            {user.name.charAt(0)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[140px] truncate text-sm font-semibold text-slate-800">{user.name}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-teal-600">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
          <i className="pi pi-chevron-down text-[10px] text-slate-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <p className="mt-0.5 text-xs text-slate-500">{user.phone}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              <i className={`pi ${loggingOut ? "pi-spin pi-spinner" : "pi-sign-out"}`} />
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}