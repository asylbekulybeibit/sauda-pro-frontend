export interface PriceHistory {
  id: string;
  productId: string;
  warehouseProductId: string;
  oldPrice: number;
  newPrice: number;
  reason?: string;
  changedBy: string;
  shopId: string;
  createdAt: string;
  priceType?: 'purchase' | 'selling';
  product?: {
    id: string;
    name: string;
    [key: string]: any;
  };
  changedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  change?: string;
  formattedChange?: string;
}
