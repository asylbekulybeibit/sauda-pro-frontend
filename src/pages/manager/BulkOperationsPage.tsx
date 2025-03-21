import React from 'react';
import { Card, Tabs, message, Button, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { BulkProductUpload } from '@/components/manager/products/BulkProductUpload';

const BulkOperationsPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const handleSuccess = () => {
    message.success('Операция успешно выполнена');
  };

  if (!shopId) {
    return <div>Магазин не найден</div>;
  }

  const items = [
    {
      key: 'products',
      label: 'Товары',
      children: <BulkProductUpload shopId={shopId} onSuccess={handleSuccess} />,
    },
    // Здесь можно добавить другие вкладки для других типов массовых операций
  ];

  return (
    <div>
      <div className="flex items-center mb-4">
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/manager/${shopId}/products`)}
          className="!bg-blue-500 !text-white hover:!bg-blue-600 mr-4"
        >
          Назад
        </Button>
        <h1 className="text-2xl font-semibold m-0">Массовые операции</h1>
      </div>
      <Card>
        <Tabs defaultActiveKey="products" items={items} />
      </Card>
    </div>
  );
};

export default BulkOperationsPage;
