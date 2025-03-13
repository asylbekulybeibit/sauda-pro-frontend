export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  shopId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
