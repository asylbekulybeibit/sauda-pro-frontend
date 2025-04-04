export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  warehouses: Array<{
    id: string;
    name: string;
    address?: string;
  }>;
  type?: string;
}

export interface CreateShopDto {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateShopDto {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}
