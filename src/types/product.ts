export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  minQuantity: number;
  barcode?: string;
  categoryId?: number;
  category?: Category;
  shopId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  shopId: number;
  createdAt: string;
  updatedAt: string;
}
