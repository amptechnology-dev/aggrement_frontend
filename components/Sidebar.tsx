"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "@/helper/navigation";
import { ROLE_LABELS } from "@/helper/constants";
import type { AuthUser, Role } from "@/types/auth.types";

interface SidebarProps {
  role: Role;
  user: AuthUser;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ role, user, collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const hideOnCollapsed = collapsed ? "md:hidden" : "";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300 shadow-xl transition-all duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Brand */}
        <div
          className={`flex h-16 items-center gap-3 border-b border-white/10 px-4 ${
            collapsed ? "md:justify-center md:px-0" : ""
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
            <i className="pi pi-file-edit text-lg" />
          </div>
          <div className={`min-w-0 ${hideOnCollapsed}`}>
            <p className="truncate text-sm font-bold leading-tight text-white">Agreement</p>
            <p className="truncate text-[10px] uppercase tracking-widest text-teal-300">
              Management System
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 ${hideOnCollapsed}`}>
            Menu
          </p>

          {items.map((item) => {
            const active = isNavActive(pathname, item.href);
            const base = `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`;

            const icon = (
              <i
                className={`pi ${item.icon} text-base ${
                  active ? "text-white" : "text-slate-400 group-hover:text-teal-300"
                }`}
              />
            );

            if (item.soon) {
              return (
                <div
                  key={item.href}
                  aria-disabled="true"
                  title={`${item.label} (coming soon)`}
                  className={`${base} cursor-not-allowed text-slate-500`}
                >
                  <i className={`pi ${item.icon} text-base`} />
                  <span className={`flex-1 truncate ${hideOnCollapsed}`}>{item.label}</span>
                  <span className={`rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400 ${hideOnCollapsed}`}>
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={onCloseMobile}
                className={`${base} ${
                  active
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-900/30"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                {icon}
                <span className={`flex-1 truncate ${hideOnCollapsed}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ${collapsed ? "md:justify-center md:bg-transparent md:p-0" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-bold uppercase text-teal-300">
              {user.name.charAt(0)}
            </div>
            <div className={`min-w-0 ${hideOnCollapsed}`}>
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}