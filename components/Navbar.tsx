"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

const formatToday = (): string =>
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

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
  const [today, setToday] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const isTenant = user.role === "TENANT";
  const accountHref = isTenant ? "/tenant/profile" : "/dashboard/settings";
  const accountLabel = isTenant ? "My Profile" : "Settings";
  const showAccountLink = user.role !== "SUPER_ADMIN";

  // Client e set kora hocche, jate hydration mismatch na hoy
  useEffect(() => {
    setToday(formatToday());
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="amp-nb">
      {/* Left */}
      <div className="amp-nb__left">
        <button
          type="button"
          onClick={onOpenMobile}
          className="amp-nb__btn amp-nb__btn--mobile"
          aria-label="Open menu"
        >
          <i className="pi pi-bars" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="amp-nb__btn amp-nb__btn--desktop"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`pi ${collapsed ? "pi-angle-double-right" : "pi-angle-double-left"}`} />
        </button>

        <h1 className="amp-nb__title">{getPageTitle(pathname)}</h1>
      </div>

      {/* Right */}
      <div className="amp-nb__right">
        {today && (
          <div className="amp-nb__date">
            <i className="pi pi-calendar" />
            {today}
          </div>
        )}
        <div className="amp-nb__sep" aria-hidden="true" />

        <div className="amp-nb__user" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={cx("amp-nb__trigger", menuOpen && "is-open")}
          >
            <span className="amp-avatar">
              {user.name.charAt(0)}
              <span className="amp-avatar__dot" />
            </span>
            <span className="amp-nb__meta">
              <span className="amp-nb__name">{user.name}</span>
              <span className="amp-nb__role">{ROLE_LABELS[user.role]}</span>
            </span>
            <i className="pi pi-chevron-down amp-nb__chev" />
          </button>

          {menuOpen && (
            <div role="menu" className="amp-menu">
              <div className="amp-menu__head">
                <span className="amp-avatar amp-avatar--lg">{user.name.charAt(0)}</span>
                <div style={{ minWidth: 0 }}>
                  <p className="amp-menu__name">{user.name}</p>
                  <span className="amp-badge">{ROLE_LABELS[user.role]}</span>
                </div>
              </div>

              <div className="amp-menu__info">
                <p className="amp-menu__row">
                  <i className="pi pi-envelope" />
                  <span>{user.email}</span>
                </p>
                {user.phone && (
                  <p className="amp-menu__row">
                    <i className="pi pi-phone" />
                    <span>{user.phone}</span>
                  </p>
                )}
              </div>

              <div className="amp-menu__actions">
                {showAccountLink && (
                  <Link href={accountHref} role="menuitem" className="amp-menu__item">
                    <i className={`pi ${isTenant ? "pi-user" : "pi-cog"}`} />
                    {accountLabel}
                  </Link>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="amp-menu__item amp-menu__item--danger"
                >
                  <i className={`pi ${loggingOut ? "pi-spin pi-spinner" : "pi-sign-out"}`} />
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}