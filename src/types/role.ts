import { ShopType } from './shop';

export enum RoleType {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  MANAGER = 'manager',
  CASHIER = 'cashier',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  address?: string;
}

export interface UserRole {
  id: string;
  role: RoleType;
  isActive: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  user: User;
  shopId: string;
  shop: Shop;
}
