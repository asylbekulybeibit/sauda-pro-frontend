import { ShopType } from './shop';

export enum RoleType {
  SUPERADMIN = 'superadmin',
  OWNER = 'owner',
  MANAGER = 'manager',
  CASHIER = 'cashier',
}

export interface UserRole {
  id: string;
  role: RoleType;
  shop: {
    id: string;
    name: string;
    type: ShopType;
    address?: string;
  };
}
