import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deactivateStaff } from '@/services/managerApi';
import {
  UserIcon,
  UserGroupIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/utils/format';
import { UserRoleDetails } from '@/types/role';

interface StaffListProps {
  roles: UserRoleDetails[];
  shopId: string;
}

interface GroupedStaff {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  currentRole?: UserRoleDetails;
  history: UserRoleDetails[];
}

export function StaffList({ roles, shopId }: StaffListProps) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRoleDetails | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  const deactivateMutation = useMutation({
    mutationFn: (staffId: string) => deactivateStaff(staffId, shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowModal(false);
      setSelectedRole(null);
    },
  });

  // Группируем сотрудников по userId
  const groupedStaff = roles.reduce<GroupedStaff[]>((acc, role) => {
    const existingGroup = acc.find((group) => group.userId === role.user.id);

    if (existingGroup) {
      if (role.isActive) {
        existingGroup.currentRole = role;
      }
      existingGroup.history.push(role);
    } else {
      acc.push({
        userId: role.user.id,
        firstName: role.user.firstName,
        lastName: role.user.lastName,
        phone: role.user.phone,
        currentRole: role.isActive ? role : undefined,
        history: [role],
      });
    }

    return acc;
  }, []);

  const handleDeactivate = (role: UserRoleDetails) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const confirmDeactivate = () => {
    if (selectedRole) {
      deactivateMutation.mutateAsync(selectedRole.id);
    }
  };

  const getRoleName = (type: string) => {
    switch (type) {
      case 'owner':
        return 'Владелец';
      case 'manager':
        return 'Менеджер';
      case 'cashier':
        return 'Кассир';
      default:
        return type;
    }
  };

  const getRoleIcon = (type: string) => {
    switch (type) {
      case 'owner':
        return '👔';
      case 'manager':
        return '👨‍💼';
      case 'cashier':
        return '💰';
      default:
        return '❓';
    }
  };

  if (groupedStaff.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        В этом магазине пока нет сотрудников
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedStaff.map((member) => (
          <div
            key={member.userId}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border-4 border-black-100"
          >
            {/* Заголовок карточки */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
              <div>
                <div className="text-lg font-semibold">
                  {member.firstName} {member.lastName}
                </div>
                <div className="text-sm text-gray-500">{member.phone}</div>
              </div>
            </div>

            {/* Активные роли */}
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium text-gray-900">
                Текущие роли
              </h4>
              {member.history
                .filter((role) => role.isActive)
                .map((role) => (
                  <div
                    key={role.id}
                    className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium flex items-center gap-2">
                          {getRoleIcon(role.type)} {getRoleName(role.type)}
                        </span>
                        <div className="text-gray-500 ml-7">
                          с {formatDate(role.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Активен
                        </span>
                        {role.type === 'cashier' && (
                          <button
                            onClick={() => handleDeactivate(role)}
                            className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors duration-200"
                          >
                            Уволить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* История работы (только неактивные роли) */}
            {member.history.filter((r) => !r.isActive).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  История работы
                  <span className="ml-2 text-red-600">
                    (Увольнений:{' '}
                    {member.history.filter((r) => !r.isActive).length})
                  </span>
                </h4>
                <div className="space-y-2">
                  {member.history
                    .filter((role) => !role.isActive)
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((role) => (
                      <div
                        key={role.id}
                        className="text-sm p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between">
                          <span className="text-gray-600 flex items-center gap-2">
                            {getRoleIcon(role.type)} {getRoleName(role.type)}
                          </span>
                          <span className="text-red-600">Уволен</span>
                        </div>
                        <div className="text-gray-500 ml-7">
                          {formatDate(role.createdAt)}
                          {role.deactivatedAt && (
                            <> - {formatDate(role.deactivatedAt)}</>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRole(null);
        }}
        title="Подтверждение увольнения"
      >
        <div className="space-y-4">
          <p>
            Вы уверены, что хотите уволить сотрудника{' '}
            {selectedRole?.user.firstName} {selectedRole?.user.lastName}?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Отмена
            </button>
            <button
              onClick={confirmDeactivate}
              disabled={deactivateMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {deactivateMutation.isPending ? 'Увольнение...' : 'Уволить'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
