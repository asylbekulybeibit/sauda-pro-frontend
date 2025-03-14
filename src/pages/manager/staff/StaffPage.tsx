import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getStaff } from '@/services/managerApi';
import { StaffList } from '@/components/manager/staff/StaffList';
import { CreateInviteForm as InviteForm } from '@/components/manager/staff/InviteForm';
import { Button, Spin } from 'antd';
import { TagIcon } from '@heroicons/react/24/outline';

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
        <h1 className="text-2xl font-semibold text-gray-900">Сотрудники</h1>
        <Button
          type="primary"
          icon={<TagIcon className="h-5 w-5" />}
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-indigo-500 hover:bg-indigo-600 border-none shadow-sm"
        >
          Пригласить сотрудника
        </Button>
      </div>

      <StaffList roles={staffRoles || []} shopId={shopId!} />

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
