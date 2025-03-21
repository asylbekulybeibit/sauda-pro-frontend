import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Space,
  message,
  Button,
  Table,
  Tabs,
  Modal,
  Tooltip,
  Tag,
  Radio,
  Avatar,
  Empty,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined,
  EditOutlined,
  HistoryOutlined,
  FireOutlined,
  PieChartOutlined,
  TagOutlined,
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
import { PriceChangeForm } from './PriceChangeForm';
import { Product } from '@/types/product';
import { translatePriceChangeReason } from '@/utils/translations';

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
    changesCount: number;
    name?: string;
  }>;
  purchaseChanges: number;
  sellingChanges: number;
}

export const PriceAnalytics: React.FC<PriceAnalyticsProps> = ({ shopId }) => {
  const navigate = useNavigate();
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [filteredPriceHistory, setFilteredPriceHistory] = useState<
    PriceHistory[]
  >([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('summary');
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

      console.log('[PriceAnalytics] Raw price history data:', data);

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

      console.log('[PriceAnalytics] Enriched price history data:', {
        totalRecords: enrichedData.length,
        sample: enrichedData[0],
      });

      setPriceHistory(enrichedData);

      // Применяем фильтр по типу цены
      filterPriceHistory(enrichedData, priceTypeFilter);

      // Расчет аналитики
      const stats = calculateAnalytics(enrichedData);
      console.log('[PriceAnalytics] Calculated analytics:', stats);

      // Добавляем имена продуктов к аналитике
      const enrichedAnalytics = {
        ...stats,
        mostChangedProducts: stats.mostChangedProducts.map((product) => {
          const foundProduct = products.find((p) => p.id === product.productId);
          return {
            ...product,
            name: foundProduct?.name || 'Неизвестный товар',
          };
        }),
      };

      console.log(
        '[PriceAnalytics] Final enriched analytics:',
        enrichedAnalytics
      );
      setAnalytics(enrichedAnalytics);
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
      console.log('Применен фильтр "все", отображаем записей:', data.length);
    } else {
      const filtered = data.filter((record) => record.priceType === filter);
      setFilteredPriceHistory(filtered);
      console.log(
        `Применен фильтр "${filter}", отображаем записей:`,
        filtered.length
      );
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

  // Расчет аналитики на основе истории изменений
  const calculateAnalytics = (data: PriceHistory[]) => {
    const totalChanges = data.length;
    let increasesCount = 0;
    let decreasesCount = 0;
    let totalChangeAmount = 0;
    let maxIncrease = 0;
    let maxDecrease = 0;
    let purchaseChanges = 0;
    let sellingChanges = 0;

    // Map для подсчета количества изменений на товар
    const productChangesMap = new Map<string, number>();

    data.forEach((record) => {
      const change = record.newPrice - record.oldPrice;
      totalChangeAmount += change;

      if (record.priceType === 'purchase') {
        purchaseChanges++;
      } else if (record.priceType === 'selling') {
        sellingChanges++;
      }

      if (change > 0) {
        increasesCount++;
        if (change > maxIncrease) maxIncrease = change;
      } else if (change < 0) {
        decreasesCount++;
        if (change < maxDecrease) maxDecrease = change;
      }

      // Подсчет количества изменений для каждого товара
      const currentCount = productChangesMap.get(record.productId) || 0;
      productChangesMap.set(record.productId, currentCount + 1);
    });

    // Сортировка товаров по количеству изменений
    const productChanges = Array.from(productChangesMap.entries())
      .map(([productId, changesCount]) => ({ productId, changesCount }))
      .sort((a, b) => b.changesCount - a.changesCount)
      .slice(0, 10); // Топ-10 товаров

    return {
      totalChanges,
      increasesCount,
      decreasesCount,
      averageChange: totalChanges > 0 ? totalChangeAmount / totalChanges : 0,
      maxIncrease,
      maxDecrease,
      mostChangedProducts: productChanges,
      purchaseChanges,
      sellingChanges,
    };
  };

  // Обработка клика по продукту для просмотра истории цен
  const handlePriceChangeClick = (productId: string) => {
    navigate(`/manager/${shopId}/prices/product/${productId}`);
  };

  // Открытие модального окна для изменения цены
  const handleEditPriceClick = (product: any) => {
    setSelectedProduct({
      id: product.id,
      name: product.name,
      price: product.sellingPrice || 0,
    });
    setIsModalVisible(true);
  };

  // Обработка успешного изменения цены
  const handlePriceChangeSuccess = () => {
    setIsModalVisible(false);
    fetchPriceChanges();
  };

  // Функция для отображения ответственного за изменение цены
  const renderChangedBy = (record: PriceHistory) => {
    const changedBy = record.changedBy;
    const changedByUser = record.changedByUser;

    // Первый приоритет: используем данные из changedByUser, если они есть
    if (changedByUser && typeof changedByUser === 'object') {
      if (changedByUser.firstName && changedByUser.lastName) {
        const userInfo = [];

        // Добавляем имя и фамилию
        userInfo.push(`${changedByUser.firstName} ${changedByUser.lastName}`);

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
  };

  // Колонки таблицы для истории изменений цен
  const priceHistoryColumns = [
    {
      title: 'Товар',
      dataIndex: ['product', 'name'],
      key: 'productName',
      render: (text: string, record: PriceHistory) => (
        <a onClick={() => handlePriceChangeClick(record.productId)}>
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
      render: (_: unknown, record: PriceHistory) => renderChangedBy(record),
    },
  ];

  // Колонки таблицы для товаров с наибольшим количеством изменений
  const mostChangedProductsColumns = [
    {
      title: 'Товар',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <a onClick={() => handlePriceChangeClick(record.productId)}>
          {text || 'Неизвестный товар'}
        </a>
      ),
    },
    {
      title: 'Количество изменений',
      dataIndex: 'changesCount',
      key: 'changesCount',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<LineChartOutlined />}
            size="small"
            onClick={() => handlePriceChangeClick(record.productId)}
          >
            История цен
          </Button>
        </Space>
      ),
    },
  ];

  // Формируем содержимое для отображения, когда нет данных
  const noDataContent = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span>
          Нет данных об изменениях цен за выбранный период.
          <br />
          Выберите другой период или измените фильтр по типу цены.
        </span>
      }
    />
  );

  const items = [
    {
      key: 'summary',
      label: (
        <span>
          <PieChartOutlined /> Сводка изменений цен
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Всего изменений цен"
                  value={analytics?.totalChanges || 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Повышений цен"
                  value={analytics?.increasesCount || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ArrowUpOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Снижений цен"
                  value={analytics?.decreasesCount || 0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<ArrowDownOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Изменения закупочных цен"
                  value={analytics?.purchaseChanges || 0}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<TagOutlined />}
                  suffix={<Tag color="blue">Закупочные</Tag>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Изменения продажных цен"
                  value={analytics?.sellingChanges || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<TagOutlined />}
                  suffix={<Tag color="green">Продажные</Tag>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Средн. изменение"
                  value={analytics?.averageChange || 0}
                  precision={2}
                  suffix="₸"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Макс. повышение"
                  value={analytics?.maxIncrease || 0}
                  precision={2}
                  valueStyle={{ color: '#cf1322' }}
                  prefix="+"
                  suffix="₸"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Макс. понижение"
                  value={Math.abs(analytics?.maxDecrease || 0)}
                  precision={2}
                  valueStyle={{ color: '#3f8600' }}
                  prefix="-"
                  suffix="₸"
                />
              </Card>
            </Col>
          </Row>
          {analytics?.totalChanges === 0 && noDataContent}
        </div>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Полная история изменений цен
        </span>
      ),
      children: (
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
      ),
    },
    {
      key: 'mostChanged',
      label: (
        <span>
          <FireOutlined /> Товары с наибольшим количеством изменений
        </span>
      ),
      children: (
        <Table
          dataSource={analytics?.mostChangedProducts || []}
          columns={mostChangedProductsColumns}
          rowKey="productId"
          loading={loading}
          pagination={false}
          locale={{
            emptyText:
              'Нет данных о товарах с изменениями цен за выбранный период',
          }}
        />
      ),
    },
  ];

  return (
    <div className="price-analytics">
      <Card
        title="Анализ изменения цен"
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
            <Button
              type="primary"
              onClick={fetchPriceChanges}
              loading={loading}
            >
              Обновить
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>

      {/* Модальное окно для изменения цены */}
      <Modal
        title={`Изменение цены для "${selectedProduct?.name}"`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedProduct && (
          <PriceChangeForm
            productId={selectedProduct.id}
            shopId={shopId}
            currentPrice={selectedProduct.price}
            onSuccess={handlePriceChangeSuccess}
          />
        )}
      </Modal>
    </div>
  );
};
