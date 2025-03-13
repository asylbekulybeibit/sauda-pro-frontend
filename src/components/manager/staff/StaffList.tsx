import { useState } from 'react';
import { User } from '@/types/user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateStaff } from '@/services/managerApi';
import { TrashIcon } from '@heroicons/react/outline';
import { formatDate } from '@/utils/format';

interface StaffListProps {
  staff: User[];
}

export function StaffList({ staff }: StaffListProps) {
  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const handleDeactivate = async (id: number) => {
    if (
      window.confirm('Вы уверены, что хотите деактивировать этого сотрудника?')
    ) {
      await deactivateMutation.mutateAsync(id.toString());
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'Менеджер';
      case 'CASHIER':
        return 'Кассир';
      default:
        return role;
    }
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Активен' : 'Неактивен';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Имя
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Роль
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Статус
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Дата регистрации
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getRoleText(user.role)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${getStatusColor(
                      user.isActive
                    )}`}
                  >
                    {getStatusText(user.isActive)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.isActive && (
                    <button
                      onClick={() => handleDeactivate(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
