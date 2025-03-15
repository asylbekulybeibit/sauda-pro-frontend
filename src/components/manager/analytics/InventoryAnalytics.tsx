import React from 'react';
import { Card, Row, Col, Statistic, Progress, Spin } from 'antd';
import { InboxOutlined, WarningOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import { FixedSizeList as List } from 'react-window';
import { useInventoryAnalytics } from '@/hooks/useAnalytics';
import { useWindowSize } from '@/hooks/useWindowSize';
import { InventoryAnalyticsData } from '@/types/analytics';
import { formatPrice } from '@/utils/format';

interface InventoryAnalyticsProps {
  shopId: string;
}

const ROW_HEIGHT = 54;

export const InventoryAnalytics: React.FC<InventoryAnalyticsProps> = ({
  shopId,
}) => {
  const { height: windowHeight } = useWindowSize();
  const {
    data: inventoryData,
    isLoading,
  }: { data: InventoryAnalyticsData | undefined; isLoading: boolean } =
    useInventoryAnalytics(shopId);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!inventoryData) {
    return null;
  }

  const pieChartConfig = {
    data: inventoryData.stockByCategory,
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    label: {
      text: 'category',
      position: 'outside',
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },
    legend: {
      position: 'bottom',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };

  const renderLowStockRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = inventoryData.lowStockProducts[index];
    if (!item) return null;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          borderBottom: '1px solid #f0f0f0',
          padding: '8px 16px',
        }}
      >
        <div style={{ flex: 2 }}>{item.name}</div>
        <div style={{ flex: 1 }}>{item.quantity}</div>
        <div style={{ flex: 1 }}>{item.minQuantity}</div>
        <div style={{ flex: 2 }}>
          <Progress
            percent={Math.round((item.quantity / item.minQuantity) * 100)}
            size="small"
            status={item.quantity <= item.minQuantity ? 'exception' : 'normal'}
          />
        </div>
        <div style={{ flex: 1 }}>{formatPrice(item.price)}</div>
      </div>
    );
  };

  const renderCategoryRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = inventoryData.stockByCategory[index];
    if (!item) return null;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          borderBottom: '1px solid #f0f0f0',
          padding: '8px 16px',
        }}
      >
        <div style={{ flex: 2 }}>{item.category}</div>
        <div style={{ flex: 1 }}>{item.quantity}</div>
        <div style={{ flex: 1 }}>{formatPrice(item.value)}</div>
      </div>
    );
  };

  const tableHeight = windowHeight
    ? Math.min((windowHeight - 500) / 2, 300)
    : 300;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Всего товаров"
              value={inventoryData.totalItems}
              prefix={<InboxOutlined />}
              suffix="шт."
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общая стоимость"
              value={inventoryData.totalValue}
              precision={2}
              formatter={(value) => formatPrice(value as number)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Товары с низким запасом"
              value={inventoryData.lowStockProducts.length}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              suffix="шт."
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Распределение по категориям">
            <Pie {...pieChartConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Статистика по категориям">
            <div
              style={{
                display: 'flex',
                padding: '8px 16px',
                background: '#fafafa',
                fontWeight: 'bold',
              }}
            >
              <div style={{ flex: 2 }}>Категория</div>
              <div style={{ flex: 1 }}>Количество</div>
              <div style={{ flex: 1 }}>Стоимость</div>
            </div>
            <List
              height={tableHeight}
              itemCount={inventoryData.stockByCategory.length}
              itemSize={ROW_HEIGHT}
              width="100%"
            >
              {renderCategoryRow}
            </List>
          </Card>
        </Col>
      </Row>

      <Card title="Товары с низким запасом" style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            background: '#fafafa',
            fontWeight: 'bold',
          }}
        >
          <div style={{ flex: 2 }}>Товар</div>
          <div style={{ flex: 1 }}>Количество</div>
          <div style={{ flex: 1 }}>Мин. количество</div>
          <div style={{ flex: 2 }}>Статус</div>
          <div style={{ flex: 1 }}>Стоимость</div>
        </div>
        <List
          height={tableHeight}
          itemCount={inventoryData.lowStockProducts.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {renderLowStockRow}
        </List>
      </Card>
    </div>
  );
};
