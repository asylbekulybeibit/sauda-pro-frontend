import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getShopStaff } from '@/services/ownerApi';
import { StaffList } from '@/components/owner/staff/StaffList';

export default function StaffPage() {
  const { shopId } = useParams();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', shopId],
    queryFn: () => getShopStaff(shopId!),
    enabled: !!shopId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Сотрудники</h1>
      </div>

      {/* Список сотрудников */}
      <StaffList staff={staff || []} />
    </div>
  );
}
