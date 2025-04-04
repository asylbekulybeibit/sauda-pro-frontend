export interface SalesHistoryFilters {
  startDate?: string;
  endDate?: string;
  receiptType?: string;
  cashierId?: string;
  clientId?: string;
  vehicleId?: string;
  search?: string;
}

export interface SalesHistoryResponse {
  id: string;
  number: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: {
    id: string;
    name: string;
  };
  cashier?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
  };
  vehicle?: {
    id: string;
    number: string;
  };
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    amount: number;
    serviceStaff?: {
      id: string;
      name: string;
    };
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
    name: string;
  };
  vehicle?: {
    id: string;
    number: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    amount: number;
  }>;
}
