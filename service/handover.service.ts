import axiosInstance from "@/service/axios.service";
import type {
  CreateHandoverPayload,
  EligibleAgreementsResponse,
  HandoverResponse,
  HandoversListResponse,
  HandoversQuery,
  UpdateHandoverPayload,
} from "@/types/handover.types";

const BASE = "/api/handovers";

export const getHandovers = async (params: HandoversQuery): Promise<HandoversListResponse> => {
  const res = await axiosInstance.get<HandoversListResponse>(BASE, { params });
  return res.data;
};

export const getEligibleAgreements = async (): Promise<EligibleAgreementsResponse> => {
  const res = await axiosInstance.get<EligibleAgreementsResponse>(`${BASE}/eligible`);
  return res.data;
};

export const getHandoverById = async (id: string): Promise<HandoverResponse> => {
  const res = await axiosInstance.get<HandoverResponse>(`${BASE}/${id}`);
  return res.data;
};

export const createHandover = async (payload: CreateHandoverPayload): Promise<HandoverResponse> => {
  const res = await axiosInstance.post<HandoverResponse>(BASE, payload);
  return res.data;
};

export const updateHandover = async (
  id: string,
  payload: UpdateHandoverPayload,
): Promise<HandoverResponse> => {
  const res = await axiosInstance.put<HandoverResponse>(`${BASE}/${id}`, payload);
  return res.data;
};