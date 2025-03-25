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
  type: string;
  address?: string;
}

export interface UserRoleDetails {
  id: string;
  type: RoleType;
  isActive: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  user: User;
  shopId: string;
  shop: Shop;
}

// Simplified role type for route protection
export type SimpleRole = RoleType;

export interface RoleState {
  currentRole: SimpleRole | null;
  setCurrentRole: (role: SimpleRole | null) => void;
}
