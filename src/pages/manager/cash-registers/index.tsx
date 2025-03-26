import { useState } from 'react';
import { Button, Card, Typography, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { ManagerLayout } from '@/components/manager/layout/Layout';
import { CashRegisterList } from '@/components/manager/cash-registers/CashRegisterList';
import { CreateCashRegisterModal } from '@/components/manager/cash-registers/CreateCashRegisterModal';
import { cashRegistersApi } from '@/services/cashRegistersApi';
import { PageHeader } from '@/components/PageHeader';

const { Title } = Typography;

export default function CashRegisters() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Запрос на получение списка касс
  const {
    data: cashRegisters,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['cash-registers', warehouseId],
    queryFn: () => cashRegistersApi.getAll(warehouseId!),
    enabled: !!warehouseId,
  });

  // Обработчик открытия модального окна создания кассы
  const handleOpenCreateModal = () => {
    setCreateModalVisible(true);
  };

  // Обработчик закрытия модального окна создания кассы
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false);
  };

  // Обработчик успешного создания кассы
  const handleCreateSuccess = () => {
    refetch();
    setCreateModalVisible(false);
  };

  return (
    <ManagerLayout>
      <PageHeader
        title="Кассовые аппараты"
        extra={[
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
          >
            Добавить кассу
          </Button>,
        ]}
      />

      <Card>
        {cashRegisters && cashRegisters.length > 0 ? (
          <CashRegisterList
            cashRegisters={cashRegisters}
            loading={isLoading}
            warehouseId={warehouseId!}
          />
        ) : (
          <Empty
            description={isLoading ? 'Загрузка...' : 'Нет доступных касс'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <CreateCashRegisterModal
        isOpen={createModalVisible}
        onClose={handleCloseCreateModal}
        onSuccess={handleCreateSuccess}
        warehouseId={warehouseId!}
      />
    </ManagerLayout>
  );
}
