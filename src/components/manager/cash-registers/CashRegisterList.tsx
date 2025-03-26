import { useState, useMemo } from 'react';
import { Table, Button, Popconfirm, Typography, Space, Tag, Modal } from 'antd';
import {
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  CashRegister,
  CashRegisterStatus,
  CashRegisterType,
  PaymentMethodType,
  PaymentMethodSource,
  RegisterPaymentMethod,
  PaymentMethodStatus,
} from '@/types/cash-register';
import { cashRegistersApi } from '@/services/cashRegistersApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EditPaymentMethodsModal from './EditPaymentMethodsModal';
import { PaymentMethodBalanceModal } from './PaymentMethodBalanceModal';

const { confirm } = Modal;
const { Text } = Typography;

interface CashRegisterListProps {
  registers: CashRegister[];
  isLoading: boolean;
  onStatusChange: () => void;
  onDelete: () => void;
  warehouseId: string;
}

const registerTypeLabels = {
  [CashRegisterType.STATIONARY]: 'Стационарная',
  [CashRegisterType.MOBILE]: 'Мобильная',
  [CashRegisterType.EXPRESS]: 'Экспресс',
  [CashRegisterType.SELF_SERVICE]: 'Самообслуживание',
};

const statusLabels = {
  [CashRegisterStatus.ACTIVE]: 'Активна',
  [CashRegisterStatus.INACTIVE]: 'Неактивна',
  [CashRegisterStatus.MAINTENANCE]: 'Обслуживание',
};

const statusColors = {
  [CashRegisterStatus.ACTIVE]: 'success',
  [CashRegisterStatus.INACTIVE]: 'default',
  [CashRegisterStatus.MAINTENANCE]: 'warning',
};

const systemPaymentMethodLabels = {
  [PaymentMethodType.CASH]: 'Наличные',
  [PaymentMethodType.CARD]: 'Карта',
  [PaymentMethodType.QR]: 'QR-код',
};

export default function CashRegisterList({
  registers,
  isLoading,
  onStatusChange,
  onDelete,
  warehouseId,
}: CashRegisterListProps) {
  const queryClient = useQueryClient();
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(
    null
  );
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<RegisterPaymentMethod | null>(null);

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'active' | 'disabled';
    }) => cashRegistersApi.updateStatus(warehouseId, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cash-registers', warehouseId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cashRegistersApi.remove(warehouseId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cash-registers', warehouseId],
      });
    },
  });

  const handleStatusChange = (
    id: string,
    currentStatus: 'active' | 'disabled'
  ) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = (id: string) => {
    confirm({
      title: 'Вы уверены, что хотите удалить эту кассу?',
      icon: <ExclamationCircleOutlined />,
      content: 'Это действие нельзя отменить.',
      okText: 'Да',
      okType: 'danger',
      cancelText: 'Нет',
      onOk() {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleEditPaymentMethods = (register: CashRegister) => {
    setEditingRegister(register);
  };

  const handleCloseEditModal = () => {
    setEditingRegister(null);
  };

  const handlePaymentMethodsSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['cash-registers', warehouseId],
    });
    setEditingRegister(null);
  };

  const handleOpenBalanceModal = (paymentMethod: RegisterPaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setBalanceModalVisible(true);
  };

  const handleCloseBalanceModal = () => {
    setBalanceModalVisible(false);
    setSelectedPaymentMethod(null);
  };

  const renderPaymentMethod = (method: RegisterPaymentMethod) => {
    if (method.status !== PaymentMethodStatus.ACTIVE || !method.isActive)
      return null;

    if (method.source === PaymentMethodSource.SYSTEM && method.systemType) {
      return (
        <Tag key={method.id} color="blue">
          {systemPaymentMethodLabels[method.systemType]}
        </Tag>
      );
    }

    if (method.source === PaymentMethodSource.CUSTOM && method.name) {
      return (
        <Tag key={method.id} color="green">
          {method.name}
        </Tag>
      );
    }

    return null;
  };

  const columns: ColumnsType<CashRegister> = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: CashRegisterType) => registerTypeLabels[type],
    },
    {
      title: 'Расположение',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || '-',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: CashRegisterStatus) => (
        <Popconfirm
          title={`Изменить статус на ${
            status === CashRegisterStatus.ACTIVE ? 'неактивный' : 'активный'
          }?`}
          onConfirm={() =>
            handleStatusChange(
              registers[0].id,
              status === CashRegisterStatus.ACTIVE ? 'disabled' : 'active'
            )
          }
          okText="Да"
          cancelText="Нет"
        >
          <Tag
            color={status === CashRegisterStatus.ACTIVE ? 'green' : 'red'}
            className="cursor-pointer"
          >
            {statusLabels[status]}
          </Tag>
        </Popconfirm>
      ),
    },
    {
      title: 'Методы оплаты',
      dataIndex: 'paymentMethods',
      key: 'paymentMethods',
      render: (paymentMethods: RegisterPaymentMethod[]) => (
        <Space direction="vertical" size="small">
          {paymentMethods.length === 0 ? (
            <Text type="secondary">Нет методов оплаты</Text>
          ) : (
            paymentMethods.map((method) => (
              <Space key={method.id} size="small">
                <Tag color={method.isActive ? 'blue' : 'gray'}>
                  {method.name}
                </Tag>
                <Button
                  type="text"
                  size="small"
                  icon={<WalletOutlined />}
                  onClick={() => handleOpenBalanceModal(method)}
                  title="Управление балансом"
                />
              </Space>
            ))
          )}
        </Space>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => handleEditPaymentMethods(record)}
            title="Настроить методы оплаты"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            title="Удалить"
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={registers}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      {editingRegister && (
        <EditPaymentMethodsModal
          isOpen={true}
          onClose={handleCloseEditModal}
          onSuccess={handlePaymentMethodsSuccess}
          register={editingRegister}
        />
      )}

      {selectedPaymentMethod && (
        <PaymentMethodBalanceModal
          isOpen={balanceModalVisible}
          onClose={handleCloseBalanceModal}
          paymentMethod={selectedPaymentMethod}
          warehouseId={warehouseId}
        />
      )}
    </>
  );
}
