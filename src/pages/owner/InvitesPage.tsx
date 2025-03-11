import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getOwnerInvites } from '@/services/ownerApi';
import { InviteStatus } from '@/types/invite';
import { RoleType } from '@/types/role';
import { CreateInviteForm } from '@/components/invites/CreateInviteForm';
import { OwnerInvitesList } from '@/components/owner/invites/OwnerInvitesList';
import { Modal } from '@/components/ui/modal';

export default function InvitesPage() {
  const { shopId } = useParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InviteStatus | 'all'>('all');

  const { data: invites, isLoading } = useQuery({
    queryKey: ['owner-invites', shopId],
    queryFn: () => getOwnerInvites(shopId!),
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
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Приглашения</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          + Пригласить сотрудника
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as InviteStatus | 'all')
          }
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Все статусы</option>
          <option value={InviteStatus.PENDING}>Ожидают ответа</option>
          <option value={InviteStatus.ACCEPTED}>Приняты</option>
          <option value={InviteStatus.REJECTED}>Отклонены</option>
          <option value={InviteStatus.CANCELLED}>Отменены</option>
        </select>
      </div>

      {/* Список инвайтов */}
      <OwnerInvitesList invites={invites || []} statusFilter={statusFilter} />

      {/* Модальное окно создания инвайта */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Приглашение нового сотрудника"
      >
        <CreateInviteForm
          onClose={() => setIsCreateModalOpen(false)}
          availableRoles={[RoleType.MANAGER, RoleType.CASHIER]}
          predefinedShopId={shopId}
        />
      </Modal>
    </div>
  );
}
