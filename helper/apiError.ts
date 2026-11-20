import axios from "axios";
import type { ApiErrorResponse } from "@/types/auth.types";

export const getApiError = <E>(err: E): ApiErrorResponse | null =>
  axios.isAxiosError<ApiErrorResponse>(err) ? (err.response?.data ?? null) : null;

export const getErrorMessage = <E>(
  err: E,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(err) && !err.response) {
    return "Cannot reach the server. Check your connection.";
  }
  return getApiError(err)?.message ?? fallback;
};