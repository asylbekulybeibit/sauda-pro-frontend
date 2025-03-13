import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Space, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { getPriceChangesReport } from '@/services/managerApi';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface PriceAnalyticsProps {
  shopId: string;
}

interface AnalyticsData {
  totalChanges: number;
  increasesCount: number;
  decreasesCount: number;
  averageChange: number;
  maxIncrease: number;
  maxDecrease: number;
  mostChangedProducts: Array<{
    productId: string;
    name: string;
    changesCount: number;
  }>;
}

export const PriceAnalytics: React.FC<PriceAnalyticsProps> = ({ shopId }) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, 'days').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);

  const calculateAnalytics = (data: PriceHistory[]) => {
    const changes = data.map((record) => record.newPrice - record.oldPrice);
    const increases = changes.filter((change) => change > 0);
    const decreases = changes.filter((change) => change < 0);

    const productChanges = data.reduce((acc, record) => {
      acc[record.productId] = (acc[record.productId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostChanged = Object.entries(productChanges)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([productId, count]) => ({
        productId,
        name: 'Product Name', // TODO: Get product name from product data
        changesCount: count,
      }));

    return {
      totalChanges: changes.length,
      increasesCount: increases.length,
      decreasesCount: decreases.length,
      averageChange:
        changes.reduce((sum, change) => sum + change, 0) / changes.length || 0,
      maxIncrease: Math.max(...increases, 0),
      maxDecrease: Math.min(...decreases, 0),
      mostChangedProducts: mostChanged,
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getPriceChangesReport(
        shopId,
        dateRange[0],
        dateRange[1]
      );
      setAnalytics(calculateAnalytics(data));
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shopId, dateRange]);

  if (!analytics) {
    return null;
  }

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
          <Card loading={loading}>
            <Statistic
              title="Всего изменений"
              value={analytics.totalChanges}
              suffix="шт."
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="Повышения цен"
              value={analytics.increasesCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowUpOutlined />}
              suffix="шт."
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="Понижения цен"
              value={analytics.decreasesCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowDownOutlined />}
              suffix="шт."
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="Среднее изменение"
              value={analytics.averageChange}
              precision={2}
              prefix={analytics.averageChange > 0 ? '+' : ''}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="Макс. повышение"
              value={analytics.maxIncrease}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix="+"
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <Statistic
              title="Макс. понижение"
              value={Math.abs(analytics.maxDecrease)}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix="-"
              suffix="₽"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
