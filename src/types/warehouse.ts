export interface Warehouse {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
  isActive: boolean;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isMain?: boolean;
  shopId: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  isMain?: boolean;
  isActive?: boolean;
  shopId?: string;
}
