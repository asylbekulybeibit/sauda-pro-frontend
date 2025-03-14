export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  barcodes?: string[];
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  description?: string;
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shopId: string;
}
