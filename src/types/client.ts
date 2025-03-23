export interface Client {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  discountPercent: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  discountPercent?: number;
  notes?: string;
}

export interface UpdateClientDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  discountPercent?: number;
  notes?: string;
  isActive?: boolean;
}
