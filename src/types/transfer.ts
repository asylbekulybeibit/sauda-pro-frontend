export interface Transfer {
  id: number;
  fromShopId: string;
  toShopId: string;
  date: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  items: TransferItem[];
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferItem {
  productId: number;
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  comment?: string;
}

export interface CreateTransferDto {
  fromShopId: string;
  toShopId: string;
  date: string;
  items: Array<{
    productId: number;
    quantity: number;
    comment?: string;
  }>;
  comment?: string;
}
