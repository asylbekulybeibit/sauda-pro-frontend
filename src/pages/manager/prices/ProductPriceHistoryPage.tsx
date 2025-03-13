import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs } from 'antd';
import { PriceHistoryList } from '@/components/manager/prices/PriceHistoryList';
import { PriceHistoryChart } from '@/components/manager/prices/PriceHistoryChart';
import { PriceChangeForm } from '@/components/manager/prices/PriceChangeForm';
import { useShop } from '@/hooks/useShop';

export const ProductPriceHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentShop } = useShop();

  if (!id || !currentShop) {
    return <div>Продукт или магазин не найден</div>;
  }

  const items = [
    {
      key: 'list',
      label: 'История изменений',
      children: <PriceHistoryList productId={id} />,
    },
    {
      key: 'chart',
      label: 'График',
      children: <PriceHistoryChart productId={id} />,
    },
    {
      key: 'change',
      label: 'Изменить цену',
      children: (
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 0' }}>
          <PriceChangeForm
            productId={id}
            shopId={currentShop.id}
            currentPrice={0} // TODO: Get current price from product data
            onSuccess={() => {
              // Refresh data in other tabs
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2>История цен</h2>
      <Tabs items={items} />
    </div>
  );
};
