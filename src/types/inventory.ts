export type TransactionType = 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryTransaction {
  id: number;
  type: TransactionType;
  productId: number;
  quantity: number;
  price?: number;
  description?: string;
  shopId: number;
  createdAt: string;
  updatedAt: string;
}
