import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Space, message, Tooltip, Tag, Avatar } from 'antd';
import { UserOutlined, RobotOutlined, ToolOutlined } from '@ant-design/icons';
import { getPriceChangesReport } from '@/services/managerApi';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import { useShop } from '@/hooks/useShop';
import dayjs from 'dayjs';
import { formatPrice } from '@/utils/format';
import { translatePriceChangeReason } from '@/utils/translations';

const { RangePicker } = DatePicker;

interface PriceHistoryListProps {
  productId: string;
  priceTypeFilter: string;
  dateRange: [string, string] | null;
}

export const PriceHistoryList: React.FC<PriceHistoryListProps> = ({
  productId,
  priceTypeFilter,
  dateRange,
}) => {
  const { currentShop } = useShop();
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPriceHistory = async () => {
    if (!currentShop?.id) return;

    try {
      setLoading(true);
      console.log('PriceHistoryList fetchPriceHistory called with:', {
        dateRange,
        shopId: currentShop.id,
      });

      const data = await getPriceChangesReport(
        currentShop.id,
        dateRange?.[0],
        dateRange?.[1]
      );

      // Фильтруем данные по productId
      const filteredData = data.filter(
        (record) => record.productId === productId
      );

      console.log('PriceHistoryList received data:', filteredData);

      // Обрабатываем данные для корректного отображения
      const processedData = filteredData.map((record) => {
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
  }, [productId, dateRange, priceTypeFilter, currentShop?.id]);

  const columns = [
    {
      title: 'Дата изменения',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Тип цены',
      dataIndex: 'priceType',
      key: 'priceType',
      render: (priceType?: string) => {
        if (priceType === 'purchase') {
          return <Tag color="blue">Закупочная</Tag>;
        } else if (priceType === 'selling') {
          return <Tag color="green">Продажная</Tag>;
        } else {
          return <Tag color="default">Неизвестно</Tag>;
        }
      },
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
        const changedBy = record.changedBy as any;
        const changedByUser = record.changedByUser as any;

        const renderChangedBy = (changedBy: any, changedByUser?: any) => {
          // Первый приоритет: используем данные из changedByUser, если они есть
          if (changedByUser && typeof changedByUser === 'object') {
            if (changedByUser.firstName && changedByUser.lastName) {
              const userInfo = [];

              // Добавляем имя и фамилию
              userInfo.push(
                `${changedByUser.firstName} ${changedByUser.lastName}`
              );

              // Добавляем контактную информацию, если она есть
              if (changedByUser.phone || changedByUser.email) {
                userInfo.push(
                  [
                    changedByUser.phone ? `Тел: ${changedByUser.phone}` : '',
                    changedByUser.email || '',
                  ]
                    .filter(Boolean)
                    .join(', ')
                );
              }

              return (
                <Tooltip title={userInfo.length > 1 ? userInfo[1] : ''}>
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <span>{userInfo[0]}</span>
                  </Space>
                </Tooltip>
              );
            }
          }

          // Второй приоритет: если changedBy - объект, используем его данные
          if (typeof changedBy === 'object' && changedBy !== null) {
            const user = changedBy as any;

            // Если есть имя и фамилия, отображаем их
            if (user.firstName && user.lastName) {
              return (
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <span>{`${user.firstName} ${user.lastName}`}</span>
                </Space>
              );
            }

            // Если объект имеет id и name, это может быть сериализованный пользователь
            if (user.id && user.name) {
              return (
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <span>{user.name}</span>
                </Space>
              );
            }
          }

          // Третий приоритет: обработка строковых значений
          const changedByString =
            typeof changedBy === 'string' ? changedBy : '';

          if (!changedByString || changedByString === 'system') {
            return (
              <Space>
                <Avatar
                  icon={<RobotOutlined />}
                  style={{ backgroundColor: '#87d068' }}
                />
                <span>Система</span>
              </Space>
            );
          }

          if (changedByString === 'unknown') {
            return (
              <Space>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#d9d9d9' }}
                />
                <span>Неизвестно</span>
              </Space>
            );
          }

          if (changedByString === 'import') {
            return (
              <Space>
                <Avatar
                  icon={<ToolOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <span>Импорт</span>
              </Space>
            );
          }

          if (changedByString === 'admin') {
            return (
              <Space>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#ff4d4f' }}
                />
                <span>Администратор</span>
              </Space>
            );
          }

          // Если ничего не подошло, отображаем значение как есть
          return (
            <Space>
              <Avatar icon={<UserOutlined />} />
              <span>{changedByString}</span>
            </Space>
          );
        };

        return renderChangedBy(changedBy, changedByUser);
      },
    },
  ];

  const filteredData = priceHistory.filter((record) => {
    if (priceTypeFilter === 'all') return true;
    return record.priceType === priceTypeFilter;
  });

  return (
    <div>
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        locale={{ emptyText: 'Нет данных по истории цен за выбранный период' }}
      />
    </div>
  );
};
