export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  shopId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierProduct {
  supplierId: string;
  productId: string;
  price: number;
  minimumOrder?: number;
  lastDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}
