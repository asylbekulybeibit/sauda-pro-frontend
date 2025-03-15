import React from 'react';
import { Card, Row, Col, Statistic, DatePicker, Table, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { useFinancialAnalytics } from '@/hooks/useAnalytics';
import { formatPrice } from '@/utils/format';
import dayjs from 'dayjs';

interface FinancialMetricsProps {
  shopId: string;
}

const { RangePicker } = DatePicker;

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({
  shopId,
}) => {
  const [dateRange, setDateRange] = React.useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  const { data: financialData, isLoading } = useFinancialAnalytics(
    shopId,
    dateRange[0].toISOString(),
    dateRange[1].toISOString()
  );

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!financialData) {
    return null;
  }

  const revenueLineConfig = {
    data: financialData.dailyMetrics.map((metric) => ({
      date: metric.date,
      value: metric.revenue,
      type: 'Выручка',
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
  };

  const expensesPieConfig = {
    data: financialData.expensesByCategory,
    angleField: 'amount',
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

  const topProductsColumns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => formatPrice(value),
    },
    {
      title: 'Прибыль',
      dataIndex: 'profit',
      key: 'profit',
      render: (value: number) => formatPrice(value),
    },
    {
      title: 'Маржа',
      dataIndex: 'margin',
      key: 'margin',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!, dates[1]!]);
              }
            }}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общая выручка"
              value={financialData.totalRevenue}
              precision={2}
              formatter={(value) => formatPrice(value as number)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общая прибыль"
              value={financialData.totalProfit}
              precision={2}
              formatter={(value) => formatPrice(value as number)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Рост выручки"
              value={financialData.revenueGrowth ?? 0}
              precision={1}
              prefix={
                financialData.revenueGrowth ===
                null ? null : financialData.revenueGrowth > 0 ? (
                  <ArrowUpOutlined style={{ color: '#3f8600' }} />
                ) : (
                  <ArrowDownOutlined style={{ color: '#cf1322' }} />
                )
              }
              suffix="%"
              formatter={(value) =>
                financialData.revenueGrowth === null
                  ? 'Нет данных'
                  : value?.toString()
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Динамика выручки">
            <Line {...revenueLineConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Структура расходов">
            <Pie {...expensesPieConfig} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Топ продуктов">
            <Table
              columns={topProductsColumns}
              dataSource={financialData.topProducts}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
