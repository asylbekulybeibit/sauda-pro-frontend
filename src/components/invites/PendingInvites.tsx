import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getPendingInvites, acceptInvite, rejectInvite } from '@/services/api';
import { Invite } from '@/types/invite';

const PendingInviteCard = ({ invite }: { invite: Invite }) => {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvite(invite.id),
    onSuccess: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ['pendingInvites'] });
      queryClient.invalidateQueries({ queryKey: ['userRoles'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingInvites'] });
    },
  });

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

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  const handleReject = () => {
    rejectMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4"
    >
      {/* Заголовок и роль */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-lg font-medium">
            {invite.warehouse ? 'Приглашение на склад' : 'Приглашение в проект'}
          </div>
          <div className="text-sm text-gray-500">
            от {invite.createdBy.firstName} {invite.createdBy.lastName}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getRoleEmoji(invite.role)}</span>
          <span className="text-sm font-medium text-gray-700">
            {getRoleName(invite.role)}
          </span>
        </div>
      </div>

      {/* Информация о проекте/складе */}
      {invite.warehouse ? (
        <div>
          <div className="text-sm text-gray-500">Склад</div>
          <div className="font-medium flex items-center">
            <span className="mr-1">🏢</span> {invite.warehouse.name}
          </div>
          {invite.warehouse.address && (
            <div className="text-sm text-gray-500 mt-1">
              <span className="mr-1">📍</span> {invite.warehouse.address}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-500">Проект</div>
          <div className="font-medium">{invite.shop.name}</div>
          {invite.shop.address && (
            <div className="text-sm text-gray-500 mt-1">
              📍 {invite.shop.address}
            </div>
          )}
        </div>
      )}

      {/* Дата создания */}
      <div className="text-sm text-gray-500">
        Создано: {new Date(invite.createdAt).toLocaleDateString()}
      </div>

      {/* Действия */}
      <div className="flex space-x-4 pt-4">
        <button
          onClick={handleAccept}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
        >
          {acceptMutation.isPending ? 'Принятие...' : 'Принять'}
        </button>
        <button
          onClick={handleReject}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
        >
          {rejectMutation.isPending ? 'Отклонение...' : 'Отклонить'}
        </button>
      </div>
    </motion.div>
  );
};

export default function PendingInvites() {
  const { data: invites, isLoading } = useQuery({
    queryKey: ['pendingInvites'],
    queryFn: getPendingInvites,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!invites?.length) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900">
        Ожидающие приглашения ({invites.length})
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {invites.map((invite) => (
          <PendingInviteCard key={invite.id} invite={invite} />
        ))}
      </div>
    </div>
  );
}
