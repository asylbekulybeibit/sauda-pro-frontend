import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Spin, Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PriceHistoryList } from '@/components/manager/prices/PriceHistoryList';
import { PriceHistoryChart } from '@/components/manager/prices/PriceHistoryChart';
import { PriceChangeForm } from '@/components/manager/prices/PriceChangeForm';
import { useShop } from '@/hooks/useShop';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services/managerApi';

const { Title } = Typography;

const ProductPriceHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentShop } = useShop();
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', currentShop?.id],
    queryFn: () => getProducts(currentShop!.id),
    enabled: !!currentShop?.id,
  });

  if (!id || !currentShop) {
    return <div>Продукт или магазин не найден</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  const product = products?.find((p) => p.id === id);

  if (!product) {
    return <div>Товар не найден</div>;
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
            currentPrice={product.sellingPrice}
            onSuccess={() => {
              // Refresh data in other tabs
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 price-page">
      <div className="flex items-center gap-4 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          Назад
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          История цен: {product.name}
        </Title>
      </div>
      <Tabs items={items} />
    </div>
  );
};

export default ProductPriceHistoryPage;
