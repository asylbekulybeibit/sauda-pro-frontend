import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getStaff } from '@/services/managerApi';
import { StaffList } from '@/components/manager/staff/StaffList';
import { EmployeesList } from '@/components/manager/staff/EmployeesList';
import { CreateInviteForm as InviteForm } from '@/components/manager/staff/InviteForm';
import { Spin, Divider } from 'antd';

function StaffPage() {
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Управление персоналом
        </h1>
      </div>

      {/* Секция системных пользователей */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Системные пользователи</h2>
        <StaffList roles={staffRoles || []} shopId={shopId!} />
      </div>

      <Divider />

      {/* Секция сотрудников-мастеров */}
      <div className="mt-8">
        <EmployeesList shopId={shopId!} />
      </div>

      {isInviteModalOpen && (
        <InviteForm
          onClose={() => setIsInviteModalOpen(false)}
          predefinedShopId={shopId!}
        />
      )}
    </div>
  );
}

export default StaffPage;
