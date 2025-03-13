export interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  reason?: string;
  changedBy: string;
  shopId: string;
  createdAt: string;
}
