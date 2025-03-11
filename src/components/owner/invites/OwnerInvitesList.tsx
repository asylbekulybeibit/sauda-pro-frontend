import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Invite, InviteStatus } from '@/types/invite';
import { cancelInvite } from '@/services/ownerApi';
import { formatDate } from '@/utils/date';
import { RoleType } from '@/types/role';

interface OwnerInvitesListProps {
  invites: Invite[];
  statusFilter: InviteStatus | 'all';
}

export function OwnerInvitesList({
  invites,
  statusFilter,
}: OwnerInvitesListProps) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-invites'] });
    },
  });

  // Фильтрация инвайтов по статусу
  const filteredInvites = invites.filter(
    (invite) => statusFilter === 'all' || invite.status === statusFilter
  );

  const getRoleName = (role: RoleType) => {
    switch (role) {
      case RoleType.OWNER:
        return 'Владелец';
      case RoleType.MANAGER:
        return 'Менеджер';
      case RoleType.CASHIER:
        return 'Кассир';
      default:
        return 'Неизвестная роль';
    }
  };

  const getStatusName = (status: InviteStatus) => {
    switch (status) {
      case InviteStatus.PENDING:
        return 'Ожидает';
      case InviteStatus.ACCEPTED:
        return 'Принят';
      case InviteStatus.REJECTED:
        return 'Отклонен';
      case InviteStatus.CANCELLED:
        return 'Отменен';
    }
  };

  const getStatusColor = (status: InviteStatus) => {
    switch (status) {
      case InviteStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case InviteStatus.ACCEPTED:
        return 'bg-green-100 text-green-800';
      case InviteStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case InviteStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Получатель
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Отправитель
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата отправки
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата ответа
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvites.map((invite) => (
              <tr key={invite.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {invite.phone}
                      </div>
                      {invite.email && (
                        <div className="text-sm text-gray-500">
                          {invite.email}
                        </div>
                      )}
                      {invite.invitedUser && (
                        <div className="text-sm text-gray-500">
                          {invite.invitedUser.firstName}{' '}
                          {invite.invitedUser.lastName}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openWhatsApp(invite.phone)}
                      className="text-green-600 hover:text-green-700 p-1.5 rounded-full hover:bg-green-50"
                      title="Написать в WhatsApp"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {getRoleName(invite.role)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {invite.createdBy.firstName} {invite.createdBy.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invite.createdBy.phone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {formatDate(invite.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {invite.statusChangedAt
                      ? formatDate(invite.statusChangedAt)
                      : '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      invite.status
                    )}`}
                  >
                    {getStatusName(invite.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {invite.status === InviteStatus.PENDING && (
                    <button
                      onClick={() => cancelMutation.mutate(invite.id)}
                      disabled={cancelMutation.isPending}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      Отменить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredInvites.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          {statusFilter === 'all'
            ? 'Нет приглашений'
            : 'Нет приглашений с выбранным статусом'}
        </div>
      )}
    </div>
  );
}
