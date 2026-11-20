import type { Role } from "@/types/auth.types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "pi-th-large", roles: ["SUPER_ADMIN", "OWNER"] },
  { label: "Owners", href: "/dashboard/owners", icon: "pi-id-card", roles: ["SUPER_ADMIN"] },
  { label: "Properties", href: "/dashboard/properties", icon: "pi-building", roles: ["OWNER"], soon: true },
  { label: "Stalls", href: "/dashboard/stalls", icon: "pi-shop", roles: ["OWNER"], soon: true },
  { label: "Tenants", href: "/dashboard/tenants", icon: "pi-users", roles: ["OWNER"], soon: true },
  { label: "Agreements", href: "/dashboard/agreements", icon: "pi-file-edit", roles: ["OWNER"], soon: true },
  { label: "Handovers", href: "/dashboard/handovers", icon: "pi-key", roles: ["OWNER"], soon: true },
];

export const isNavActive = (pathname: string, href: string): boolean =>
  href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

export const getPageTitle = (pathname: string): string => {
  const match = NAV_ITEMS.filter((i) => isNavActive(pathname, i.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return match?.label ?? "Dashboard";
};