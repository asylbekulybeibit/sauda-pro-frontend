import { useState, useEffect } from 'react';
import { Button, Card, Typography, Empty, message } from 'antd';
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

  // Добавляем проверку и логирование warehouseId
  useEffect(() => {
    console.log('CashRegisters page warehouseId:', warehouseId);
    if (!warehouseId) {
      message.error('ID склада не найден. Проверьте URL.');
    }
  }, [warehouseId]);

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
    if (!warehouseId) {
      message.error('ID склада не найден. Невозможно создать кассу.');
      return;
    }
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

  // Если warehouseId не найден, показываем сообщение об ошибке
  if (!warehouseId) {
    return (
      <ManagerLayout>
        <div className="p-8">
          <Typography.Title level={4} type="danger">
            Ошибка: ID склада не найден в URL
          </Typography.Title>
          <Typography.Text>
            Пожалуйста, проверьте URL или попробуйте перезагрузить страницу.
          </Typography.Text>
        </div>
      </ManagerLayout>
    );
  }

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
            warehouseId={warehouseId}
          />
        ) : (
          <Empty
            description={isLoading ? 'Загрузка...' : 'Нет доступных касс'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {createModalVisible && (
        <CreateCashRegisterModal
          isOpen={createModalVisible}
          onClose={handleCloseCreateModal}
          onSuccess={handleCreateSuccess}
          warehouseId={warehouseId}
        />
      )}
    </ManagerLayout>
  );
}
