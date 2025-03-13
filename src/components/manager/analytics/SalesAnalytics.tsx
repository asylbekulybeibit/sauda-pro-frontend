import React, { useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Space, Spin } from 'antd';
import { ShoppingOutlined, RiseOutlined } from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { FixedSizeList as List } from 'react-window';
import dayjs from 'dayjs';
import { useSalesAnalytics } from '@/hooks/useAnalytics';
import { useWindowSize } from '@/hooks/useWindowSize';
import { SalesAnalyticsData } from '@/types/analytics';

interface SalesAnalyticsProps {
  shopId: string;
}

const { RangePicker } = DatePicker;
const ROW_HEIGHT = 54;

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ shopId }) => {
  const { height: windowHeight } = useWindowSize();
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'days').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);

  const { data: salesData, isLoading } = useSalesAnalytics(
    shopId,
    dateRange[0],
    dateRange[1]
  );

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!salesData) {
    return null;
  }

  const lineChartConfig = {
    data: salesData.salesByDay.map((item) => ({
      date: item.date,
      value: item.amount,
      type: item.type,
    })),
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      type: 'time',
      label: {
        formatter: (v: string) => dayjs(v).format('DD.MM'),
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: `${datum.value.toFixed(2)} ₽`,
        };
      },
    },
  };

  const pieChartConfig = {
    data: salesData.salesByCategory.map((item) => ({
      category: item.category,
      value: item.amount,
    })),
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
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

  const renderRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = salesData.topProducts[index];
    if (!item) return null;

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ flex: 2 }}>{item.name}</div>
        <div style={{ flex: 1, textAlign: 'right' }}>{item.quantity}</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          {item.revenue.toFixed(2)} ₽
        </div>
      </div>
    );
  };

  const tableHeight = windowHeight
    ? Math.min((windowHeight - 500) / 2, 300)
    : 300;

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <RangePicker
          value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
          onChange={(dates) => {
            if (dates) {
              setDateRange([
                dates[0]!.startOf('day').toISOString(),
                dates[1]!.endOf('day').toISOString(),
              ]);
            }
          }}
        />
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общие продажи"
              value={salesData.totalSales}
              precision={2}
              prefix={<ShoppingOutlined />}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Средний чек"
              value={salesData.averageOrderValue}
              precision={2}
              prefix={<RiseOutlined />}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Количество чеков"
              value={salesData.totalOrders}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="Динамика продаж">
            <Line {...lineChartConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Продажи по категориям">
            <Pie {...pieChartConfig} />
          </Card>
        </Col>
      </Row>

      <Card title="Топ товаров" style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            background: '#fafafa',
            fontWeight: 'bold',
          }}
        >
          <div style={{ flex: 2 }}>Товар</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Количество</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Выручка</div>
        </div>
        <List
          height={tableHeight}
          itemCount={salesData.topProducts.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {renderRow}
        </List>
      </Card>
    </div>
  );
};
