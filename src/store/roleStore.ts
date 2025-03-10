import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RoleType = 'owner' | 'manager' | 'cashier';
export type ShopType = 'shop' | 'warehouse' | 'point_of_sale';

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  address: string;
}

export interface UserRole {
  id: string;
  role: RoleType;
  shop: Shop;
}

export type CurrentRole =
  | { type: 'superadmin' }
  | { type: 'shop'; id: string; role: RoleType; shop: Shop };

interface RoleState {
  currentRole: CurrentRole | null;
  setCurrentRole: (role: CurrentRole | null) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      currentRole: null,
      setCurrentRole: (role) => set({ currentRole: role }),
    }),
    {
      name: 'role-storage',
    }
  )
);
