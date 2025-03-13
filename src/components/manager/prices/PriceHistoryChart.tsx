import React, { useEffect, useState } from 'react';
import { Line } from '@ant-design/charts';
import { Card, DatePicker, Space, message } from 'antd';
import { getPriceHistory } from '@/services/managerApi';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface PriceHistoryChartProps {
  productId: string;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  productId,
}) => {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const data = await getPriceHistory(
        productId,
        dateRange?.[0],
        dateRange?.[1]
      );
      setPriceHistory(data);
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
  }, [productId, dateRange]);

  const chartData = priceHistory.map((record) => ({
    date: dayjs(record.createdAt).format('DD.MM.YYYY HH:mm'),
    price: record.newPrice,
  }));

  const config = {
    data: chartData,
    padding: 'auto',
    xField: 'date',
    yField: 'price',
    xAxis: {
      title: {
        text: 'Дата',
      },
    },
    yAxis: {
      title: {
        text: 'Цена (₽)',
      },
      min: 0,
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: 'Цена',
          value: `${datum.price.toFixed(2)} ₽`,
        };
      },
    },
    point: {
      size: 5,
      shape: 'diamond',
      style: {
        fill: '#5B8FF9',
        stroke: '#5B8FF9',
        lineWidth: 2,
      },
    },
    state: {
      active: {
        style: {
          shadowBlur: 4,
          stroke: '#000',
          fill: 'red',
        },
      },
    },
  };

  return (
    <Card
      title="График изменения цен"
      extra={
        <Space>
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setDateRange([
                  dates[0]!.startOf('day').toISOString(),
                  dates[1]!.endOf('day').toISOString(),
                ]);
              } else {
                setDateRange(null);
              }
            }}
          />
        </Space>
      }
      loading={loading}
    >
      <Line {...config} />
    </Card>
  );
};
