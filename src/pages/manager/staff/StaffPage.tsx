import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getStaff } from '@/services/managerApi';
import { StaffList } from '@/components/manager/staff/StaffList';
import { InviteForm } from '@/components/manager/staff/InviteForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';
import { User } from '@/types/user';
import { UserRoleDetails } from '@/types/role';

// Helper function to convert UserRoleDetails to User
const convertToUser = (roleDetails: UserRoleDetails): User => ({
  id: roleDetails.user.id,
  phone: roleDetails.user.phone,
  firstName: roleDetails.user.firstName,
  lastName: roleDetails.user.lastName,
  isActive: roleDetails.isActive,
  isSuperAdmin: false,
  createdAt: roleDetails.createdAt,
  updatedAt: roleDetails.createdAt,
  roles: [
    {
      id: roleDetails.id,
      userId: roleDetails.user.id,
      shopId: roleDetails.shopId,
      type: roleDetails.type.toLowerCase() as 'owner' | 'manager' | 'cashier',
      isActive: roleDetails.isActive,
      deactivatedAt: roleDetails.deactivatedAt,
      createdAt: roleDetails.createdAt,
      updatedAt: roleDetails.createdAt,
      shop: {
        id: roleDetails.shop.id,
        name: roleDetails.shop.name,
        address: roleDetails.shop.address,
        type: roleDetails.shop.type,
        isActive: true,
        createdAt: roleDetails.createdAt,
        updatedAt: roleDetails.createdAt,
      },
    },
  ],
});

export function StaffPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const {
    data: staffRoles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['staff', shopId],
    queryFn: () => getStaff(shopId!),
    enabled: !!shopId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Произошла ошибка при загрузке данных
      </div>
    );
  }

  // Convert UserRoleDetails[] to User[]
  const staff = (staffRoles || []).map(convertToUser);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Персонал</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setIsInviteModalOpen(true)}
        >
          Пригласить сотрудника
        </Button>
      </div>

      <StaffList staff={staff} />

      {isInviteModalOpen && (
        <InviteForm onClose={() => setIsInviteModalOpen(false)} />
      )}
    </div>
  );
}
