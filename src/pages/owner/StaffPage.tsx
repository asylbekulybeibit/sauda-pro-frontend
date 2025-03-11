import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getShopStaff } from '@/services/ownerApi';
import { RoleType } from '@/types/role';
import { StaffList } from '@/components/owner/staff/StaffList';

export default function StaffPage() {
  const { shopId } = useParams();
  const [roleFilter, setRoleFilter] = useState<RoleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'active' | 'inactive' | 'all'
  >('all');

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

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleType | 'all')}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Все роли</option>
          <option value="owner">Владельцы</option>
          <option value="manager">Менеджеры</option>
          <option value="cashier">Кассиры</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'active' | 'inactive' | 'all')
          }
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>

      {/* Список сотрудников */}
      <StaffList
        staff={staff || []}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
      />
    </div>
  );
}
