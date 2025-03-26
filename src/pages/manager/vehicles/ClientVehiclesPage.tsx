import React from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@ant-design/pro-components';
import { Typography } from 'antd';
import { VehicleList } from '@/components/manager/services/VehicleList';

export default function ClientVehiclesPage() {
  const { shopId } = useParams<{ shopId: string }>();

  if (!shopId) {
    return (
      <div className="p-8">
        <Typography.Title level={3} type="danger">
          Ошибка: ID магазина не указан
        </Typography.Title>
      </div>
    );
  }

  return (
    <PageContainer
      header={{
        title: 'Автомобили клиентов',
      }}
    >
      <VehicleList shopId={shopId} />
    </PageContainer>
  );
}
