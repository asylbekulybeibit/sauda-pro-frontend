import { RoleType } from '@/types/role';
import { Shop } from './shop';
import { Warehouse } from './warehouse';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export interface User {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

export interface Invite {
  id: string;
  phone: string;
  email?: string;
  role: RoleType;
  status: InviteStatus;
  statusChangedAt?: string;
  createdAt: string;
  updatedAt: string;
  shop: Shop;
  warehouse?: {
    id: string;
    name: string;
    address?: string;
  };
  createdBy: {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  invitedUser?: {
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  user?: User;
  sender?: User;
}

export interface CreateInviteDto {
  phone: string;
  email?: string;
  role: RoleType;
  shopId: string;
  warehouseId?: string;
}
