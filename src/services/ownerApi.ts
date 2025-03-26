import { api } from './api';
import { Invite } from '@/types/invite';
import { UserRoleDetails } from '@/types/role';

// Методы для работы с инвайтами владельца
export const cancelInvite = async (inviteId: string): Promise<void> => {
  await api.patch(`/owner/invites/${inviteId}/cancel`);
};

export const getOwnerInvites = async (shopId: string): Promise<Invite[]> => {
  const response = await api.get(`/owner/invites/${shopId}`);
  return response.data;
};

// Методы для работы с сотрудниками владельца
export const getShopStaff = async (
  shopId: string
): Promise<UserRoleDetails[]> => {
  const response = await api.get(`/owner/shops/${shopId}/staff`);
  return response.data;
};

export const getShop = async (shopId: string) => {
  const response = await api.get(`/owner/${shopId}`);
  return response.data;
};

export const removeStaffMember = async (staffId: string): Promise<void> => {
  await api.patch(`/owner/staff/${staffId}/deactivate`);
};
