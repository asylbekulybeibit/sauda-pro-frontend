export interface Barcode {
  id: string;
  code: string;
  productName: string;
  description?: string;
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name?: string;
  barcode?: Barcode;
  barcodes?: string[];
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  description?: string;
  categoryId?: string;
  isActive: boolean;
  isService: boolean;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  warehouseId: string;
  unit?: string;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
