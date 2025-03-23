import { useParams } from 'react-router-dom';
import { Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { ServiceHistoryList } from '@/components/manager/services/ServiceHistoryList';

const { Title } = Typography;

export default function ServiceHistoryPage() {
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
            История услуг
          </Title>
        ),
      }}
    >
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <ServiceHistoryList shopId={shopId} />
      </div>
    </PageContainer>
  );
}
