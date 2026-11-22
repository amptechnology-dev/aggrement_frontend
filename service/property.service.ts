import axiosInstance from "@/service/axios.service";
import type { MessageResponse } from "@/types/auth.types";
import type {
  PropertiesListResponse,
  PropertiesQuery,
  PropertyResponse,
} from "@/types/property.types";

const BASE = "/api/properties";
const UPLOAD_TIMEOUT = 60000;

export const getProperties = async (
  params: PropertiesQuery,
): Promise<PropertiesListResponse> => {
  const res = await axiosInstance.get<PropertiesListResponse>(BASE, { params });
  return res.data;
};

export const createProperty = async (formData: FormData): Promise<PropertyResponse> => {
  const res = await axiosInstance.post<PropertyResponse>(BASE, formData, {
    timeout: UPLOAD_TIMEOUT,
  });
  return res.data;
};

export const updateProperty = async (
  id: string,
  formData: FormData,
): Promise<PropertyResponse> => {
  const res = await axiosInstance.put<PropertyResponse>(`${BASE}/${id}`, formData, {
    timeout: UPLOAD_TIMEOUT,
  });
  return res.data;
};

export const updatePropertyStatus = async (
  id: string,
  isActive: boolean,
): Promise<MessageResponse> => {
  const res = await axiosInstance.patch<MessageResponse>(`${BASE}/${id}/status`, {
    isActive,
  });
  return res.data;
};