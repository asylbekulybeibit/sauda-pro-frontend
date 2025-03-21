import React, { useEffect, useState } from 'react';
import {
  Card,
  DatePicker,
  Space,
  message,
  Button,
  Table,
  Tag,
  Radio,
  Avatar,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  ToolOutlined,
  QuestionOutlined,
} from '@ant-design/icons';
import { getPriceChangesReport, getProducts } from '@/services/managerApi';
import { PriceHistory } from '@/types/priceHistory';
import { ApiErrorHandler } from '@/utils/error-handler';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { formatPrice } from '@/utils/format';
import { translatePriceChangeReason } from '@/utils/translations';

const { RangePicker } = DatePicker;

interface PriceAnalyticsProps {
  shopId: string;
}

export const PriceAnalytics: React.FC<PriceAnalyticsProps> = ({ shopId }) => {
  const navigate = useNavigate();
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [filteredPriceHistory, setFilteredPriceHistory] = useState<
    PriceHistory[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [priceTypeFilter, setPriceTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  // Загрузка товаров
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const products = await getProducts(shopId);
      return products;
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Загрузка изменений цен
  const fetchPriceChanges = async () => {
    try {
      setLoading(true);
      console.log('[PriceAnalytics] Starting fetchPriceChanges:', {
        shopId,
        dateRange,
      });

      // Only use dates if dateRange is explicitly set
      const startDate = dateRange
        ? dateRange[0].format('YYYY-MM-DD')
        : undefined;
      const endDate = dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined;

      console.log('[PriceAnalytics] Fetching price changes with dates:', {
        startDate,
        endDate,
      });

      const data = await getPriceChangesReport(shopId, startDate, endDate);

      // Получаем продукты для отображения имен
      const products = await fetchProducts();
      console.log('[PriceAnalytics] Fetched products:', products.length);

      // Обогащаем данные именами продуктов
      const enrichedData = data.map((record) => {
        const product = products.find((p) => p.id === record.productId);
        return {
          ...record,
          product: record.product || {
            id: record.productId,
            name: product?.name || 'Неизвестный товар',
          },
        };
      });

      setPriceHistory(enrichedData);
      filterPriceHistory(enrichedData, priceTypeFilter);
    } catch (error) {
      console.error('[PriceAnalytics] Error in fetchPriceChanges:', error);
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  // Функция для фильтрации истории цен по типу
  const filterPriceHistory = (data: PriceHistory[], filter: string) => {
    if (filter === 'all') {
      setFilteredPriceHistory(data);
    } else {
      const filtered = data.filter((record) => record.priceType === filter);
      setFilteredPriceHistory(filtered);
    }
  };

  // Эффект для применения фильтра при его изменении
  useEffect(() => {
    if (priceHistory.length > 0) {
      filterPriceHistory(priceHistory, priceTypeFilter);
    }
  }, [priceTypeFilter, priceHistory]);

  // Вызов загрузки при изменении диапазона дат или ID магазина
  useEffect(() => {
    if (shopId) {
      fetchPriceChanges();
    }
  }, [shopId, dateRange]);

  // Колонки таблицы для истории изменений цен
  const priceHistoryColumns = [
    {
      title: 'Товар',
      dataIndex: ['product', 'name'],
      key: 'productName',
      render: (text: string, record: PriceHistory) => (
        <a
          onClick={() =>
            navigate(`/manager/${shopId}/prices/product/${record.productId}`)
          }
        >
          {text || 'Неизвестный товар'}
        </a>
      ),
    },
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
      render: (
        _: unknown,
        record: PriceHistory & { formattedChange?: string }
      ) => {
        const change = record.newPrice - record.oldPrice;

        // Если старая цена равна 0, показываем только абсолютное изменение
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
      ellipsis: true,
      render: (reason?: string) => translatePriceChangeReason(reason),
    },
    {
      title: 'Кто изменил',
      dataIndex: 'changedBy',
      key: 'changedBy',
      render: (_: unknown, record: PriceHistory) => {
        const changedBy = record.changedBy;
        const changedByUser = record.changedByUser;

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
        const changedByString = typeof changedBy === 'string' ? changedBy : '';

        if (!changedByString || changedByString === 'system') {
          return (
            <Space>
              <Avatar icon={<RobotOutlined />} />
              <span>Система</span>
            </Space>
          );
        }

        if (changedByString === 'unknown') {
          return (
            <Space>
              <Avatar icon={<QuestionOutlined />} />
              <span>Неизвестно</span>
            </Space>
          );
        }

        if (changedByString === 'import') {
          return (
            <Space>
              <Avatar icon={<ToolOutlined />} />
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
      },
    },
  ];

  return (
    <div className="price-analytics">
      <Card
        title="История изменения цен"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
              }}
              allowClear={true}
              placeholder={['Начальная дата', 'Конечная дата']}
            />
            <Radio.Group
              value={priceTypeFilter}
              onChange={(e) => setPriceTypeFilter(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">Все цены</Radio.Button>
              <Radio.Button value="purchase">Закупочные</Radio.Button>
              <Radio.Button value="selling">Продажные</Radio.Button>
            </Radio.Group>
            
          </Space>
        }
      >
        <Table
          dataSource={filteredPriceHistory}
          columns={priceHistoryColumns}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: 'Нет данных по истории цен за выбранный период',
          }}
        />
      </Card>
    </div>
  );
};
