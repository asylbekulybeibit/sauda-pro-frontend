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
  shopId: string;
  name: string;
  type: RegisterType;
  location?: string;
  status: RegisterStatus;
  paymentMethods: PaymentMethod[];
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
  shopId: string;
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
