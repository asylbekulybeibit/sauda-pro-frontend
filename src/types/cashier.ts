export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
  price: number;
  quantity: number;
  isService: boolean;
}

export interface CashRegister {
  id: string;
  name: string;
  type?: string;
  location?: string;
  status?: string;
}

export interface CashShift {
  id: string;
  startTime: string;
  endTime?: string;
  initialAmount: number | string;
  currentAmount: number | string;
  finalAmount?: number | string;
  status: 'OPEN' | 'CLOSED' | 'INTERRUPTED';
  cashRegister: {
    id: string;
    name: string;
  };
  cashier: {
    id: string;
    name: string;
  };
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  amount: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  type: 'product' | 'service';
  warehouseProductId?: string;
  serviceId?: string;
  serverItemId?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  number: string;
  date: string;
  createdAt: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  receivedAmount?: number;
  status: 'created' | 'paid' | 'cancelled' | 'refunded' | 'PAID' | 'CANCELLED';
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'mixed' | 'CASH' | 'CARD';
  paymentMethodId?: string;
  returnedFromReceiptNumber?: string;
  items: ReceiptItem[];
  cashier?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export type PaymentMethodType = 'cash' | 'card' | 'qr';

export interface PaymentData {
  paymentMethod: PaymentMethodType;
  amount: number;
}

export interface CurrentReceipt extends Receipt {
  receiptItems: ReceiptItem[];
}

export interface ShiftPaymentMethodTotal {
  methodId: string;
  methodName: string;
  sales: number;
  returns: number;
  total: number;
}

export interface ShiftClosingData {
  id: string;
  warehouse: {
    id: string;
    name: string;
  };
  cashRegister: {
    id: string;
    name: string;
  };
  cashier: {
    id: string;
    name: string;
    fullName?: string;
  };
  startTime: string;
  endTime: string;
  initialAmount: number;
  finalAmount: number;
  status: string;
  notes?: string;
  totalSales: number;
  totalReturns: number;
  totalNet: number;
  paymentMethods: ShiftPaymentMethodTotal[];
}
