import axios, { AxiosError } from "axios";
import { AUTH_TOKEN_KEY, clearAuth } from "@/helper/authStorage";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 20000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    const isAuthCall = url.includes("/api/auth/send-otp") || url.includes("/api/auth/verify-otp");

    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !isAuthCall &&
      window.location.pathname !== "/login"
    ) {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;