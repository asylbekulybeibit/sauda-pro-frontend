export interface ServiceType {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceTypeDto {
  name: string;
  description?: string;
  price: number;
}

export interface UpdateServiceTypeDto {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
}
