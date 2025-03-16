import { useState } from 'react';
import { Table, Button, message, Popconfirm, Tag } from 'antd';
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
import EditPaymentMethodsModal from './EditPaymentMethodsModal';

interface CashRegisterListProps {
  registers: CashRegister[];
  isLoading: boolean;
  onStatusChange: () => void;
  onDelete: () => void;
  shopId: string;
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
  shopId,
}: CashRegisterListProps) {
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(
    null
  );

  const handleStatusChange = async (id: string, status: CashRegisterStatus) => {
    try {
      await cashRegistersApi.updateStatus(shopId, id, status);
      onStatusChange();
      message.success('Статус кассы обновлен');
    } catch (error) {
      message.error('Не удалось обновить статус кассы');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cashRegistersApi.remove(shopId, id);
      onDelete();
      message.success('Касса удалена');
    } catch (error) {
      message.error('Не удалось удалить кассу');
    }
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
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Методы оплаты',
      dataIndex: 'paymentMethods',
      key: 'paymentMethods',
      render: (paymentMethods: RegisterPaymentMethod[]) => (
        <div className="space-x-1">
          {paymentMethods.map(renderPaymentMethod)}
        </div>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <div className="space-x-2">
          <Button size="small" onClick={() => setEditingRegister(record)}>
            Методы оплаты
          </Button>
          {record.status === CashRegisterStatus.INACTIVE ? (
            <Button
              type="primary"
              size="small"
              onClick={() =>
                handleStatusChange(record.id, CashRegisterStatus.ACTIVE)
              }
              className="bg-blue-500"
            >
              Активировать
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() =>
                handleStatusChange(record.id, CashRegisterStatus.INACTIVE)
              }
            >
              Деактивировать
            </Button>
          )}
          <Popconfirm
            title="Удалить кассу?"
            description="Вы уверены, что хотите удалить эту кассу?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            okButtonProps={{ className: 'bg-blue-500 hover:bg-blue-500' }}
            cancelButtonProps={{ className: 'bg-blue-500 hover:bg-blue-500' }}
          >
            <Button size="small" danger>
              Удалить
            </Button>
          </Popconfirm>
        </div>
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
          onClose={() => setEditingRegister(null)}
          onSuccess={onStatusChange}
          register={editingRegister}
        />
      )}
    </>
  );
}
