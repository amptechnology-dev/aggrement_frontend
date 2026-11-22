"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "@/helper/navigation";
import type { NavItem } from "@/helper/navigation";
import { ROLE_LABELS } from "@/helper/constants";
import type { AuthUser, Role } from "@/types/auth.types";

interface SidebarProps {
  role: Role;
  user: AuthUser;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

type SectionTitle = "Overview" | "Management" | "Operations" | "Account" | "Menu";

const SECTION_ORDER: readonly SectionTitle[] = [
  "Overview",
  "Management",
  "Operations",
  "Account",
  "Menu",
];

const SECTION_BY_HREF: Record<string, SectionTitle> = {
  "/dashboard": "Overview",
  "/tenant": "Overview",

  "/dashboard/owners": "Management",
  "/dashboard/properties": "Management",
  "/dashboard/stalls": "Management",
  "/dashboard/tenants": "Management",

  "/dashboard/agreements": "Operations",
  "/dashboard/handovers": "Operations",
  "/tenant/agreements": "Operations",
  "/tenant/handover": "Operations",

  "/dashboard/settings": "Account",
  "/tenant/profile": "Account",
};

interface NavSection {
  title: SectionTitle;
  items: NavItem[];
}

const groupItems = (items: NavItem[]): NavSection[] =>
  SECTION_ORDER.map((title) => ({
    title,
    items: items.filter((i) => (SECTION_BY_HREF[i.href] ?? "Menu") === title),
  })).filter((section) => section.items.length > 0);

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

export default function Sidebar({
  role,
  user,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [logoFailed, setLogoFailed] = useState(false);

  const sections = groupItems(NAV_ITEMS.filter((item) => item.roles.includes(role)));

  return (
    <>
      {mobileOpen && <div className="amp-overlay" onClick={onCloseMobile} aria-hidden="true" />}

      <aside
        aria-label="Sidebar"
        className={cx("amp-sb", collapsed && "is-collapsed", mobileOpen && "is-open")}
      >
        {/* Brand */}
        <div className="amp-sb__brand">
          <div className="amp-sb__logo">
            {logoFailed ? (
              <span>AMP</span>
            ) : (
              <Image
                src="/logo.png"
                alt="AMP Technology"
                width={28}
                height={28}
                priority
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>

          <div className="amp-sb__brandtext amp-hide">
            <p className="amp-sb__title">Agreement</p>
            <p className="amp-sb__sub">Management</p>
          </div>

          <button
            type="button"
            className="amp-sb__close"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <i className="pi pi-times" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="amp-sb__nav">
          {sections.map((section, index) => (
            <div key={section.title} className="amp-sb__section">
              {index > 0 && <div className="amp-sb__divider" aria-hidden="true" />}
              <p className="amp-sb__label amp-hide">{section.title}</p>

              <ul className="amp-sb__list">
                {section.items.map((item) => {
                  const active = isNavActive(pathname, item.href);

                  if (item.soon) {
                    return (
                      <li key={item.href}>
                        <div
                          aria-disabled="true"
                          title={`${item.label} (coming soon)`}
                          className="amp-sb__link is-disabled"
                        >
                          <span className="amp-sb__icon">
                            <i className={`pi ${item.icon}`} />
                          </span>
                          <span className="amp-sb__text amp-hide">{item.label}</span>
                          <span className="amp-sb__soon amp-hide">Soon</span>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={item.label}
                        aria-current={active ? "page" : undefined}
                        onClick={onCloseMobile}
                        className={cx("amp-sb__link", active && "is-active")}
                      >
                        <span className="amp-sb__icon">
                          <i className={`pi ${item.icon}`} />
                        </span>
                        <span className="amp-sb__text amp-hide">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="amp-sb__user">
          <div className="amp-sb__usercard">
            <div className="amp-avatar">
              {user.name.charAt(0)}
              <span className="amp-avatar__dot" />
            </div>
            <div className="amp-sb__userinfo amp-hide">
              <p className="amp-sb__username">{user.name}</p>
              <p className="amp-sb__userrole">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}