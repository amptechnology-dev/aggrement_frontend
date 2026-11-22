import type { ReactNode } from "react";
import AuthProvider from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider portal="tenant">
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}