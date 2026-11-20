import axiosInstance from "@/service/axios.service";
import type {
  MeResponse,
  MessageResponse,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/types/auth.types";

export const sendOtp = async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
  const res = await axiosInstance.post<SendOtpResponse>("/api/auth/send-otp", payload);
  return res.data;
};

export const verifyOtp = async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
  const res = await axiosInstance.post<VerifyOtpResponse>("/api/auth/verify-otp", payload);
  return res.data;
};

export const getMe = async (): Promise<MeResponse> => {
  const res = await axiosInstance.get<MeResponse>("/api/auth/me");
  return res.data;
};

export const logoutApi = async (): Promise<MessageResponse> => {
  const res = await axiosInstance.post<MessageResponse>("/api/auth/logout");
  return res.data;
};