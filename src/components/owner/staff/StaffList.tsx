import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole, RoleType } from '@/types/role';
import { removeStaffMember } from '@/services/ownerApi';
import { formatDate } from '@/utils/date';
import { Modal } from '@/components/ui/modal';
import { useState } from 'react';

interface StaffListProps {
  staff: UserRole[];
  roleFilter: RoleType | 'all';
  statusFilter: 'active' | 'inactive' | 'all';
}

interface GroupedStaff {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  currentRole?: UserRole;
  history: UserRole[];
}

export function StaffList({ staff, roleFilter, statusFilter }: StaffListProps) {
  const queryClient = useQueryClient();
  const [selectedStaff, setSelectedStaff] = useState<UserRole | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: removeStaffMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsConfirmModalOpen(false);
      setSelectedStaff(null);
    },
  });

  // Группируем сотрудников по userId
  const groupedStaff = staff.reduce<GroupedStaff[]>((acc, role) => {
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

  // Фильтрация сотрудников
  const filteredStaff = groupedStaff.filter((member) => {
    if (roleFilter !== 'all' && member.currentRole?.role !== roleFilter)
      return false;
    if (statusFilter === 'active' && !member.currentRole) return false;
    if (statusFilter === 'inactive' && member.currentRole) return false;
    return true;
  });

  const handleRemove = (member: UserRole) => {
    setSelectedStaff(member);
    setIsConfirmModalOpen(true);
  };

  const confirmRemove = () => {
    if (selectedStaff) {
      removeMutation.mutate(selectedStaff.id);
    }
  };

  const getRoleName = (role: RoleType) => {
    switch (role) {
      case 'owner':
        return 'Владелец';
      case 'manager':
        return 'Менеджер';
      case 'cashier':
        return 'Кассир';
      default:
        return 'Неизвестная роль';
    }
  };

  const getRoleIcon = (role: RoleType) => {
    switch (role) {
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div
            key={member.userId}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
          >
            {/* Заголовок карточки */}
            <div className="flex justify-between items-start mb-4">
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
                  <div key={role.id} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium flex items-center gap-2">
                          {getRoleIcon(role.role)} {getRoleName(role.role)}
                        </span>
                        <div className="text-gray-500 ml-7">
                          с {formatDate(role.createdAt)}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Активен
                      </span>
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
                        className="text-sm p-2 bg-gray-50 rounded"
                      >
                        <div className="flex justify-between">
                          <span className="text-gray-600 flex items-center gap-2">
                            {getRoleIcon(role.role)} {getRoleName(role.role)}
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

            {/* Кнопка увольнения */}
            {member.history.find((r) => r.isActive && r.role !== 'owner') && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() =>
                    handleRemove(member.history.find((r) => r.isActive)!)
                  }
                  className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  Уволить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          Нет сотрудников с выбранными параметрами
        </div>
      )}

      {/* Модальное окно подтверждения увольнения */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Подтверждение увольнения"
      >
        <div className="space-y-4">
          <p>
            Вы уверены, что хотите уволить сотрудника{' '}
            {selectedStaff?.user.firstName} {selectedStaff?.user.lastName}?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Отмена
            </button>
            <button
              onClick={confirmRemove}
              disabled={removeMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {removeMutation.isPending ? 'Увольнение...' : 'Уволить'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
