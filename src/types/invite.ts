import { RoleType } from '@/store/roleStore';
import { Shop } from './shop';

export interface Invite {
  id: string;
  phone: string;
  email?: string;
  role: RoleType;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  shop: Shop;
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
}

export interface CreateInviteDto {
  phone: string;
  email?: string;
  role: RoleType;
  shopId: string;
}
