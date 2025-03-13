export enum ShopType {
  SHOP = 'shop',
  WAREHOUSE = 'warehouse',
  POINT_OF_SALE = 'point_of_sale',
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  type: ShopType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: {
    taxRate?: number;
    printerSettings?: {
      defaultPrinter?: string;
      labelWidth?: number;
      labelHeight?: number;
    };
    notificationSettings?: {
      lowStockThreshold?: number;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    };
    currencySettings?: {
      currency: string;
      decimalPlaces: number;
      showCurrencySymbol: 'before' | 'after' | 'code';
    };
  };
  userRoles: {
    id: string;
    type: 'owner' | 'manager' | 'cashier';
    isActive: boolean;
    deactivatedAt: string | null;
    user: {
      id: string;
      phone: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      isActive?: boolean;
    };
  }[];
}

export interface CreateShopDto {
  name: string;
  address?: string;
  phone?: string;
  type: ShopType;
}

export interface UpdateShopDto {
  name?: string;
  address?: string;
  phone?: string;
  type?: ShopType;
  isActive?: boolean;
}
