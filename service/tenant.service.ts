import axiosInstance from "@/service/axios.service";
import type { MessageResponse } from "@/types/auth.types";
import type {
  CreateTenantPayload,
  TenantResponse,
  TenantsListResponse,
  TenantsQuery,
  UpdateTenantPayload,
} from "@/types/tenant.types";

const BASE = "/api/tenants";

export const getTenants = async (params: TenantsQuery): Promise<TenantsListResponse> => {
  const res = await axiosInstance.get<TenantsListResponse>(BASE, { params });
  return res.data;
};

export const createTenant = async (payload: CreateTenantPayload): Promise<TenantResponse> => {
  const res = await axiosInstance.post<TenantResponse>(BASE, payload);
  return res.data;
};

export const updateTenant = async (
  id: string,
  payload: UpdateTenantPayload,
): Promise<TenantResponse> => {
  const res = await axiosInstance.put<TenantResponse>(`${BASE}/${id}`, payload);
  return res.data;
};

export const updateTenantStatus = async (
  id: string,
  isActive: boolean,
): Promise<MessageResponse> => {
  const res = await axiosInstance.patch<MessageResponse>(`${BASE}/${id}/status`, { isActive });
  return res.data;
};