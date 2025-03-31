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
  productId: string;
  name: string;
  barcode?: string;
  barcodes?: string[];
  purchasePrice: number;
  price?: number;
  sellingPrice: number;
  quantity: number;
  comment?: string;
  product?: Product;
  total?: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId?: string;
  warehouseId: string;
  comment?: string;
  number?: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payments?: Array<{
    paymentMethodId: string;
    amount: number;
    note?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  status?: 'draft' | 'completed' | 'cancelled';
  supplierName?: string;
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

export interface PurchasePayment {
  paymentMethodId: string;
  amount: number;
  note?: string;
}
