export interface HandoverTenant {
  id: string;
  name: string;
}

export interface HandoverStall {
  id: string;
  propertyId: string;
  stallNo: string;
  propertyName: string;
}

export interface HandoverOwner {
  id: string;
  name: string;
  phone: string;
}

export interface Handover {
  id: string;
  agreementId: string;
  agreementNo: string;
  tenant: HandoverTenant;
  stall: HandoverStall;
  numberOfKeys: number;
  handoverDate: string;
  remarks: string;
  owner: HandoverOwner | null;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleAgreement {
  id: string;
  agreementNo: string;
  agreementDate: string;
  effectiveFrom: string;
  tenantName: string;
  tenantPhone: string;
  stallNo: string;
  propertyName: string;
  defaultKeys: number;
}

export interface HandoversQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface HandoversListResponse {
  success: boolean;
  page: number;
  totalPages: number;
  total: number;
  handovers: Handover[];
}

export interface HandoverResponse {
  success: boolean;
  message: string;
  handover: Handover;
}

export interface EligibleAgreementsResponse {
  success: boolean;
  agreements: EligibleAgreement[];
}

export interface UpdateHandoverPayload {
  numberOfKeys: number;
  handoverDate: string;
  remarks: string;
}

export interface CreateHandoverPayload extends UpdateHandoverPayload {
  agreementId: string;
}