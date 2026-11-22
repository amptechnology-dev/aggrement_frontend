import axiosInstance from "@/service/axios.service";
import type { MessageResponse } from "@/types/auth.types";
import type {
  AgreementResponse,
  AgreementsListResponse,
  AgreementsQuery,
  CreateAgreementPayload,
} from "@/types/agreement.types";

const BASE = "/api/agreements";

export const getAgreements = async (
  params: AgreementsQuery,
): Promise<AgreementsListResponse> => {
  const res = await axiosInstance.get<AgreementsListResponse>(BASE, { params });
  return res.data;
};

export const getAgreementById = async (id: string): Promise<AgreementResponse> => {
  const res = await axiosInstance.get<AgreementResponse>(`${BASE}/${id}`);
  return res.data;
};

export const createAgreement = async (
  payload: CreateAgreementPayload,
): Promise<AgreementResponse> => {
  const res = await axiosInstance.post<AgreementResponse>(BASE, payload);
  return res.data;
};

export const terminateAgreement = async (
  id: string,
  reason: string,
): Promise<MessageResponse> => {
  const res = await axiosInstance.patch<MessageResponse>(`${BASE}/${id}/terminate`, {
    reason,
  });
  return res.data;
};