export type StallStatus = "VACANT" | "OCCUPIED";

export interface StallProperty {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface StallOwner {
  id: string;
  name: string;
  phone: string;
}

export interface Stall {
  id: string;
  stallNo: string;
  numberOfKeys: number | null;
  image: string | null;
  status: StallStatus;
  isActive: boolean;
  property: StallProperty | null;
  owner: StallOwner | null;
  createdAt: string;
  updatedAt: string;
}

export interface StallsQuery {
  page: number;
  limit: number;
  search?: string;
  propertyId?: string;
  status?: StallStatus;
}

export interface StallsListResponse {
  success: boolean;
  page: number;
  totalPages: number;
  total: number;
  stalls: Stall[];
}

export interface StallResponse {
  success: boolean;
  message: string;
  stall: Stall;
}