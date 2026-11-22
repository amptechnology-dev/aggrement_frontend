import axiosInstance from "@/service/axios.service";
import type { MessageResponse } from "@/types/auth.types";
import type {
  StallResponse,
  StallsListResponse,
  StallsQuery,
} from "@/types/stall.types";

const BASE = "/api/stalls";
const UPLOAD_TIMEOUT = 60000;

export const getStalls = async (params: StallsQuery): Promise<StallsListResponse> => {
  const res = await axiosInstance.get<StallsListResponse>(BASE, { params });
  return res.data;
};

export const createStall = async (formData: FormData): Promise<StallResponse> => {
  const res = await axiosInstance.post<StallResponse>(BASE, formData, {
    timeout: UPLOAD_TIMEOUT,
  });
  return res.data;
};

export const updateStall = async (id: string, formData: FormData): Promise<StallResponse> => {
  const res = await axiosInstance.put<StallResponse>(`${BASE}/${id}`, formData, {
    timeout: UPLOAD_TIMEOUT,
  });
  return res.data;
};

export const updateStallStatus = async (
  id: string,
  isActive: boolean,
): Promise<MessageResponse> => {
  const res = await axiosInstance.patch<MessageResponse>(`${BASE}/${id}/status`, { isActive });
  return res.data;
};