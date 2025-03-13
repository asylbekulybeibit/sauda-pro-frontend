import React from 'react';
import { Card, Tabs } from 'antd';
import { useParams } from 'react-router-dom';
import { BulkProductUpload } from '@/components/manager/products/BulkProductUpload';
import { useMessage } from '@/hooks/useMessage';

const { TabPane } = Tabs;

const BulkOperationsPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const message = useMessage();

  const handleSuccess = () => {
    message.success('Операция успешно выполнена');
  };

  if (!shopId) {
    return <div>Магазин не найден</div>;
  }

  return (
    <Card title="Массовые операции">
      <Tabs defaultActiveKey="products">
        <TabPane tab="Товары" key="products">
          <BulkProductUpload shopId={shopId} onSuccess={handleSuccess} />
        </TabPane>
        {/* Здесь можно добавить другие вкладки для других типов массовых операций */}
      </Tabs>
    </Card>
  );
};

export default BulkOperationsPage;
