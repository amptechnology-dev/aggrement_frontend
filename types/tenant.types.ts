export type GuardianRelation = "FATHER" | "HUSBAND";

export interface TenantOwner {
  id: string;
  name: string;
  phone: string;
}

export interface Tenant {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianRelation: GuardianRelation | null;
  address: string;
  voterCardNo: string | null;
  isActive: boolean;
  owner: TenantOwner | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantsQuery {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
}

export interface TenantsListResponse {
  success: boolean;
  page: number;
  totalPages: number;
  total: number;
  tenants: Tenant[];
}

export interface TenantResponse {
  success: boolean;
  message: string;
  tenant: Tenant;
}

export interface UpdateTenantPayload {
  name: string;
  guardianName: string;
  guardianRelation: GuardianRelation | "";
  address: string;
  voterCardNo: string;
}

export interface CreateTenantPayload extends UpdateTenantPayload {
  email: string;
  phone: string;
}