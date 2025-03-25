import { Product } from './product';

// Интерфейс пользователя для createdBy/updatedBy
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Для других возможных полей
}

export interface PurchaseItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  barcodes?: string[];
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  product?: Product;
  productId?: string;
}

export interface Purchase {
  id?: string;
  date: string;
  supplierId?: string;
  warehouseId: string;
  comment?: string;
  number?: string;
  items: PurchaseItem[];
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: 'draft' | 'completed' | 'cancelled';
  supplierName?: string;
  warehouseName?: string;
  invoiceNumber?: string;
  supplier?: {
    name: string;
    address?: string;
    phone?: string;
  };
  warehouse?: {
    name: string;
    id: string;
    address?: string;
  };
  createdBy?: string | User;
  createdById?: string;
  updatedBy?: string | User;
  updatedById?: string;
}

export interface PurchaseSummary {
  id: string;
  date: string;
  number?: string;
  supplierName?: string;
  warehouseName: string;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}
