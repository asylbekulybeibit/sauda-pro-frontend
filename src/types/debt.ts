import { Purchase } from './purchase';
import { Supplier } from './supplier';
import { User } from './user';

export enum DebtType {
  PAYABLE = 'payable',
  RECEIVABLE = 'receivable',
}

export enum DebtStatus {
  ACTIVE = 'active',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export interface Debt {
  id: string;
  type: DebtType;
  status: DebtStatus;
  warehouseId: string;
  supplierId?: string;
  supplier?: Supplier;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  purchaseId?: string;
  purchase?: Purchase;
  comment?: string;
  createdById: string;
  createdBy?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  paymentMethodId: string;
  amount: number;
  note?: string;
}

export interface DebtStatistics {
  totalPayable: number;
  totalReceivable: number;
  activeDebtsCount: number;
  partiallyPaidCount: number;
  paidDebtsCount: number;
}
