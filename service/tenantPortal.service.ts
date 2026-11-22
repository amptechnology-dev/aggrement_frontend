import axiosInstance from "@/service/axios.service";
import type {
  MyAgreementsResponse,
  MyHandoversResponse,
  TenantProfileResponse,
} from "@/types/tenantPortal.types";

const BASE = "/api/tenant-portal";

export const getMyProfile = async (): Promise<TenantProfileResponse> => {
  const res = await axiosInstance.get<TenantProfileResponse>(`${BASE}/profile`);
  return res.data;
};

export const getMyAgreements = async (): Promise<MyAgreementsResponse> => {
  const res = await axiosInstance.get<MyAgreementsResponse>(`${BASE}/agreements`);
  return res.data;
};

export const getMyHandovers = async (): Promise<MyHandoversResponse> => {
  const res = await axiosInstance.get<MyHandoversResponse>(`${BASE}/handovers`);
  return res.data;
};