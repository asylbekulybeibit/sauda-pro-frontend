import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Space,
  Table,
  message,
  Spin,
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { useFinancialAnalytics } from '@/hooks/useAnalytics';
import dayjs from 'dayjs';
import { ApiErrorHandler } from '@/utils/error-handler';

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
    data: financialData.revenueByDay,
    xField: 'date',
    yField: 'value',
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

  const transactionsColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: any, b: any) => a.amount - b.amount,
      render: (value: number) => `${value.toFixed(2)} ₽`,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
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
              title="Общий доход"
              value={financialData.totalRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общие расходы"
              value={financialData.totalExpenses}
              precision={2}
              prefix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Чистая прибыль"
              value={financialData.netProfit}
              precision={2}
              prefix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
              suffix="₽"
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
          <Card title="Последние транзакции">
            <Table
              columns={transactionsColumns}
              dataSource={financialData.recentTransactions}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
