export type TransactionType =
  | 'SALE'
  | 'PURCHASE'
  | 'ADJUSTMENT'
  | 'RETURN'
  | 'WRITE_OFF'
  | 'TRANSFER';

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
  note?: string;
  comment?: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}
