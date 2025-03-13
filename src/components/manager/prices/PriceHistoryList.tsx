import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Space, message } from 'antd';
import { getPriceHistory } from '@/services/managerApi';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface PriceHistoryListProps {
  productId: string;
}

export const PriceHistoryList: React.FC<PriceHistoryListProps> = ({
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

  const columns = [
    {
      title: 'Дата изменения',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Старая цена',
      dataIndex: 'oldPrice',
      key: 'oldPrice',
      render: (price: number) => `${price.toFixed(2)} ₽`,
    },
    {
      title: 'Новая цена',
      dataIndex: 'newPrice',
      key: 'newPrice',
      render: (price: number) => `${price.toFixed(2)} ₽`,
    },
    {
      title: 'Изменение',
      key: 'change',
      render: (_, record: PriceHistory) => {
        const change = record.newPrice - record.oldPrice;
        const percentage = ((change / record.oldPrice) * 100).toFixed(2);
        const color = change > 0 ? 'red' : change < 0 ? 'green' : 'inherit';
        return (
          <span style={{ color }}>
            {change > 0 ? '+' : ''}
            {change.toFixed(2)} ₽ ({percentage}%)
          </span>
        );
      },
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason?: string) => reason || 'Не указана',
    },
    {
      title: 'Кто изменил',
      dataIndex: 'changedBy',
      key: 'changedBy',
    },
  ];

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
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

      <Table
        columns={columns}
        dataSource={priceHistory}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
};
