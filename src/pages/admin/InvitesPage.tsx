import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvites, cancelInvite } from '@/services/api';
import { Modal } from '@/components/ui/modal';
import { CreateInviteForm } from '@/components/invites/CreateInviteForm';
import { InviteStatus } from '@/types/invite';

export default function InvitesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<{
    status?: InviteStatus;
    search?: string;
  }>({});

  const queryClient = useQueryClient();

  // Запрос списка инвайтов
  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: getInvites,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
  });

  // Фильтрация инвайтов
  const filteredInvites = invites?.filter((invite) => {
    if (filter.status !== undefined && invite.status !== filter.status)
      return false;
    if (
      filter.search &&
      !invite.phone.toLowerCase().includes(filter.search.toLowerCase()) &&
      !invite.email?.toLowerCase().includes(filter.search.toLowerCase())
    )
      return false;
    return true;
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Вы уверены, что хотите отменить этот инвайт?')) {
      cancelMutation.mutate(id);
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

  const getRoleName = (role: string) => {
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

  const openWhatsApp = (phone: string) => {
    // Убираем все нецифровые символы из номера
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

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
      <div className="flex space-x-4">
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
          value={filter.status || ''}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              status: e.target.value
                ? (e.target.value as InviteStatus)
                : undefined,
            }))
          }
        >
          <option value="">Все статусы</option>
          <option value={InviteStatus.ACCEPTED}>Принятые</option>
          <option value={InviteStatus.REJECTED}>Отклоненные</option>
          <option value={InviteStatus.PENDING}>Ожидающие</option>
          <option value={InviteStatus.CANCELLED}>Отмененные</option>
        </select>
      </div>

      {/* Таблица инвайтов */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Контакты
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Проект
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Создал
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvites?.map((invite) => (
              <motion.tr
                key={invite.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {invite.phone}
                      </span>
                      <button
                        onClick={() => openWhatsApp(invite.phone)}
                        className="text-green-600 hover:text-green-700 p-1.5 rounded-full hover:bg-green-50 transition-colors"
                        title="Открыть WhatsApp"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
                        </svg>
                      </button>
                    </div>
                    {invite.email && (
                      <div className="text-gray-500">{invite.email}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span>{getRoleEmoji(invite.role)}</span>
                    <span className="text-sm">{getRoleName(invite.role)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {invite.shop.name}
                    </div>
                    {invite.shop.address && (
                      <div className="text-gray-500 text-xs">
                        {invite.shop.address}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invite.status === InviteStatus.ACCEPTED
                        ? 'bg-green-100 text-green-800'
                        : invite.status === InviteStatus.REJECTED
                        ? 'bg-red-100 text-red-800'
                        : invite.status === InviteStatus.CANCELLED
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {invite.status === InviteStatus.ACCEPTED
                      ? 'Принят'
                      : invite.status === InviteStatus.REJECTED
                      ? 'Отклонен'
                      : invite.status === InviteStatus.CANCELLED
                      ? 'Отменен'
                      : 'Ожидает'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {invite.createdBy.firstName} {invite.createdBy.lastName}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {invite.status === InviteStatus.PENDING && (
                      <button
                        onClick={() => handleCancel(invite.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center space-x-1"
                        disabled={cancelMutation.isPending}
                        title="Отменить инвайт"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span>Отменить</span>
                      </button>
                    )}
                    {invite.status === InviteStatus.ACCEPTED && (
                      <span className="text-gray-500 text-sm">
                        Инвайт принят
                      </span>
                    )}
                    {invite.status === InviteStatus.REJECTED && (
                      <span className="text-gray-500 text-sm">
                        Инвайт отклонен
                      </span>
                    )}
                    {invite.status === InviteStatus.CANCELLED && (
                      <span className="text-gray-500 text-sm">
                        Инвайт отменен
                      </span>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
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
