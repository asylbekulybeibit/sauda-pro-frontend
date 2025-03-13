import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getStaff } from '@/services/managerApi';
import { StaffList } from '@/components/manager/staff/StaffList';
import { InviteForm } from '@/components/manager/staff/InviteForm';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@heroicons/react/outline';
import { Spinner } from '@/components/ui/Spinner';

export function StaffPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const {
    data: staff,
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
        <Spinner size="lg" />
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
        <h1 className="text-2xl font-semibold text-gray-900">Персонал</h1>
        <Button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Пригласить сотрудника
        </Button>
      </div>

      <StaffList staff={staff || []} />

      {isInviteModalOpen && (
        <InviteForm onClose={() => setIsInviteModalOpen(false)} />
      )}
    </div>
  );
}