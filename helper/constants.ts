import type { Role } from "@/types/auth.types";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  TENANT: "Tenant",
};

export const OTP_LENGTH = 6;
export const RESEND_SECONDS = 60;