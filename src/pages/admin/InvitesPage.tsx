import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvites, cancelInvite } from '@/services/api';
import { Modal } from '@/components/ui/modal';
import { CreateInviteForm } from '@/components/invites/CreateInviteForm';
import { formatPhoneNumber } from '@/utils/phone';
import { Invite } from '@/types/invite';

// Компонент карточки инвайта
const InviteCard = ({ invite }: { invite: Invite }) => {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });

  const handleCancel = () => {
    if (window.confirm('Вы уверены, что хотите отменить этот инвайт?')) {
      cancelMutation.mutate();
    }
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'owner':
        return '👔';
      case 'manager':
        return '👨‍💼';
      case 'cashier':
        return '💰';
      default:
        return '👤';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6 space-y-4"
    >
      {/* Статус и действия */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-sm text-gray-500">Статус</div>
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              invite.isAccepted
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {invite.isAccepted ? 'Принят' : 'Ожидает'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl">{getRoleEmoji(invite.role)}</div>
          {!invite.isAccepted && (
            <button
              onClick={handleCancel}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              title="Отменить инвайт"
              disabled={cancelMutation.isPending}
            >
              ❌
            </button>
          )}
        </div>
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Телефон</div>
          <div className="font-medium">{formatPhoneNumber(invite.phone)}</div>
        </div>
        {invite.email && (
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium">{invite.email}</div>
          </div>
        )}
      </div>

      {/* Проект */}
      <div>
        <div className="text-sm text-gray-500">Проект</div>
        <div className="font-medium">{invite.shop.name}</div>
      </div>

      {/* Дополнительная информация */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <div>
          <div className="text-sm text-gray-500">Создан</div>
          <div className="text-sm">
            {new Date(invite.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Создал</div>
          <div className="text-sm">
            {invite.createdBy.firstName} {invite.createdBy.lastName}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function InvitesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<{
    status?: boolean;
    search?: string;
  }>({});

  // Запрос списка инвайтов
  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: getInvites,
  });

  // Фильтрация инвайтов
  const filteredInvites = invites?.filter((invite) => {
    if (filter.status !== undefined && invite.isAccepted !== filter.status)
      return false;
    if (
      filter.search &&
      !invite.phone.toLowerCase().includes(filter.search.toLowerCase()) &&
      !invite.email?.toLowerCase().includes(filter.search.toLowerCase())
    )
      return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Инвайты</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          + Отправить инвайт
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center space-x-4">
          {/* Поиск */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск по телефону или email..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filter.search || ''}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>

          {/* Фильтр по статусу */}
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={
              filter.status === undefined
                ? ''
                : filter.status
                ? 'accepted'
                : 'pending'
            }
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                status:
                  e.target.value === ''
                    ? undefined
                    : e.target.value === 'accepted',
              }))
            }
          >
            <option value="">Все статусы</option>
            <option value="accepted">Принятые</option>
            <option value="pending">Ожидающие</option>
          </select>
        </div>
      </div>

      {/* Список инвайтов */}
      <div className="grid grid-cols-1 gap-6">
        {filteredInvites?.map((invite) => (
          <InviteCard key={invite.id} invite={invite} />
        ))}
      </div>

      {/* Модальное окно создания инвайта */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Отправка инвайта"
      >
        <CreateInviteForm onClose={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
}
