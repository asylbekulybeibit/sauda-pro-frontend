/**
 * Типы касс
 */
export type RegisterType = 'STATIONARY' | 'MOBILE' | 'EXPRESS';

/**
 * Статусы касс
 */
export type RegisterStatus = 'active' | 'inactive' | 'maintenance';

/**
 * Методы оплаты, поддерживаемые кассой
 */
export type PaymentMethod = {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'online' | 'other';
  isActive: boolean;
};

/**
 * Модель кассового аппарата
 */
export interface CashRegister {
  id: string;
  warehouseId: string;
  name: string;
  type: RegisterType;
  location?: string;
  status: RegisterStatus;
  paymentMethods: RegisterPaymentMethod[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Статус смены
 */
export type ShiftStatus = 'open' | 'closed' | 'paused';

/**
 * Модель смены
 */
export interface Shift {
  id: string;
  warehouseId: string;
  registerId: string;
  registerName: string;
  cashierId: string;
  cashierName: string;
  openedBy?: { name: string };
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  totalSales?: number;
  totalRefunds?: number;
  totalCash?: number;
  totalNonCash?: number;
}

export enum CashRegisterType {
  STATIONARY = 'STATIONARY',
  MOBILE = 'MOBILE',
  EXPRESS = 'EXPRESS',
  SELF_SERVICE = 'SELF_SERVICE',
}

export enum CashRegisterStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PaymentMethodType {
  CASH = 'cash',
  CARD = 'card',
  QR = 'qr',
}

export enum PaymentMethodSource {
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

export interface RegisterPaymentMethod {
  id: string;
  source: PaymentMethodSource;
  systemType?: PaymentMethodType;
  name?: string;
  code?: string;
  description?: string;
  isActive: boolean;
  status: PaymentMethodStatus;
  createdAt: string;
  currentBalance: number;
  accountDetails?: string;
}

export interface PaymentMethodDto {
  source: PaymentMethodSource;
  systemType?: PaymentMethodType;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  status: PaymentMethodStatus;
}

export interface CreateCashRegisterDto {
  name: string;
  type: CashRegisterType;
  location?: string;
  paymentMethods: PaymentMethodDto[];
}

export enum PaymentMethodTransactionType {
  SALE = 'sale',
  REFUND = 'refund',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PURCHASE = 'purchase',
  ADJUSTMENT = 'adjustment',
}

export enum PaymentMethodReferenceType {
  SALE = 'sale',
  REFUND = 'refund',
  PURCHASE = 'purchase',
  SHIFT = 'shift',
  MANUAL = 'manual',
}

export interface PaymentMethodTransaction {
  id: string;
  paymentMethodId: string;
  paymentMethod: RegisterPaymentMethod;
  shiftId?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType: PaymentMethodTransactionType;
  referenceType?: PaymentMethodReferenceType;
  referenceId?: string;
  note?: string;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
}
