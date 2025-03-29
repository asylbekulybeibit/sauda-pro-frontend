import React, { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRoleStore } from '@/store/roleStore';
import { cashRegistersApi } from '@/services/cashRegistersApi';

import CashRegisterList from '@/components/manager/cash-registers/CashRegisterList';
import CreateCashRegisterModal from '@/components/manager/cash-registers/CreateCashRegisterModal';

const CashRegistersPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();

  const {
    data: registers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['cash-registers', shopId],
    queryFn: () => cashRegistersApi.getAll(shopId!),
    enabled: !!shopId,
  });

  if (!shopId) {
    return <div>Магазин не выбран</div>;
  }

  const handleStatusChange = () => {
    refetch();
  };

  const handleDelete = () => {
    refetch();
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsModalVisible(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Кассовые аппараты</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          className="!bg-blue-500 hover:!bg-blue-600"
        >
          Добавить кассу
        </Button>
      </div>

      <CashRegisterList
        registers={registers || []}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        warehouseId={shopId}
      />

      <CreateCashRegisterModal
        isOpen={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSuccess={handleCreateSuccess}
        warehouseId={shopId}
      />
    </div>
  );
};

export default CashRegistersPage;
