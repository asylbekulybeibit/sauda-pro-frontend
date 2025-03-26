import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RoleType } from '@/types/role';

export interface Shop {
  id: string;
  name: string;
  type: string;
  address?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
}

export type CurrentRole =
  | { type: 'superadmin' }
  | {
      type: 'shop';
      id: string;
      role: RoleType;
      shop: Shop;
      warehouse?: Warehouse;
    };

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
