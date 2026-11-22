import type { Role } from "@/types/auth.types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  // Super Admin ar Owner
  { label: "Dashboard", href: "/dashboard", icon: "pi-th-large", roles: ["SUPER_ADMIN", "OWNER"] },
  { label: "Owners", href: "/dashboard/owners", icon: "pi-id-card", roles: ["SUPER_ADMIN"] },
  { label: "Properties", href: "/dashboard/properties", icon: "pi-building", roles: ["OWNER"] },
  { label: "Stalls", href: "/dashboard/stalls", icon: "pi-shop", roles: ["OWNER"] },
  { label: "Tenants", href: "/dashboard/tenants", icon: "pi-users", roles: ["OWNER"] },
  { label: "Agreements", href: "/dashboard/agreements", icon: "pi-file-edit", roles: ["OWNER", "SUPER_ADMIN"] },
  { label: "Handovers", href: "/dashboard/handovers", icon: "pi-key", roles: ["OWNER", "SUPER_ADMIN"] },
  { label: "Settings", href: "/dashboard/settings", icon: "pi-cog", roles: ["OWNER"] },

  // Tenant
  { label: "Home", href: "/tenant", icon: "pi-home", roles: ["TENANT"] },
  { label: "My Agreements", href: "/tenant/agreements", icon: "pi-file-edit", roles: ["TENANT"] },
  { label: "Handover", href: "/tenant/handover", icon: "pi-key", roles: ["TENANT"] },
  { label: "My Profile", href: "/tenant/profile", icon: "pi-user", roles: ["TENANT"] },
];

const ROOT_PATHS: readonly string[] = ["/dashboard", "/tenant"];

export const isNavActive = (pathname: string, href: string): boolean =>
  ROOT_PATHS.includes(href)
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

export const getPageTitle = (pathname: string): string => {
  const match = NAV_ITEMS.filter((i) => isNavActive(pathname, i.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  return match?.label ?? "Dashboard";
};

export const getHomePath = (role: Role): string => (role === "TENANT" ? "/tenant" : "/dashboard");