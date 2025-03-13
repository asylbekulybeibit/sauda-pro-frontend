import React from 'react';
import { PriceAnalytics } from '@/components/manager/prices/PriceAnalytics';
import { useShop } from '@/hooks/useShop';

export const PriceAnalyticsPage: React.FC = () => {
  const { currentShop } = useShop();

  if (!currentShop) {
    return <div>Магазин не выбран</div>;
  }

  return (
    <div>
      <h2>Аналитика цен</h2>
      <PriceAnalytics shopId={currentShop.id} />
    </div>
  );
};
