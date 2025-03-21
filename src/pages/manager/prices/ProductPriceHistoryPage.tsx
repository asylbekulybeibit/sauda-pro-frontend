import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Space,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { PriceHistoryList } from '@/components/manager/prices/PriceHistoryList';
import { PriceHistoryChart } from '@/components/manager/prices/PriceHistoryChart';
import { useShop } from '@/hooks/useShop';
import { useQuery } from '@tanstack/react-query';
import {
  getProducts,
  getPriceHistory,
  getCategories,
} from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ProductPriceHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentShop } = useShop();
  const navigate = useNavigate();

  // Запрос на получение товаров
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', currentShop?.id],
    queryFn: () => getProducts(currentShop!.id),
    enabled: !!currentShop?.id,
  });

  // Запрос на получение истории цен
  const { data: priceHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['priceHistory', id, currentShop?.id],
    queryFn: () => getPriceHistory(id!, undefined, undefined, currentShop?.id),
    enabled: !!id && !!currentShop?.id,
  });

  // Запрос на получение категорий
  const { data: categories } = useQuery({
    queryKey: ['categories', currentShop?.id],
    queryFn: () => getCategories(currentShop!.id),
    enabled: !!currentShop?.id,
  });

  if (!id || !currentShop) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert
          message="Ошибка"
          description="Продукт или магазин не найден"
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Загрузка информации о товаре..." />
      </div>
    );
  }

  const product = products?.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <Alert
          message="Товар не найден"
          description="Запрашиваемый товар не существует или был удален"
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Формируем списки закупочных и продажных цен
  const purchasePrices =
    priceHistory?.filter((p) => p.priceType === 'purchase') || [];
  const sellingPrices =
    priceHistory?.filter((p) => p.priceType === 'selling') || [];

  // Получаем последние изменения цен
  const lastPurchaseChange =
    purchasePrices.length > 0 ? purchasePrices[0] : null;
  const lastSellingChange = sellingPrices.length > 0 ? sellingPrices[0] : null;

  // Рассчитываем даты последних изменений
  const lastPurchaseChangeDate = lastPurchaseChange
    ? dayjs(lastPurchaseChange.createdAt).format('DD.MM.YYYY')
    : 'Не менялась';
  const lastSellingChangeDate = lastSellingChange
    ? dayjs(lastSellingChange.createdAt).format('DD.MM.YYYY')
    : 'Не менялась';

  return (
    <div className="p-6 price-page">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            Назад
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            История цен
          </Title>
        </div>

        {/* Карточка с информацией о товаре */}
        <Card bordered={false}>
          <Row gutter={24} align="middle">
            <Col xs={24} md={8}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <InfoCircleOutlined
                  style={{ fontSize: 24, color: '#1890ff' }}
                />
                <Title level={4} style={{ margin: 0 }}>
                  {product.name}
                </Title>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  Артикул: {product.sku || 'Не указан'}
                </Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">
                  Категория:{' '}
                  {product.categoryId
                    ? categories?.find((c) => c.id === product.categoryId)
                        ?.name || 'Неизвестная категория'
                    : 'Без категории'}
                </Text>
              </div>
            </Col>
            <Col xs={12} md={4}>
              <Statistic
                title={<Text strong>Закупочная цена</Text>}
                value={formatPrice(product.purchasePrice || 0)}
                suffix={
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">
                      <TagOutlined /> {lastPurchaseChangeDate}
                    </Tag>
                  </div>
                }
              />
            </Col>
            <Col xs={12} md={4}>
              <Statistic
                title={<Text strong>Цена продажи</Text>}
                value={formatPrice(product.sellingPrice || 0)}
                valueStyle={{ color: '#52c41a' }}
                suffix={
                  <div style={{ marginTop: 4 }}>
                    <Tag color="green">
                      <TagOutlined /> {lastSellingChangeDate}
                    </Tag>
                  </div>
                }
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic
                title={<Text strong>Наценка</Text>}
                value={
                  product.purchasePrice
                    ? `${(
                        (product.sellingPrice / product.purchasePrice - 1) *
                        100
                      ).toFixed(2)}%`
                    : 'Н/Д'
                }
                valueStyle={{ color: '#fa8c16' }}
              />
              <Text type="secondary">
                Разница:{' '}
                {formatPrice(product.sellingPrice - product.purchasePrice)}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* График цен */}
        <Card title="График изменения цен">
          <PriceHistoryChart productId={id} />
        </Card>

        {/* История изменений */}
        <Card title="История изменений цен">
          <PriceHistoryList productId={id} />
        </Card>
      </Space>
    </div>
  );
};

export default ProductPriceHistoryPage;
