export type TransactionType = 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryTransaction {
  id: number;
  type: TransactionType;
  productId: number;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  quantity: number;
  price?: number;
  description?: string;
  comment?: string;
  shopId: number;
  createdAt: string;
  updatedAt: string;
}
