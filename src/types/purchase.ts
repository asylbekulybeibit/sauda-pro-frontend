export interface Purchase {
  id: string;
  date: string;
  invoiceNumber: string;
  supplier: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    price: number;
    total: number;
    serialNumber?: string;
    expiryDate?: string;
    comment?: string;
  }>;
  totalAmount: number;
  totalItems?: number;
  comment?: string;
  status: 'draft' | 'completed' | 'cancelled';
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
