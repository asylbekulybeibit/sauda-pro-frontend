import React, { useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  Table,
  Space,
  Descriptions,
  Typography,
  Spin,
  message,
  Tag,
} from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  PrinterOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getPurchaseById } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import { ShopContext } from '@/contexts/ShopContext';
import { PurchaseItem, User } from '@/types/purchase';

const { Title, Text } = Typography;

// Хелпер-функция для извлечения shopId из URL
const extractShopIdFromPath = (path: string): string | null => {
  // Формат: /manager/{shopId}/warehouse/purchases/{id}
  const match = path.match(/\/manager\/([^\/]+)\/warehouse\/purchases/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

const PurchaseDetails: React.FC = () => {
  // Извлекаем параметры из URL, включая shopId и id прихода
  const { id, shopId: shopIdFromParams } = useParams<{
    id: string;
    shopId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const shopContext = useContext(ShopContext);

  // Пробуем получить shopId разными способами в порядке приоритета:
  // 1. Из параметров URL
  // 2. Извлекаем из пути URL
  // 3. Из контекста
  const shopIdFromPath = extractShopIdFromPath(location.pathname);
  const shopId =
    shopIdFromParams || shopIdFromPath || shopContext?.currentShop?.id;

  console.log('PurchaseDetails rendered. ID:', id, 'shopId sources:', {
    fromParams: shopIdFromParams,
    fromPath: shopIdFromPath,
    fromContext: shopContext?.currentShop?.id,
    used: shopId,
  });

  // Fetch purchase data
  const {
    data: purchase,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchase', id, shopId],
    queryFn: () => {
      console.log(
        'Fetching purchase data for purchase ID:',
        id,
        'with shopId:',
        shopId
      );
      if (!id) {
        console.error('Missing required purchase ID');
        throw new Error('Missing required purchase ID');
      }

      if (!shopId) {
        console.error('Missing required shopId');
        throw new Error('Missing required shopId');
      }

      return getPurchaseById(id, shopId).then((data) => {
        console.log(
          'Purchase data received (full object):',
          JSON.stringify(data, null, 2)
        );
        return data;
      });
    },
    enabled: !!id && !!shopId,
  });

  if (error) {
    console.error('Error fetching purchase details:', error);
    message.error('Ошибка при загрузке данных прихода');
  }

  console.log('Purchase data received:', purchase);

  // Процесс подготовки данных для отображения
  // Получаем дополнительную информацию о магазине если нужно
  const enhanceShopInfo = (purchase: any) => {
    const result = { ...purchase };

    // Если в объекте есть информация о магазине, но нет shop объекта, создаем его
    if (purchase.shopId) {
      result.shop = {
        ...purchase.shop,
        id: purchase.shopId,
        // Улучшаем логику определения имени магазина, чтобы избежать "Магазин без названия"
        name:
          purchase.shopName ||
          (purchase.shop && purchase.shop.name) ||
          shopContext?.currentShop?.name ||
          `Магазин #${purchase.shopId}`,
        address: purchase.shop?.address || shopContext?.currentShop?.address,
      };
    }

    // Добавляем проверку и обработку данных о поставщике
    if (purchase.supplierId) {
      // Если у нас есть идентификатор поставщика, но нет полного объекта supplier
      if (!purchase.supplier || typeof purchase.supplier !== 'object') {
        console.log(
          'Восстанавливаем информацию о поставщике из ID:',
          purchase.supplierId
        );
        result.supplier = {
          id: purchase.supplierId,
          name: purchase.supplierName || `Поставщик #${purchase.supplierId}`,
        };
      } else {
        // Если объект supplier есть, но нет name, устанавливаем запасное значение
        if (!purchase.supplier.name) {
          console.log(
            'У поставщика нет имени, устанавливаем запасное значение'
          );
          result.supplier = {
            ...purchase.supplier,
            name: purchase.supplierName || `Поставщик #${purchase.supplierId}`,
          };
        }
      }
    } else {
      // Если supplierId отсутствует, но есть supplier.name, сохраняем его
      if (purchase.supplier?.name) {
        console.log('У записи нет supplierId, но есть supplier.name');
        result.supplierName = purchase.supplier.name;
      }
    }

    console.log('Результат обработки данных поставщика:', {
      supplierId: result.supplierId,
      supplierName: result.supplierName,
      supplier: result.supplier,
    });

    return result;
  };

  // Prepare items data with correct price and total values
  const prepareItemsData = (purchaseData: any) => {
    if (
      !purchaseData ||
      !purchaseData.items ||
      !Array.isArray(purchaseData.items)
    ) {
      console.warn('No valid items data in purchase');
      return [];
    }

    return purchaseData.items.map((item: any) => {
      // Ensure we have valid data
      const preparedItem: PurchaseItem = {
        ...item,
        id: item.id || String(Math.random()), // Ensure we have an ID for rowKey
        name:
          item.name ||
          (item.product ? item.product.name : 'Товар без названия'),
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
        purchasePrice: 0, // Default value, will be updated below
        sellingPrice:
          typeof item.sellingPrice === 'number' ? item.sellingPrice : 0,
      };

      // Handle price - it might be in different properties
      let price = null;
      if (typeof item.purchasePrice === 'number') {
        price = item.purchasePrice;
      } else if (typeof item.price === 'number') {
        price = item.price;
      } else if (
        item.product &&
        typeof item.product.purchasePrice === 'number'
      ) {
        price = item.product.purchasePrice;
      }

      // Make sure we always have a price
      preparedItem.purchasePrice = price !== null ? price : 0;

      return preparedItem;
    });
  };

  // Улучшенные данные о приходе с корректной информацией о магазине
  const enhancedPurchase = purchase ? enhanceShopInfo(purchase) : null;

  // Processed items for display
  const processedItems = enhancedPurchase
    ? prepareItemsData(enhancedPurchase)
    : [];

  // Console debugging to see structure
  console.log('Enhanced purchase data:', enhancedPurchase);
  console.log('Processed items for display:', processedItems);

  // Check for empty or loading state
  if (isLoading || !enhancedPurchase) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  // Table columns for the items list
  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PurchaseItem) => (
        <div>
          <div>{text || 'Товар без названия'}</div>
          {record.sku && (
            <div className="text-xs text-gray-500">Артикул: {record.sku}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity: any) =>
        typeof quantity === 'number' ? quantity : '—',
    },
    {
      title: 'Цена закупки',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 150,
      render: (price: any, record: PurchaseItem) => {
        console.log(`Rendering price for item: ${record.name}, price:`, price);
        // Проверяем все возможные источники цены
        const effectivePrice =
          typeof price === 'number'
            ? price
            : typeof record.purchasePrice === 'number'
            ? record.purchasePrice
            : 0;
        return formatPrice(effectivePrice);
      },
    },
    {
      title: 'Сумма',
      key: 'total',
      width: 120,
      render: (_: any, record: PurchaseItem) => {
        console.log(`Calculating total for item: ${record.name}`);
        const quantity =
          typeof record.quantity === 'number' ? record.quantity : 0;
        // Проверяем все возможные источники цены
        const price =
          typeof record.purchasePrice === 'number' ? record.purchasePrice : 0;
        console.log(
          `quantity: ${quantity}, price: ${price}, total: ${quantity * price}`
        );
        return formatPrice(quantity * price);
      },
    },
  ];

  // Функция для корректного отображения информации о пользователе
  const formatUserInfo = (user: string | User | null | undefined): string => {
    if (!user) return '—';

    if (typeof user === 'string') return user;

    if (typeof user === 'object') {
      // Сначала пробуем показать имя и фамилию
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName) return fullName;

      // Если имени нет, показываем email
      if (user.email) return user.email;

      // В последнюю очередь показываем ID или дефолтное значение
      return user.id || '—';
    }

    return '—';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (shopId) {
              navigate(`/manager/${shopId}/warehouse/incoming`);
            } else {
              navigate('/manager/warehouse/incoming');
            }
          }}
          className="mr-2"
        >
          Назад
        </Button>
        <Title level={2} className="mb-0 ml-2">
          Детали прихода
        </Title>
      </div>

      <div className="flex justify-end mb-4">
        <Space>
          {enhancedPurchase.status !== 'completed' && (
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                if (shopId) {
                  navigate(
                    `/manager/${shopId}/warehouse/purchases/edit/${enhancedPurchase.id}`
                  );
                } else {
                  navigate(
                    `/manager/warehouse/purchases/edit/${enhancedPurchase.id}`
                  );
                }
              }}
            >
              Редактировать
            </Button>
          )}
          <Button icon={<PrinterOutlined />}>Печать</Button>
        </Space>
      </div>

      <Card className="mb-6">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Статус">
            <Tag
              color={enhancedPurchase.status === 'completed' ? 'green' : 'blue'}
            >
              {enhancedPurchase.status === 'completed'
                ? 'Завершен'
                : 'Черновик'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Номер накладной">
            {enhancedPurchase.number || enhancedPurchase.invoiceNumber || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Поставщик">
            {enhancedPurchase.supplierName ||
              enhancedPurchase.supplier?.name ||
              '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Магазин" span={2}>
            <div>
              <span className="font-medium">
                {enhancedPurchase.shop?.name || '—'}
              </span>
              {enhancedPurchase.shop?.address && (
                <div className="text-xs text-gray-500 mt-1">
                  Адрес: {enhancedPurchase.shop.address}
                </div>
              )}
            </div>
          </Descriptions.Item>
          {enhancedPurchase.comment && (
            <Descriptions.Item label="Комментарий" span={2}>
              {enhancedPurchase.comment}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Создал">
            {formatUserInfo(enhancedPurchase.createdBy)}
          </Descriptions.Item>
          <Descriptions.Item label="Когда">
            {enhancedPurchase.createdAt
              ? formatDate(enhancedPurchase.createdAt)
              : '—'}
          </Descriptions.Item>
          {enhancedPurchase.updatedBy &&
            enhancedPurchase.updatedBy !== enhancedPurchase.createdBy && (
              <>
                <Descriptions.Item label="Обновил">
                  {formatUserInfo(enhancedPurchase.updatedBy)}
                </Descriptions.Item>
                <Descriptions.Item label="Когда">
                  {enhancedPurchase.updatedAt
                    ? formatDate(enhancedPurchase.updatedAt)
                    : '—'}
                </Descriptions.Item>
              </>
            )}
        </Descriptions>
      </Card>

      <Card title={`Товары (${processedItems.length || 0})`}>
        <Table
          dataSource={processedItems}
          columns={columns}
          rowKey="id"
          pagination={false}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong>Итого:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>
                    {formatPrice(
                      processedItems.reduce(
                        (sum: number, item: PurchaseItem) => {
                          const quantity =
                            typeof item.quantity === 'number'
                              ? item.quantity
                              : 0;
                          const price =
                            typeof item.purchasePrice === 'number'
                              ? item.purchasePrice
                              : 0;
                          return sum + quantity * price;
                        },
                        0
                      )
                    )}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default PurchaseDetails;
