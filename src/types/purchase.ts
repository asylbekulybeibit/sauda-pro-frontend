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
  }>;
  totalAmount: number;
  comment?: string;
  status: 'draft' | 'completed' | 'cancelled';
}
