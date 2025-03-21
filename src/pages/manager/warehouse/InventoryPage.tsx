import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Table,
  Tag,
  Spin,
  message,
  Modal,
  Descriptions,
  Divider,
  Card,
  List,
  Tooltip,
  Space,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getInventory } from '@/services/managerApi';
import { formatDate, getTimeAgo } from '@/utils/format';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { InventoryForm } from '@/components/manager/warehouse/InventoryForm';
import { Product } from '@/types/product';
import { InventoryTransaction } from '@/types/inventory';
import { useQueryClient } from '@tanstack/react-query';

interface ProductWithInventory extends Product {
  lastInventoryDate?: string | null;
  hasDifference?: boolean;
  differencePercent?: number;
}

// Интерфейс для группировки транзакций по дате
interface GroupedTransaction {
  date: string;
  transactions: InventoryTransaction[];
}

function InventoryPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dataError, setDataError] = useState<string | null>(null);
  const initialLoadRef = useRef(true);
  const productsSnapshotRef = useRef<ProductWithInventory[] | null>(null);
  const [tableData, setTableData] = useState<ProductWithInventory[] | null>(
    null
  );
  const [blockAutoUpdate, setBlockAutoUpdate] = useState(false);
  const isMountedRef = useRef(false);

  // Состояние для модального окна с историей инвентаризаций
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithInventory | null>(null);
  const [inventoryHistory, setInventoryHistory] = useState<
    GroupedTransaction[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    console.log('InventoryPage mounted, forcing data refresh');
    isMountedRef.current = true;

    const forceDataRefresh = async () => {
      try {
        setBlockAutoUpdate(false);

        setLastUpdate(new Date());

        setDataError(null);

        queryClient.invalidateQueries({ queryKey: ['products', shopId] });
        queryClient.invalidateQueries({ queryKey: ['inventory', shopId] });
      } catch (error) {
        console.error('Error during initial data refresh:', error);
      }
    };

    if (initialLoadRef.current) {
      forceDataRefresh();
      initialLoadRef.current = false;
    }

    return () => {
      console.log('InventoryPage unmounting');
      isMountedRef.current = false;
    };
  }, [shopId, queryClient]);

  const shouldAutoRefetchData = !showForm && !blockAutoUpdate;

  // Запрос данных о продуктах
  const {
    data: products,
    isLoading,
    refetch,
    error,
    isFetching,
  } = useQuery<ProductWithInventory[]>({
    queryKey: ['products', shopId],
    queryFn: async () => {
      if (blockAutoUpdate && tableData) {
        console.log(
          'Auto updates blocked, returning current table data without API call'
        );
        return tableData as ProductWithInventory[];
      }

      console.log(`Fetching products and inventory data for shop: ${shopId}`);
      setDataError(null);

      try {
        const startTime = performance.now();

        const productsPromise = getProducts(shopId!).catch((error) => {
          console.error('Error fetching products:', error);
          setDataError('Не удалось загрузить товары');
          throw new Error('Не удалось загрузить товары');
        });

        const transactionsPromise = getInventory(shopId!).catch((error) => {
          console.error('Error fetching inventory transactions:', error);
          setDataError('Не удалось загрузить данные инвентаризации');
          throw new Error('Не удалось загрузить данные инвентаризации');
        });

        const [productsResponse, transactionsResponse] = await Promise.all([
          productsPromise,
          transactionsPromise,
        ]);

        const endTime = performance.now();
        console.log(
          `Data fetch completed in ${Math.round(endTime - startTime)}ms`
        );

        setLastUpdate(new Date());

        console.log(
          'Products API Response:',
          productsResponse?.length || 0,
          'items'
        );
        console.log(
          'Transactions API Response:',
          transactionsResponse?.length || 0,
          'transactions'
        );

        if (!productsResponse || !transactionsResponse) {
          console.error('Empty response from API');
          setDataError('Пустой ответ от сервера');
          throw new Error('Пустой ответ от сервера');
        }

        // Создаем Map для хранения информации о последней инвентаризации
        const inventoryInfoMap = new Map<
          string,
          {
            date: string;
            hasDifference: boolean;
            differencePercent?: number;
          }
        >();

        if (transactionsResponse && transactionsResponse.length > 0) {
          const adjustments = transactionsResponse
            .filter((tr) => tr.type === 'ADJUSTMENT')
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );

          console.log(`Found ${adjustments.length} adjustment transactions`);

          // Перебираем транзакции инвентаризации и сохраняем информацию
          adjustments.forEach((transaction) => {
            const productId = transaction.productId.toString();
            if (!inventoryInfoMap.has(productId)) {
              // Извлекаем информацию о расхождениях из metadata
              const metadata = (transaction as any).metadata || {};
              const difference = metadata.difference
                ? Number(metadata.difference)
                : 0;
              const currentQuantity = metadata.currentQuantity
                ? Number(metadata.currentQuantity)
                : 0;

              // Вычисляем процент расхождения
              const differencePercent = currentQuantity
                ? (Math.abs(difference) / currentQuantity) * 100
                : 0;

              inventoryInfoMap.set(productId, {
                date: transaction.createdAt,
                hasDifference: difference !== 0,
                differencePercent: differencePercent,
              });
            }
          });

          console.log('Inventory info map created:', inventoryInfoMap);
        } else {
          console.log('No transactions received or empty array');
        }

        const enrichedProducts = productsResponse.map((product) => {
          // Find the latest inventory transaction for this product
          const latestAdjustment = transactionsResponse
            .filter(
              (tr) =>
                tr.type === 'ADJUSTMENT' &&
                tr.productId.toString() === product.id.toString()
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0];

          const lastInventoryDate = latestAdjustment
            ? latestAdjustment.createdAt
            : null;

          // Create a properly typed ProductWithInventory object
          return {
            ...product,
            lastInventoryDate,
            hasDifference: false, // Set default values
            differencePercent: 0, // Set default values
            // Add other properties as needed
          } as ProductWithInventory;
        });

        return enrichedProducts;
      } catch (error) {
        console.error('Error in queryFn:', error);
        return [] as ProductWithInventory[]; // Return empty array on error with correct type
      }
    },
    enabled: !!shopId && shouldAutoRefetchData,
    staleTime: 60000, // 1 minute
  });

  // Запрос для истории инвентаризаций
  const { data: allTransactions, isLoading: isLoadingTransactions } = useQuery<
    InventoryTransaction[]
  >({
    queryKey: ['inventory', shopId],
    queryFn: () => getInventory(shopId!),
    enabled: !!shopId,
    staleTime: 0,
  });

  useEffect(() => {
    if (products && !showForm && !blockAutoUpdate && isMountedRef.current) {
      console.log('Updating table data with new products data');
      setTableData(products);
    }
  }, [products, showForm, blockAutoUpdate]);

  const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

  const handleOpenForm = () => {
    console.log('Opening inventory form');

    if (tableData) {
      console.log(
        'Creating snapshot of current table data before opening form'
      );
      productsSnapshotRef.current = deepClone(tableData);
    }

    setShowForm(true);
  };

  const handleCloseForm = () => {
    console.log('Closing inventory form without saving');

    setBlockAutoUpdate(true);

    setShowForm(false);

    if (productsSnapshotRef.current) {
      console.log('Restoring table data from snapshot after form cancel');
      setTableData(productsSnapshotRef.current);

      setTimeout(() => {
        setBlockAutoUpdate(false);
      }, 5000);
    }
  };

  const handleInventorySuccess = async () => {
    console.log('Inventory completed successfully, refreshing data');

    setBlockAutoUpdate(false);

    setShowForm(false);

    message.loading({
      content: 'Инвентаризация успешно создана, обновление данных...',
      key: 'inventoryUpdate',
      duration: 0,
    });

    try {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', shopId] });

      setLastUpdate(new Date());

      const result = await refetch();

      if (result.data) {
        setTableData(result.data);
      }

      message.success({
        content: 'Инвентаризация успешно создана и данные обновлены',
        key: 'inventoryUpdate',
        duration: 3,
      });

      console.log('Data successfully refreshed after inventory completion');
    } catch (error) {
      console.error('Error refreshing data after inventory:', error);

      message.error({
        content: 'Ошибка при обновлении данных. Попробуйте обновить страницу.',
        key: 'inventoryUpdate',
        duration: 5,
      });
    }
  };

  // Функция для открытия модального окна с историей инвентаризаций
  const handleViewHistory = async (product: ProductWithInventory) => {
    setSelectedProduct(product);
    setIsHistoryModalVisible(true);
    setIsLoadingHistory(true);

    try {
      if (allTransactions) {
        // Фильтруем транзакции только для выбранного продукта и только инвентаризации (ADJUSTMENT)
        const productAdjustments = allTransactions.filter(
          (trans) =>
            trans.productId.toString() === product.id.toString() &&
            trans.type === 'ADJUSTMENT'
        );

        // Группируем транзакции по дате
        const groupedByDate = productAdjustments.reduce(
          (groups: GroupedTransaction[], transaction) => {
            const date = new Date(transaction.createdAt)
              .toISOString()
              .split('T')[0];

            // Ищем существующую группу для этой даты
            const existingGroup = groups.find((group) => group.date === date);

            if (existingGroup) {
              existingGroup.transactions.push(transaction);
            } else {
              groups.push({
                date,
                transactions: [transaction],
              });
            }

            return groups;
          },
          []
        );

        // Сортируем группы по дате (сначала новые)
        groupedByDate.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Внутри каждой группы сортируем транзакции по времени (сначала новые)
        groupedByDate.forEach((group) => {
          group.transactions.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setInventoryHistory(groupedByDate);
      }
    } catch (error) {
      console.error('Error fetching inventory history:', error);
      message.error('Не удалось загрузить историю инвентаризаций');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Артикул',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Штрих-код',
      dataIndex: 'barcode',
      key: 'barcode',
    },
    {
      title: 'Текущий остаток',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Последняя инвентаризация',
      dataIndex: 'lastInventoryDate',
      key: 'lastInventoryDate',
      render: (date: string) => {
        if (!date) return <span className="text-red-500">Не проводилась</span>;

        try {
          const formattedDate = formatDate(date);
          const dateObj = new Date(date);
          const timeAgo = getTimeAgo(dateObj);

          return (
            <div>
              <div>{formattedDate}</div>
              <div className="text-xs text-gray-500">{timeAgo}</div>
            </div>
          );
        } catch (e) {
          console.error('Ошибка при форматировании даты:', e, date);
          return <span className="text-red-500">Ошибка даты</span>;
        }
      },
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_: unknown, record: ProductWithInventory) => {
        if (!record.lastInventoryDate) {
          return <Tag color="red">Требуется проверка</Tag>;
        }

        try {
          const lastInventoryTime = new Date(
            record.lastInventoryDate
          ).getTime();
          const thirtyDaysAgo = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
          const needsInventory = lastInventoryTime < thirtyDaysAgo;

          // Определяем есть ли существенные расхождения (больше 5%)
          const hasSignificantDifference =
            record.hasDifference && (record.differencePercent ?? 0) > 5;

          // Определяем цвет и текст статуса
          if (needsInventory) {
            // Если инвентаризация давно - красный
            return (
              <Tooltip title="Последняя инвентаризация проводилась более 30 дней назад">
                <Tag color="red">Требуется проверка</Tag>
              </Tooltip>
            );
          } else if (hasSignificantDifference) {
            // Если недавно, но с большими расхождениями - желтый
            return (
              <Tooltip
                title={`В последней инвентаризации обнаружены значительные расхождения (${(
                  record.differencePercent ?? 0
                ).toFixed(1)}%)`}
              >
                <Tag color="orange">Требует внимания</Tag>
              </Tooltip>
            );
          } else {
            // Если недавно и без больших расхождений - зеленый
            return (
              <Tooltip title="Инвентаризация проведена недавно, существенных расхождений не обнаружено">
                <Tag color="green">В норме</Tag>
              </Tooltip>
            );
          }
        } catch (e) {
          console.error('Ошибка при обработке даты инвентаризации:', e);
          return <Tag color="red">Требуется проверка</Tag>;
        }
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: ProductWithInventory) => (
        <Tooltip title="Просмотр истории инвентаризаций">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewHistory(record)}
            type="link"
          />
        </Tooltip>
      ),
    },
  ];

  if (isLoading && !tableData) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" tip="Загрузка данных инвентаризации..." />
      </div>
    );
  }

  if ((error || dataError) && !tableData) {
    const errorMessage =
      dataError ||
      (error instanceof Error ? error.message : 'Неизвестная ошибка');

    return (
      <div className="flex flex-col justify-center items-center h-full">
        <div className="text-red-500 text-lg mb-4">
          Ошибка при загрузке данных инвентаризации
        </div>
        <div className="mb-4">{errorMessage}</div>
        <Button
          type="primary"
          onClick={() => refetch()}
          className="bg-blue-500"
        >
          Повторить загрузку
        </Button>
      </div>
    );
  }

  if ((!tableData || tableData.length === 0) && !showForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Инвентаризация</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenForm}
            className="bg-blue-500"
          >
            Начать инвентаризацию
          </Button>
        </div>

        <div className="p-6 bg-gray-50 rounded text-center">
          <p className="text-gray-500 mb-4">
            Товары не найдены или еще не добавлены
          </p>
        </div>

        <div className="text-right text-sm text-gray-500">
          Данные обновлены: {lastUpdate.toLocaleTimeString()}
          {isFetching && !showForm && !blockAutoUpdate && ' (обновляется...)'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Инвентаризация</h1>
          {tableData && (
            <p className="text-gray-500 text-sm">
              Всего товаров: {tableData.length}, С проведенной инвентаризацией:{' '}
              {tableData.filter((p) => p.lastInventoryDate).length}
            </p>
          )}
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenForm}
          className="bg-blue-500"
          disabled={showForm}
        >
          Начать инвентаризацию
        </Button>
      </div>

      <div className="bg-gray-50 p-3 rounded my-3 text-sm text-gray-700">
        <p className="font-medium mb-1">Информация о статусах товаров:</p>
        <ul className="list-disc pl-5">
          <li>
            <Tag color="green">В норме</Tag> - инвентаризация проведена менее 30
            дней назад, расхождения незначительные (менее 5%)
          </li>
          <li>
            <Tag color="orange">Требует внимания</Tag> - инвентаризация
            проведена недавно, но обнаружены значительные расхождения (более 5%)
          </li>
          <li>
            <Tag color="red">Требуется проверка</Tag> - инвентаризация не
            проводилась или проводилась более 30 дней назад
          </li>
        </ul>
      </div>

      <Table
        columns={columns}
        dataSource={tableData || []}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        rowClassName={(record) => {
          if (!record.lastInventoryDate) return 'bg-red-50';
          try {
            const lastInventoryTime = new Date(
              record.lastInventoryDate
            ).getTime();
            const thirtyDaysAgo =
              new Date().getTime() - 30 * 24 * 60 * 60 * 1000;

            // Определяем есть ли существенные расхождения (больше 5%)
            const hasSignificantDifference =
              record.hasDifference && (record.differencePercent ?? 0) > 5;

            if (lastInventoryTime < thirtyDaysAgo) {
              return 'bg-red-50'; // Требуется проверка - красный фон
            } else if (hasSignificantDifference) {
              return 'bg-yellow-50'; // Требует внимания - желтый фон
            } else {
              return ''; // В норме - обычный фон
            }
          } catch (e) {
            return 'bg-red-50';
          }
        }}
        loading={isFetching && !showForm && !blockAutoUpdate && !tableData}
        footer={() => (
          <div className="text-right text-sm text-gray-500">
            Данные обновлены: {lastUpdate.toLocaleTimeString()}
            {isFetching && !showForm && !blockAutoUpdate && ' (обновляется...)'}
            {showForm && ' (обновление приостановлено)'}
          </div>
        )}
      />

      {showForm && (
        <InventoryForm
          shopId={shopId!}
          onClose={handleCloseForm}
          onSuccess={handleInventorySuccess}
        />
      )}

      {/* Модальное окно с историей инвентаризаций */}
      <Modal
        title={`История инвентаризаций: ${selectedProduct?.name || ''}`}
        open={isHistoryModalVisible}
        onCancel={() => setIsHistoryModalVisible(false)}
        width={800}
        footer={null}
      >
        {isLoadingHistory ? (
          <div className="text-center py-8">
            <Spin size="large" tip="Загрузка истории инвентаризаций..." />
          </div>
        ) : inventoryHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Нет истории инвентаризаций для этого товара
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-auto pb-4">
            {inventoryHistory.map((group, groupIndex) => (
              <Card
                key={groupIndex}
                title={`Дата: ${new Date(group.date).toLocaleDateString()}`}
                className="mb-4"
                type="inner"
              >
                <List
                  dataSource={group.transactions}
                  renderItem={(transaction, index) => {
                    // Извлекаем метаданные инвентаризации
                    const metadata = (transaction as any).metadata || {};
                    const difference = metadata.difference || 0;
                    const currentQuantity = metadata.currentQuantity || 0;

                    return (
                      <List.Item key={index}>
                        <Card className="w-full" size="small">
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="Время">
                              {new Date(
                                transaction.createdAt
                              ).toLocaleTimeString()}
                            </Descriptions.Item>
                            <Descriptions.Item label="Текущий остаток">
                              {transaction.quantity}
                            </Descriptions.Item>
                            {currentQuantity !== undefined && (
                              <Descriptions.Item label="Предыдущий остаток">
                                {currentQuantity}
                              </Descriptions.Item>
                            )}
                            {difference !== undefined && (
                              <Descriptions.Item label="Расхождение">
                                <Tag
                                  color={
                                    difference < 0
                                      ? 'red'
                                      : difference > 0
                                      ? 'green'
                                      : 'blue'
                                  }
                                >
                                  {difference > 0
                                    ? `+${difference}`
                                    : difference}
                                </Tag>
                                {currentQuantity > 0 && (
                                  <Tag
                                    color={
                                      Math.abs(difference) / currentQuantity >
                                      0.05
                                        ? 'orange'
                                        : 'blue'
                                    }
                                    className="ml-2"
                                  >
                                    {(
                                      (Math.abs(difference) / currentQuantity) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </Tag>
                                )}
                              </Descriptions.Item>
                            )}
                            {currentQuantity !== undefined &&
                              difference !== undefined && (
                                <Descriptions.Item label="Статус">
                                  {Math.abs(difference) > 0 ? (
                                    <Tag
                                      color={
                                        Math.abs(difference) / currentQuantity >
                                        0.05
                                          ? 'orange'
                                          : 'blue'
                                      }
                                    >
                                      {Math.abs(difference) / currentQuantity >
                                      0.05
                                        ? 'Значительное расхождение'
                                        : 'Незначительное расхождение'}
                                    </Tag>
                                  ) : (
                                    <Tag color="green">Без расхождений</Tag>
                                  )}
                                </Descriptions.Item>
                              )}
                            {((transaction as any).createdBy && (
                              <Descriptions.Item label="Кто провел">
                                {
                                  ((transaction as any).createdBy as any)
                                    .firstName
                                }{' '}
                                {
                                  ((transaction as any).createdBy as any)
                                    .lastName
                                }
                              </Descriptions.Item>
                            )) || (
                              <Descriptions.Item label="Кто провел">
                                Неизвестно
                              </Descriptions.Item>
                            )}
                            {transaction.comment && (
                              <Descriptions.Item label="Комментарий к товару">
                                {transaction.comment}
                              </Descriptions.Item>
                            )}
                            {transaction.note && (
                              <Descriptions.Item label="Общий комментарий">
                                {transaction.note}
                              </Descriptions.Item>
                            )}
                            {transaction.description && (
                              <Descriptions.Item label="Описание">
                                {transaction.description}
                              </Descriptions.Item>
                            )}
                          </Descriptions>
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default InventoryPage;
