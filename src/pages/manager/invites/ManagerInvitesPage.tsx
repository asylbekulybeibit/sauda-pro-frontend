import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvites, cancelInvite } from '@/services/managerApi';
import { CreateInviteForm as InviteForm } from '@/components/manager/staff/InviteForm';
import { Button, Table, Select, message } from 'antd';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { InviteStatus } from '@/types/invite';
import { RoleType } from '@/types/role';
import { formatDate } from '@/utils/format';
import type { ColumnsType } from 'antd/es/table';
import type { Invite } from '@/types/invite';
import { useRoleStore } from '@/store/roleStore';

function ManagerInvitesPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InviteStatus | 'all'>('all');
  const queryClient = useQueryClient();
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  useEffect(() => {
    // Получаем ID склада из текущей роли менеджера
    if (currentRole && currentRole.type === 'shop' && currentRole.warehouse) {
      setWarehouseId(currentRole.warehouse.id);
    }
  }, [currentRole]);

  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites', warehouseId],
    queryFn: () => {
      if (!warehouseId) throw new Error('Warehouse ID not available');
      return getInvites(warehouseId);
    },
    enabled: !!warehouseId,
  });

  const cancelMutation = useMutation({
    mutationFn: (inviteId: string) => {
      if (!warehouseId) throw new Error('Warehouse ID not available');
      return cancelInvite(warehouseId, inviteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', warehouseId] });
      message.success('Приглашение отменено');
    },
    onError: (error) => {
      message.error('Ошибка при отмене приглашения');
      console.error('Error cancelling invite:', error);
    },
  });

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
      default:
        return 'bg-gray-100 text-gray-800';
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
      default:
        return status;
    }
  };

  const getRoleName = (role: RoleType) => {
    switch (role) {
      case RoleType.CASHIER:
        return 'Кассир';
      case RoleType.MANAGER:
        return 'Менеджер';
      default:
        return role;
    }
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const filteredInvites =
    invites?.filter(
      (invite) => statusFilter === 'all' || invite.status === statusFilter
    ) || [];

  const columns: ColumnsType<Invite> = [
    {
      title: 'ПОЛУЧАТЕЛЬ',
      key: 'recipient',
      render: (_, invite) => (
        <div className="flex items-center space-x-2">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {invite.phone}
            </div>
            {invite.email && (
              <div className="text-sm text-gray-500">{invite.email}</div>
            )}
            {invite.invitedUser && (
              <div className="text-sm text-gray-500">
                {invite.invitedUser.firstName} {invite.invitedUser.lastName}
              </div>
            )}
          </div>
          <button
            onClick={() => openWhatsApp(invite.phone)}
            className="text-green-600 hover:text-green-700 p-1.5 rounded-full hover:bg-green-50"
            title="Написать в WhatsApp"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
        </div>
      ),
    },
    {
      title: 'РОЛЬ',
      key: 'role',
      render: (_, invite) => getRoleName(invite.role),
    },
    {
      title: 'ОТПРАВИТЕЛЬ',
      key: 'sender',
      render: (_, invite) => (
        <div>
          <div className="text-sm text-gray-900">
            {invite.createdBy ? (
              <>
                {invite.createdBy.firstName} {invite.createdBy.lastName}
              </>
            ) : (
              'Без имени'
            )}
          </div>
          {invite.createdBy?.phone && (
            <div className="text-sm text-gray-500">
              {invite.createdBy.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'ДАТА ОТПРАВКИ',
      key: 'createdAt',
      render: (_, invite) => formatDate(invite.createdAt),
    },
    {
      title: 'ДАТА ОТВЕТА',
      key: 'updatedAt',
      render: (_, invite) =>
        invite.status !== InviteStatus.PENDING
          ? formatDate(invite.updatedAt)
          : '-',
    },
    {
      title: 'СТАТУС',
      key: 'status',
      render: (_, invite) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            invite.status
          )}`}
        >
          {getStatusName(invite.status)}
        </span>
      ),
    },
    {
      title: 'ДЕЙСТВИЯ',
      key: 'actions',
      render: (_, invite) => (
        <div>
          {invite.status === InviteStatus.PENDING && (
            <button
              onClick={() => cancelMutation.mutate(invite.id)}
              disabled={cancelMutation.isPending}
              className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
            >
              Отменить
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!warehouseId) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Загрузка данных о складе...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Приглашения</h1>
        <Button
          type="primary"
          icon={<UserPlusIcon className="h-5 w-5" />}
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-indigo-500 hover:bg-indigo-600 border-none shadow-sm"
        >
          Пригласить сотрудника
        </Button>
      </div>

      <div className="mb-4">
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 200 }}
          placeholder="Все статусы"
        >
          <Select.Option value="all">Все статусы</Select.Option>
          <Select.Option value={InviteStatus.PENDING}>Ожидает</Select.Option>
          <Select.Option value={InviteStatus.ACCEPTED}>Принят</Select.Option>
          <Select.Option value={InviteStatus.REJECTED}>Отклонен</Select.Option>
          <Select.Option value={InviteStatus.CANCELLED}>Отменен</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filteredInvites}
        loading={isLoading}
        rowKey="id"
      />

      {isInviteModalOpen && warehouseId && (
        <InviteForm
          onClose={() => setIsInviteModalOpen(false)}
          predefinedShopId={shopId}
          warehouseId={warehouseId}
        />
      )}
    </div>
  );
}

export default ManagerInvitesPage;
