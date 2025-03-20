import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Space, message, Tooltip } from 'antd';
import { getPriceHistory } from '@/services/managerApi';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import dayjs from 'dayjs';
import { formatPrice } from '@/utils/format';
import { translatePriceChangeReason } from '@/utils/translations';

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

      console.log('Данные истории цен:', data);

      // Проверим структуру данных о пользователе
      if (data && data.length > 0) {
        console.log('Информация о пользователе:', data[0].changedBy);
        console.log('Объект пользователя:', data[0].changedByUser);
      }

      // Обрабатываем данные для корректного отображения
      const processedData = data.map((record) => {
        // Создаем копию записи для модификации
        const processedRecord = { ...record };

        // Если старая цена равна 0, вычисляем только абсолютное изменение
        if (record.oldPrice === 0) {
          const change = record.newPrice - record.oldPrice;
          processedRecord.formattedChange = `${
            change > 0 ? '+' : ''
          }${formatPrice(change)}`;
        } else {
          // Вычисляем процентное изменение
          const change = record.newPrice - record.oldPrice;
          const percentChange = ((change / record.oldPrice) * 100).toFixed(2);
          processedRecord.formattedChange = `${
            change > 0 ? '+' : ''
          }${formatPrice(change)} (${percentChange}%)`;
        }

        return processedRecord;
      });

      setPriceHistory(processedData);
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
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Новая цена',
      dataIndex: 'newPrice',
      key: 'newPrice',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Изменение',
      key: 'change',
      render: (_: unknown, record: PriceHistory) => {
        const change = record.newPrice - record.oldPrice;

        // Если старая цена равна 0, показываем только абсолютное изменение без процентов
        if (record.oldPrice === 0) {
          return (
            <span>
              {change > 0 ? '+' : ''}
              {formatPrice(change)}
            </span>
          );
        }

        // Для всех остальных случаев вычисляем процентное изменение
        const percentage = ((change / record.oldPrice) * 100).toFixed(2);

        return (
          <span>
            {change > 0 ? '+' : ''}
            {formatPrice(change)} ({percentage}%)
          </span>
        );
      },
      onCell: (record: PriceHistory) => {
        const change = record.newPrice - record.oldPrice;
        const color = change > 0 ? 'red' : change < 0 ? 'green' : 'inherit';
        return {
          style: {
            color,
          },
        };
      },
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason?: string) => translatePriceChangeReason(reason),
    },
    {
      title: 'Кто изменил',
      dataIndex: 'changedBy',
      key: 'changedBy',
      render: (_: unknown, record: PriceHistory) => {
        // Выводим отладочную информацию для понимания структуры данных
        console.log(`Запись ${record.id}, changedBy:`, record.changedBy);
        console.log(
          `Запись ${record.id}, changedByUser:`,
          record.changedByUser
        );

        // Проверяем, есть ли информация о changedBy в виде объекта
        if (typeof record.changedBy === 'object' && record.changedBy !== null) {
          const user = record.changedBy as any;
          if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
          }
        }

        // Проверяем наличие данных в changedByUser
        if (record.changedByUser && typeof record.changedByUser === 'object') {
          if (record.changedByUser.firstName && record.changedByUser.lastName) {
            return `${record.changedByUser.firstName} ${record.changedByUser.lastName}`;
          }
        }

        // Проверяем наличие строковых идентификаторов
        const changedBy = record.changedBy;
        if (typeof changedBy === 'string') {
          if (!changedBy) return 'Система';
          if (changedBy === 'unknown') return 'Неизвестно';
          if (changedBy === 'system') return 'Система';
          if (changedBy === 'import') return 'Импорт';
          if (changedBy === 'admin') return 'Администратор';
          return changedBy;
        }

        return 'Неизвестно';
      },
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
