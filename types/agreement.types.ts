import type { GuardianRelation } from "@/types/tenant.types";
import type { AgreementRules } from "@/types/settings.types";

export type AgreementStatus = "ACTIVE" | "TERMINATED" | "EXPIRED";

export interface RentPeriod {
  period: number;
  from: string;
  to: string;
  monthlyRent: number;
  increasePercent: number;
}

export interface AgreementTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianRelation: GuardianRelation;
  voterCardNo: string;
  address: string;
}

export interface AgreementStall {
  id: string;
  propertyId: string;
  stallNo: string;
  propertyName: string;
  propertyAddress: string;
}

export interface AgreementOwner {
  id: string;
  name: string;
  phone: string;
}

export interface Agreement extends AgreementRules {
  id: string;
  agreementNo: string;
  status: AgreementStatus;
  isExpired: boolean;
  agreementDate: string;
  effectiveFrom: string;
  endDate: string;
  office: { name: string; address: string };
  tenant: AgreementTenant;
  stall: AgreementStall;
  monthlyRent: number;
  currentRent: number;
  depositAmount: number;
  terms: string[];
  schedule?: RentPeriod[];
  terminatedAt: string | null;
  terminationReason: string | null;
  owner: AgreementOwner | null;
  createdAt: string;
}

export interface AgreementsQuery {
  page: number;
  limit: number;
  search?: string;
  status?: AgreementStatus;
}

export interface AgreementsListResponse {
  success: boolean;
  page: number;
  totalPages: number;
  total: number;
  agreements: Agreement[];
}

export interface AgreementResponse {
  success: boolean;
  message: string;
  newTermsSaved?: number;
  agreement: Agreement;
}

export interface CreateAgreementPayload extends AgreementRules {
  tenantId: string;
  stallId: string;
  agreementDate: string;
  effectiveFrom: string;
  monthlyRent: number;
  depositAmount: number;
  guardianRelation: GuardianRelation;
  voterCardNo: string;
  officeName: string;
  officeAddress: string;
  terms: string[];
}