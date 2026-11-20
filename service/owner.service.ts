import axiosInstance from "@/service/axios.service";
import type { MessageResponse } from "@/types/auth.types";
import type {
  CreateOwnerPayload,
  CreateOwnerResponse,
  OwnerResponse,
  OwnersListResponse,
  OwnersQuery,
} from "@/types/owner.types";

const BASE = "/api/super-admin/owners";

export const getOwners = async (params: OwnersQuery): Promise<OwnersListResponse> => {
  const res = await axiosInstance.get<OwnersListResponse>(BASE, { params });
  return res.data;
};

export const getOwnerById = async (ownerId: string): Promise<OwnerResponse> => {
  const res = await axiosInstance.get<OwnerResponse>(`${BASE}/${ownerId}`);
  return res.data;
};

export const createOwner = async (payload: CreateOwnerPayload): Promise<CreateOwnerResponse> => {
  const res = await axiosInstance.post<CreateOwnerResponse>(BASE, payload);
  return res.data;
};

export const updateOwnerStatus = async (
  ownerId: string,
  isActive: boolean,
): Promise<MessageResponse> => {
  const res = await axiosInstance.patch<MessageResponse>(`${BASE}/${ownerId}/status`, { isActive });
  return res.data;
};