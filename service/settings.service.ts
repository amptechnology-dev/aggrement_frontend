import axiosInstance from "@/service/axios.service";
import type {
  SettingsResponse,
  TermsResponse,
  UpdateSettingsPayload,
} from "@/types/settings.types";

const BASE = "/api/settings";

export const getSettings = async (): Promise<SettingsResponse> => {
  const res = await axiosInstance.get<SettingsResponse>(BASE);
  return res.data;
};

export const updateSettings = async (
  payload: UpdateSettingsPayload,
): Promise<SettingsResponse> => {
  const res = await axiosInstance.put<SettingsResponse>(BASE, payload);
  return res.data;
};

export const addTerm = async (text: string): Promise<TermsResponse> => {
  const res = await axiosInstance.post<TermsResponse>(`${BASE}/terms`, { text });
  return res.data;
};

export const updateTerm = async (id: string, text: string): Promise<TermsResponse> => {
  const res = await axiosInstance.put<TermsResponse>(`${BASE}/terms/${id}`, { text });
  return res.data;
};

export const deleteTerm = async (id: string): Promise<TermsResponse> => {
  const res = await axiosInstance.delete<TermsResponse>(`${BASE}/terms/${id}`);
  return res.data;
};