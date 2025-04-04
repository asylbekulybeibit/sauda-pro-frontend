export interface SalesHistoryFilters {
  startDate?: string;
  endDate?: string;
  receiptType?: string;
  cashierId?: string;
  clientId?: string;
  vehicleId?: string;
  search?: string;
  paymentMethod?: string;
}

export interface SalesHistoryResponse {
  id: string;
  number: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod?: {
    id: string;
    name: string;
  };
  cashier?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    id: string;
    name: string;
  };
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    amount: number;
  }>;
}

export interface SalesReceiptDetails {
  id: string;
  number: string;
  createdAt: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  cashier: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    id: string;
    name: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    amount: number;
  }>;
}
