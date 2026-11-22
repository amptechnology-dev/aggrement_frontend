export interface PropertyOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  pin: string;
  city: string;
  state: string;
  location: string;
  lat: number;
  long: number;
  image: string;
  isActive: boolean;
  owner: PropertyOwner | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertiesQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface PropertiesListResponse {
  success: boolean;
  page: number;
  totalPages: number;
  total: number;
  properties: Property[];
}

export interface PropertyResponse {
  success: boolean;
  message: string;
  property: Property;
}