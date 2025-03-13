export interface User {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  roles: {
    id: string;
    userId: string;
    shopId: string;
    type: 'owner' | 'manager' | 'cashier';
    isActive: boolean;
    deactivatedAt: string | null;
    createdAt: string;
    updatedAt: string;
    shop: {
      id: string;
      name: string;
      address?: string;
      phone?: string;
      email?: string | null;
      isActive: boolean;
      type: 'shop' | 'warehouse' | 'point_of_sale';
      createdAt: string;
      updatedAt: string;
    };
  }[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
}
