import { RoleType } from '@/types/role';
import { ShopType } from './shop';

export interface UserStats {
  total: number;
  active: number;
  superadmins: number;
  byRole: Record<RoleType, number>;
  growth: number;
}

export interface ShopStats {
  total: number;
  active: number;
  byType: Record<ShopType, number>;
  growth: number;
}

export interface InviteStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
  byRole: Record<RoleType, number>;
}

export interface DashboardStats {
  users: UserStats;
  shops: ShopStats;
  invites: InviteStats;
}
