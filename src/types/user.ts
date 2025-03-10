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
    role: 'owner' | 'manager' | 'cashier';
    shop: {
      id: string;
      name: string;
      type: 'shop' | 'warehouse' | 'point_of_sale';
      address?: string;
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
