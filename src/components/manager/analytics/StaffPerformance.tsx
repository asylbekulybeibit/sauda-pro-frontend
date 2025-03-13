import React, { useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Spin, Space } from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Line, Column } from '@ant-design/charts';
import { FixedSizeList as List } from 'react-window';
import { useStaffAnalytics } from '@/hooks/useAnalytics';
import { useWindowSize } from '@/hooks/useWindowSize';
import { StaffPerformanceData } from '@/types/analytics';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface StaffPerformanceProps {
  shopId: string;
}

const ROW_HEIGHT = 54;

export const StaffPerformance: React.FC<StaffPerformanceProps> = ({
  shopId,
}) => {
  const { height: windowHeight } = useWindowSize();
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'days').startOf('day').toISOString(),
    dayjs().endOf('day').toISOString(),
  ]);

  const {
    data: staffData,
    isLoading,
  }: { data: StaffPerformanceData | undefined; isLoading: boolean } =
    useStaffAnalytics(shopId, dateRange[0], dateRange[1]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!staffData) {
    return null;
  }

  const salesByHourConfig = {
    data: staffData.salesByHour,
    xField: 'hour',
    yField: 'sales',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      type: 'cat',
      label: {
        formatter: (v: string) => `${v}:00`,
      },
    },
  };

  const performanceColumns = {
    data: staffData.staffStats.map((staff) => ({
      employee: staff.name,
      sales: staff.sales,
      efficiency: staff.efficiency,
    })),
    xField: 'employee',
    yField: 'sales',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    meta: {
      sales: {
        alias: 'Продажи',
      },
    },
  };

  const tableHeight = windowHeight
    ? Math.min((windowHeight - 500) / 2, 300)
    : 300;

  const renderRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = staffData.staffStats[index];
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
        <div style={{ flex: 1, textAlign: 'right' }}>
          {item.sales.toFixed(2)} ₽
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>{item.transactions}</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          {item.averageCheck.toFixed(2)} ₽
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>{item.returns}</div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          {(item.efficiency * 100).toFixed(1)}%
        </div>
      </div>
    );
  };

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
              title="Всего сотрудников"
              value={staffData.totalStaff}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общие продажи"
              value={staffData.totalSales}
              prefix={<DollarOutlined />}
              precision={2}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Средние продажи"
              value={staffData.averageSalesPerEmployee}
              prefix={<ShoppingOutlined />}
              precision={2}
              suffix="₽"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="Продажи по часам">
            <Line {...salesByHourConfig} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Эффективность сотрудников">
            <Column {...performanceColumns} />
          </Card>
        </Col>
      </Row>

      <Card title="Статистика по сотрудникам" style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            background: '#fafafa',
            fontWeight: 'bold',
          }}
        >
          <div style={{ flex: 2 }}>Сотрудник</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Продажи</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Транзакции</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Средний чек</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Возвраты</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Эффективность</div>
        </div>
        <List
          height={tableHeight}
          itemCount={staffData.staffStats.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {renderRow}
        </List>
      </Card>
    </div>
  );
};
