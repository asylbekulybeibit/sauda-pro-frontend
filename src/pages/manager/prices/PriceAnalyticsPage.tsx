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
      
      <PriceAnalytics shopId={currentShop.id} />
    </div>
  );
};

export default PriceAnalyticsPage;
