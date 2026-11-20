export interface Owner {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
}

export interface OwnersQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface OwnersListResponse {
  success: boolean;
  page: number;
  totalPages: number;
  total: number;
  owners: Owner[];
}

export interface OwnerResponse {
  success: boolean;
  owner: Owner;
}

export interface CreateOwnerPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CreateOwnerResponse {
  success: boolean;
  message: string;
  owner: Owner;
}