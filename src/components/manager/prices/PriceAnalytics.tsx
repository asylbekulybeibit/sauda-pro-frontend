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
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined,
  EditOutlined,
  HistoryOutlined,
  FireOutlined,
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
    name?: string;
    changesCount: number;
  }>;
}

export const PriceAnalytics: React.FC<PriceAnalyticsProps> = ({ shopId }) => {
  const navigate = useNavigate();
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('summary');

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

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
    if (!shopId || !dateRange) return;

    try {
      setLoading(true);
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const data = await getPriceChangesReport(shopId, startDate, endDate);

      // Логирование данных для анализа
      console.log('Полученные данные о ценах:', data);

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

      const products = await fetchProducts();

      // Рассчет аналитики
      const analyticsData = calculateAnalytics(processedData);

      // Добавление информации о товарах к аналитике
      analyticsData.mostChangedProducts = analyticsData.mostChangedProducts.map(
        (item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            ...item,
            name: product ? product.name : 'Неизвестный товар',
          };
        }
      );

      setAnalytics(analyticsData);
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

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

    // Map для подсчета количества изменений на товар
    const productChangesMap = new Map<string, number>();

    data.forEach((record) => {
      const change = record.newPrice - record.oldPrice;
      totalChangeAmount += change;

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
        // Проверяем наличие данных о пользователе в записи
        if (record.changedByUser?.firstName && record.changedByUser?.lastName) {
          const userInfo = [];

          // Добавляем имя и фамилию
          userInfo.push(
            `${record.changedByUser.firstName} ${record.changedByUser.lastName}`
          );

          // Добавляем телефон, если он есть
          if (record.changedByUser.phone) {
            userInfo.push(`Тел: ${record.changedByUser.phone}`);
          }

          // Добавляем email, если он есть
          if (record.changedByUser.email) {
            userInfo.push(`${record.changedByUser.email}`);
          }

          return (
            <Tooltip title={userInfo.slice(1).join(', ')}>
              <span>{userInfo[0]}</span>
            </Tooltip>
          );
        }

        const changedBy = record.changedBy;
        if (!changedBy) return 'Система';
        if (changedBy === 'unknown') return 'Неизвестно';
        if (changedBy === 'system') return 'Система';
        if (changedBy === 'import') return 'Импорт';
        if (changedBy === 'admin') return 'Администратор';
        return changedBy;
      },
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

  const items = [
    {
      key: 'summary',
      label: <span>Сводная статистика</span>,
      children: (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Всего изменений"
                  value={analytics?.totalChanges || 0}
                  suffix="шт."
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Повышения цен"
                  value={analytics?.increasesCount || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ArrowUpOutlined />}
                  suffix="шт."
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Понижения цен"
                  value={analytics?.decreasesCount || 0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<ArrowDownOutlined />}
                  suffix="шт."
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Среднее изменение"
                  value={analytics?.averageChange || 0}
                  precision={2}
                  prefix={(analytics?.averageChange || 0) > 0 ? '+' : ''}
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
          dataSource={priceHistory}
          columns={priceHistoryColumns}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
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
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h3 className="text-lg font-medium">Выберите период:</h3>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
              allowClear={false}
            />
          </div>
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        type="card"
        size="large"
        className="price-analytics-tabs"
      />

      {/* Модальное окно изменения цены */}
      <Modal
        title={`Изменение цены: ${selectedProduct?.name}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
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
