import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { getInventory, getLowStockProducts } from '@/services/managerApi';
import { LowStockList } from '@/components/manager/dashboard/LowStockList';
import { formatPrice } from '@/utils/format';

function WarehousePage() {
  const { shopId } = useParams<{ shopId: string }>();

  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory', shopId],
    queryFn: () => getInventory(shopId!),
    enabled: !!shopId,
  });

  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ['low-stock', shopId],
    queryFn: () => getLowStockProducts(shopId!),
    enabled: !!shopId,
  });

  if (isLoadingInventory || isLoadingLowStock) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  // Подсчет статистики
  const totalProducts = inventory?.length || 0;
  const totalValue =
    inventory?.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    ) || 0;
  const lowStockCount = lowStockProducts?.length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Склад</h1>

      {/* Статистика */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Всего товаров"
              value={totalProducts}
              suffix="шт."
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общая стоимость"
              value={formatPrice(totalValue)}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Товары с низким остатком"
              value={lowStockCount}
              suffix="шт."
              valueStyle={{ color: lowStockCount > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Товары с низким остатком */}
      {lowStockProducts && <LowStockList products={lowStockProducts} />}
    </div>
  );
}

export default WarehousePage;
