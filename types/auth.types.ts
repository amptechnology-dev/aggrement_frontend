export type Role = "SUPER_ADMIN" | "OWNER" | "TENANT";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  retryAfter?: number;
  attemptsLeft?: number;
  requireRole?: boolean;
  roles?: Role[];
  errors?: FieldError[];
}

export interface SendOtpPayload {
  email: string;
  role?: Role;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  requireRole?: boolean;
  roles?: Role[];
  role?: Role;
  expiresInSeconds?: number;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  role?: Role;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  success: boolean;
  user: AuthUser;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}