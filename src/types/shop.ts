export enum ShopType {
  SHOP = 'shop',
  WAREHOUSE = 'warehouse',
  POINT_OF_SALE = 'point_of_sale',
}

export interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  type: ShopType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userRoles: {
    id: string;
    role: 'owner' | 'manager' | 'cashier';
    user: {
      id: string;
      phone: string;
      firstName?: string;
      lastName?: string;
      email?: string;
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
