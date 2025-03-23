import { useParams } from 'react-router-dom';
import { Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { VehicleList } from '@/components/manager/services/VehicleList';

const { Title } = Typography;

export default function ClientVehiclesPage() {
  const { shopId } = useParams<{ shopId: string }>();

  if (!shopId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Typography.Text type="danger">
          Ошибка: ID магазина не указан
        </Typography.Text>
      </div>
    );
  }

  return (
    <PageContainer
      header={{
        title: (
          <Title level={4} className="mb-0">
            Автомобили клиентов
          </Title>
        ),
      }}
    >
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <VehicleList shopId={shopId} />
      </div>
    </PageContainer>
  );
}
