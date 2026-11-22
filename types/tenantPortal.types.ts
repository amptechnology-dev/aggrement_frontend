import type { AuthUser } from "@/types/auth.types";
import type { Agreement } from "@/types/agreement.types";
import type { Handover } from "@/types/handover.types";
import type { GuardianRelation } from "@/types/tenant.types";

export interface TenantProfileOwner {
  id: string;
  name: string;
  phone: string;
}

export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianRelation: GuardianRelation | null;
  address: string;
  voterCardNo: string | null;
  isActive: boolean;
  owner: TenantProfileOwner | null;
}

export interface TenantProfileResponse {
  success: boolean;
  user: AuthUser;
  profiles: TenantProfile[];
}

export interface MyAgreementsResponse {
  success: boolean;
  total: number;
  agreements: Agreement[];
}

export interface MyHandoversResponse {
  success: boolean;
  total: number;
  handovers: Handover[];
}