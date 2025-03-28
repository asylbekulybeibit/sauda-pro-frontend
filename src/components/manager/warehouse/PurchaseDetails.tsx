import React, { useContext, useState, useEffect } from 'react';
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
  FileExcelOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getPurchaseById, getProducts } from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
import { ShopContext } from '@/contexts/ShopContext';
import { PurchaseItem, User } from '@/types/purchase';
import * as XLSX from 'xlsx';
import { useRoleStore } from '@/store/roleStore';

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
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  // Пробуем получить shopId разными способами в порядке приоритета:
  // 1. Из параметров URL
  // 2. Извлекаем из пути URL
  // 3. Из контекста
  const shopIdFromPath = extractShopIdFromPath(location.pathname);
  const shopId =
    shopIdFromParams || shopIdFromPath || shopContext?.currentShop?.id;

  // Получаем ID склада из текущей роли менеджера
  useEffect(() => {
    if (currentRole && currentRole.type === 'shop' && currentRole.warehouse) {
      setWarehouseId(currentRole.warehouse.id);
      console.log(
        '[PurchaseDetails] Установлен ID склада:',
        currentRole.warehouse.id
      );
    }
  }, [currentRole]);

  console.log(
    'PurchaseDetails rendered. ID:',
    id,
    'shopId:',
    shopId,
    'warehouseId:',
    warehouseId
  );

  // Fetch purchase data
  const {
    data: purchase,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['purchase', id, warehouseId],
    queryFn: () => {
      console.log('[PurchaseDetails] Fetching purchase data:', {
        id,
        warehouseId,
      });
      if (!id) {
        console.error('Missing required purchase ID');
        throw new Error('Missing required purchase ID');
      }

      if (!warehouseId) {
        console.error('Missing required warehouseId');
        throw new Error('Missing required warehouseId');
      }

      return getPurchaseById(id, warehouseId).then((data) => {
        console.log(
          '[PurchaseDetails] Purchase data received:',
          JSON.stringify(data, null, 2)
        );
        console.log('[PurchaseDetails] Warehouse info:', {
          warehouseId: data.warehouseId,
          warehouse: data.warehouse,
          warehouseName: data.warehouseName,
        });
        return data;
      });
    },
    enabled: !!id && !!warehouseId,
  });

  // Загружаем полную информацию о всех товарах для дополнения данных прихода
  const { data: allProducts } = useQuery({
    queryKey: ['products', warehouseId],
    queryFn: () =>
      warehouseId ? getProducts(warehouseId) : Promise.resolve([]),
    enabled: !!warehouseId,
  });

  if (error) {
    console.error('Error fetching purchase details:', error);
    message.error('Ошибка при загрузке данных прихода');
  }

  // Если warehouseId не определен, показываем загрузку
  if (!warehouseId) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
          <p className="ml-2 text-gray-500">Загрузка данных о складе...</p>
        </div>
      </div>
    );
  }

  console.log('Purchase data received:', purchase);

  // Процесс подготовки данных для отображения
  // Получаем дополнительную информацию о магазине если нужно
  const enhanceShopInfo = (purchase: any) => {
    const result = { ...purchase };
    console.log('[enhanceShopInfo] Input purchase data:', purchase);

    // Если в объекте есть информация о складе, но нет warehouse объекта, создаем его
    if (purchase.warehouseId && !purchase.warehouse) {
      result.warehouse = {
        id: purchase.warehouseId,
        name: purchase.warehouseName || `Склад #${purchase.warehouseId}`,
        address: purchase.warehouseAddress,
      };
      console.log(
        '[enhanceShopInfo] Created warehouse object:',
        result.warehouse
      );
    }

    // Если в объекте есть информация о магазине, но нет shop объекта, создаем его
    if (purchase.shopId) {
      result.shop = {
        ...purchase.shop,
        id: purchase.shopId,
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

    console.log('[enhanceShopInfo] Result:', result);
    return result;
  };

  // Функция для получения полных данных о товаре, включая штрихкоды
  const getFullProductInfo = (productId: string) => {
    if (!allProducts || !productId) return null;
    return allProducts.find((p) => p.id === productId);
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

    console.log(
      'Raw purchase items data:',
      JSON.stringify(purchaseData.items, null, 2)
    );

    return purchaseData.items.map((item: any, index: number) => {
      console.log(`Processing item #${index}:`, JSON.stringify(item, null, 2));

      // Get full product info if available
      const fullProductInfo = item.productId
        ? getFullProductInfo(item.productId)
        : null;

      // Ensure we have valid data
      const preparedItem: PurchaseItem = {
        ...item,
        id: item.id || String(Math.random()),
        name:
          item.name ||
          (item.product
            ? item.product.name
            : fullProductInfo?.name || 'Товар без названия'),
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
      };

      // Handle price - try all possible sources
      let price = null;
      if (typeof item.price === 'number' && !isNaN(item.price)) {
        price = item.price;
        console.log(`Using item.price: ${price}`);
      } else if (
        typeof item.purchasePrice === 'number' &&
        !isNaN(item.purchasePrice)
      ) {
        price = item.purchasePrice;
        console.log(`Using item.purchasePrice: ${price}`);
      } else if (
        item.product &&
        typeof item.product.purchasePrice === 'number'
      ) {
        price = item.product.purchasePrice;
        console.log(`Using item.product.purchasePrice: ${price}`);
      } else if (
        fullProductInfo &&
        typeof fullProductInfo.purchasePrice === 'number'
      ) {
        price = fullProductInfo.purchasePrice;
        console.log(`Using fullProductInfo.purchasePrice: ${price}`);
      }

      // Make sure we always have a price
      preparedItem.price = price !== null ? price : 0;
      preparedItem.purchasePrice = price !== null ? price : 0;

      console.log(`Final prepared item #${index}:`, {
        id: preparedItem.id,
        name: preparedItem.name,
        quantity: preparedItem.quantity,
        price: preparedItem.price,
        purchasePrice: preparedItem.purchasePrice,
      });

      return preparedItem;
    });
  };

  // Улучшенные данные о приходе с корректной информацией о магазине
  const enhancedPurchase = purchase ? enhanceShopInfo(purchase) : null;

  // Processed items for display
  const processedItems = enhancedPurchase
    ? prepareItemsData(enhancedPurchase)
    : [];

  // Расчет общей суммы прихода на основе обработанных товаров
  const itemsTotal = processedItems.reduce(
    (sum: number, item: PurchaseItem) => {
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const price =
        typeof item.purchasePrice === 'number' ? item.purchasePrice : 0;
      return sum + quantity * price;
    },
    0
  );

  // Console debugging to see structure
  console.log('Enhanced purchase data:', enhancedPurchase);
  console.log('Processed items for display:', processedItems);
  console.log('Calculated total amount:', itemsTotal);

  // Check for empty or loading state
  if (isLoading || !enhancedPurchase) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

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

  // Функция для экспорта данных прихода в Excel
  const exportToExcel = (purchase: any) => {
    try {
      console.log('Начинаем экспорт в Excel:', { purchase, processedItems });

      // Создаем заголовок для файла
      const fileTitle = `Приход_${purchase.invoiceNumber || purchase.id}_${
        new Date().toISOString().split('T')[0]
      }`;

      // Основная информация о приходе для первого листа
      const purchaseInfo = [
        ['Детали прихода', ''],
        ['Статус', purchase.status === 'completed' ? 'Завершен' : 'Черновик'],
        ['Номер накладной', purchase.invoiceNumber || purchase.number || '—'],
        ['Поставщик', purchase.supplierName || purchase.supplier?.name || '—'],
        ['Магазин', purchase.warehouse?.name || '—'],
        ['Адрес', purchase.warehouse?.address || '—'],       
        ['Создал', formatUserInfo(purchase.createdBy) || '—'],
        ['Дата создания', formatDate(purchase.createdAt) || '—'],
        ['Комментарий', purchase.comment || '—'],
        ['', ''],
        ['Общая сумма', formatPrice(purchase.totalAmount || itemsTotal)],
      ];

      // Данные товаров для второго листа
      const itemsData = [
        // Заголовки
        [
          'Название',          
          'Штрихкод',
          'Количество',
          'Цена закупки',
          'Сумма',
        ],
      ];

      // Используем processedItems вместо purchase.items, так как они уже правильно подготовлены
      console.log('Количество товаров для экспорта:', processedItems.length);

      if (processedItems && processedItems.length > 0) {
        processedItems.forEach((item: any, index: number) => {
          console.log(`Обработка товара #${index}:`, item);

          const quantity =
            typeof item.quantity === 'number' ? item.quantity : 0;
          const price =
            typeof item.purchasePrice === 'number' ? item.purchasePrice : 0;
          const total = quantity * price;

          // Получаем штрихкод из всех возможных источников
          let barcode = item.barcode || '—';

          // Логируем все возможные места, где может быть штрихкод
          console.log(`Поиск штрихкода для товара #${index}:`, {
            'item.barcode': item.barcode,
            'item.barcodes': item.barcodes,
          });

          // Дополнительная проверка для случая, когда штрихкод есть, но равен пустой строке
          if (barcode === '' || barcode === null || barcode === undefined) {
            barcode = '—';
          }

          // Форматируем числа для более удобного отображения
          const formattedPrice = new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(price);

          const formattedTotal = new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(total);

          console.log(`Подготовленные данные для товара #${index}:`, {
            name: item.name,
            barcode,
            quantity,
            price: formattedPrice,
            total: formattedTotal,
          });

          itemsData.push([
            item.name,           
            barcode,
            quantity.toString(),
            formattedPrice,
            formattedTotal,
          ]);
        });
      } else {
        console.warn('Нет данных о товарах для экспорта!');
        // Добавляем пустую строку с сообщением
        itemsData.push(['Нет данных о товарах', '', '', '', '', '']);
      }

      // Создаем рабочую книгу
      const wb = XLSX.utils.book_new();

      // Добавляем первый лист с общей информацией
      const ws1 = XLSX.utils.aoa_to_sheet(purchaseInfo);
      XLSX.utils.book_append_sheet(wb, ws1, 'Информация о приходе');

      // Добавляем второй лист с товарами
      const ws2 = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Товары');

      // Сохраняем файл
      XLSX.writeFile(wb, `${fileTitle}.xlsx`);

      message.success('Данные успешно экспортированы в Excel');
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      message.error('Не удалось экспортировать данные в Excel');
    }
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
                if (shopId && warehouseId) {
                  navigate(
                    `/manager/${shopId}/warehouse/purchases/edit/${enhancedPurchase.id}?warehouseId=${warehouseId}`
                  );
                } else if (warehouseId) {
                  navigate(
                    `/manager/warehouse/purchases/edit/${enhancedPurchase.id}?warehouseId=${warehouseId}`
                  );
                } else {
                  message.error('Не удалось определить ID склада');
                }
              }}
            >
              Редактировать
            </Button>
          )}
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => exportToExcel(enhancedPurchase)}
          >
            Экспорт в Excel
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm mb-4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Статус">
            {purchase?.status === 'completed' ? (
              <Tag color="green">Завершен</Tag>
            ) : purchase?.status === 'draft' ? (
              <Tag color="orange">Черновик</Tag>
            ) : (
              <Tag color="red">Отменен</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Номер накладной">
            {purchase?.invoiceNumber || '—'}
          </Descriptions.Item>

          <Descriptions.Item label="Поставщик">
            {purchase?.supplier?.name || '—'}
          </Descriptions.Item>

          <Descriptions.Item label="Магазин">
            {purchase?.warehouse?.name || '—'}
            {purchase?.warehouse?.address && (
              <div className="text-gray-500 text-sm">
                {purchase?.warehouse?.address}
              </div>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Комментарий">
            {purchase?.comment || '—'}
          </Descriptions.Item>

          <Descriptions.Item label="Создал">
            {formatUserInfo(purchase?.createdBy)}
          </Descriptions.Item>

          <Descriptions.Item label="Когда">
            {purchase?.date ? formatDate(purchase.date) : '—'}
          </Descriptions.Item>

          <Descriptions.Item label="Общая сумма">
            <Text strong>{formatPrice(itemsTotal)}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`Товары (${processedItems.length || 0})`}>
        <Table
          dataSource={processedItems}
          columns={[
            {
              title: 'Название',
              dataIndex: 'name',
              key: 'name',
              render: (text: string) => text || 'Товар без названия',
            },
            {
              title: 'Штрихкод',
              dataIndex: 'barcode',
              key: 'barcode',
              width: 150,
              render: (barcode: string) => barcode || '—',
            },
            {
              title: 'Количество',
              dataIndex: 'quantity',
              key: 'quantity',
              width: 120,
              render: (quantity: number) => quantity || 0,
            },
            {
              title: 'Цена',
              dataIndex: 'price',
              key: 'price',
              width: 150,
              render: (_: any, record: PurchaseItem) => {
                // Try to get price from different possible sources
                const price = record.price || record.purchasePrice || 0;
                console.log('Rendering price for item:', {
                  name: record.name,
                  price: record.price,
                  purchasePrice: record.purchasePrice,
                  finalPrice: price,
                });
                return formatPrice(price);
              },
            },
            {
              title: 'Сумма',
              key: 'total',
              width: 150,
              render: (_: any, record: PurchaseItem) => {
                const quantity = record.quantity || 0;
                const price = record.price || record.purchasePrice || 0;
                const total = quantity * price;
                console.log('Calculating total for item:', {
                  name: record.name,
                  quantity,
                  price,
                  total,
                });
                return formatPrice(total);
              },
            },
          ]}
          rowKey="id"
          pagination={false}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong>Итого:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>{formatPrice(itemsTotal)}</Text>
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
