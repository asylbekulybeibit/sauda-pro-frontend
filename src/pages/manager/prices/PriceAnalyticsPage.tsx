import React from 'react';
import { PriceAnalytics } from '@/components/manager/prices/PriceAnalytics';
import { useShop } from '@/hooks/useShop';
import { Typography, Spin } from 'antd';

const { Title, Paragraph } = Typography;

const PriceAnalyticsPage: React.FC = () => {
  const { currentShop, loading } = useShop();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentShop) {
    return <div className="p-6">Магазин не выбран</div>;
  }

  return (
    <div className="p-6 space-y-4 price-page">
      <div>
        <Title level={2}>Аналитика цен</Title>
        <Paragraph className="text-gray-500">
          Анализ и статистика изменения цен товаров в вашем магазине
        </Paragraph>
      </div>
      <PriceAnalytics shopId={currentShop.id} />
    </div>
  );
};

export default PriceAnalyticsPage;
