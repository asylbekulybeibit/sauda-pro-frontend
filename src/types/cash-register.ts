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
  createdAt: string;
}

export interface PaymentMethodDto {
  source: PaymentMethodSource;
  systemType?: PaymentMethodType;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface CashRegister {
  id: string;
  name: string;
  type: CashRegisterType;
  location?: string;
  status: CashRegisterStatus;
  paymentMethods: RegisterPaymentMethod[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCashRegisterDto {
  name: string;
  type: CashRegisterType;
  location?: string;
  paymentMethods: PaymentMethodDto[];
}
