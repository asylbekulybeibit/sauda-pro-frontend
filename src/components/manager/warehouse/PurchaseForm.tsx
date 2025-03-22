import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  message,
  Spin,
  Empty,
  Table,
  Space,
  Typography,
  InputNumber,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShopContext } from '@/contexts/ShopContext';
import {
  getProducts,
  getSuppliers,
  getManagerShop,
  createPurchase,
  getPurchaseById,
  updatePurchaseDraft,
} from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { Product } from '@/types/product';
import { Purchase, PurchaseItem } from '@/types/purchase';

const { Option } = Select;
const { Title, Text } = Typography;

interface PurchaseFormProps {
  shopId: string;
  id?: string;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  shopId: propShopId,
  id: externalId,
}) => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const effectiveId = externalId || purchaseId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shopContext = useContext(ShopContext);

  console.log('===== PurchaseForm Debug =====');
  console.log('Props shopId:', propShopId);
  console.log('Props id:', externalId);
  console.log('URL purchaseId:', purchaseId);
  console.log('effectiveId:', effectiveId);
  console.log('URL:', window.location.href);
  console.log('===== End Debug =====');

  // Попытка получить shopId из query параметра в URL
  const getShopIdFromUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const shopIdParam = searchParams.get('shopId');
    // Проверяем, что это валидный UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (shopIdParam && uuidRegex.test(shopIdParam)) {
      return shopIdParam;
    }
    return null;
  };

  // Пробуем сначала получить из URL, затем из контекста
  const urlShopId = getShopIdFromUrl();
  const shopId = propShopId || urlShopId || shopContext?.currentShop?.id || '';

  console.log(
    'PurchaseForm rendered. ID:',
    effectiveId,
    'ShopID:',
    shopId,
    'URL ShopID:',
    urlShopId,
    'Context ShopID:',
    shopContext?.currentShop?.id,
    'ParamID:',
    purchaseId,
    'PropID:',
    externalId
  );

  // Show a clear message when no shop is selected
  if (!shopId) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <div className="text-center py-8">
            <Title level={4}>Не удалось определить магазин</Title>
            <p className="mb-4">
              Для создания прихода необходимо выбрать магазин. Пожалуйста,
              вернитесь на страницу выбора магазина и попробуйте снова.
            </p>
            <Button
              type="primary"
              onClick={() => navigate('/profile')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Вернуться к выбору магазина
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const [form] = Form.useForm();
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Fetch the necessary data
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => {
      console.log('Fetching products for shopId:', shopId);
      return getProducts(shopId);
    },
    enabled: !!shopId,
  });

  const {
    data: suppliers,
    isLoading: suppliersLoading,
    error: suppliersError,
  } = useQuery({
    queryKey: ['suppliers', shopId],
    queryFn: () => {
      console.log('Fetching suppliers for shopId:', shopId);
      return getSuppliers(shopId);
    },
    enabled: !!shopId,
  });

  const {
    data: shop,
    isLoading: shopLoading,
    error: shopError,
  } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => {
      console.log('Fetching shop details for shopId:', shopId);
      return getManagerShop(shopId);
    },
    enabled: !!shopId,
  });

  // Fetch existing purchase data for edit mode
  const {
    data: purchaseData,
    isLoading: isPurchaseLoading,
    error: purchaseError,
  } = useQuery({
    queryKey: ['purchase', effectiveId],
    queryFn: () => {
      console.log('Fetching purchase data for purchase ID:', effectiveId);

      if (!effectiveId) {
        console.log('No purchase ID provided - creating new purchase');
        // Для нового прихода просто возвращаем пустой объект
        return Promise.resolve(null);
      }

      return getPurchaseById(effectiveId, shopId);
    },
    enabled: !!effectiveId,
  });

  // Проверяем статус прихода, нельзя редактировать завершенные приходы
  useEffect(() => {
    if (purchaseData && purchaseData.status === 'completed') {
      message.warning(
        'Этот приход уже завершен и не может быть отредактирован'
      );
      // Перенаправляем на страницу деталей
      if (shopId) {
        navigate(`/manager/${shopId}/warehouse/purchases/${effectiveId}`);
      } else {
        navigate(`/manager/warehouse/purchases/${effectiveId}`);
      }
    }
  }, [purchaseData, effectiveId, shopId, navigate]);

  // Log errors more visibly
  if (productsError) {
    console.error('Products error:', productsError);
    setErrorMessages((prev) => [
      ...prev,
      `Ошибка загрузки товаров: ${
        productsError instanceof Error
          ? productsError.message
          : 'Неизвестная ошибка'
      }`,
    ]);
  }
  if (suppliersError) {
    console.error('Suppliers error:', suppliersError);
    setErrorMessages((prev) => [
      ...prev,
      `Ошибка загрузки поставщиков: ${
        suppliersError instanceof Error
          ? suppliersError.message
          : 'Неизвестная ошибка'
      }`,
    ]);
  }
  if (shopError) {
    console.error('Shop error:', shopError);
    setErrorMessages((prev) => [
      ...prev,
      `Ошибка загрузки данных магазина: ${
        shopError instanceof Error ? shopError.message : 'Неизвестная ошибка'
      }`,
    ]);
  }
  if (purchaseError) {
    console.error('Purchase error:', purchaseError);
    setErrorMessages((prev) => [
      ...prev,
      `Ошибка загрузки данных прихода: ${
        purchaseError instanceof Error
          ? purchaseError.message
          : 'Неизвестная ошибка'
      }`,
    ]);
  }

  // Create purchase mutation
  const createPurchaseMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: (data) => {
      console.log('Purchase created successfully in mutation callback:', data);

      // Проверяем наличие ID в ответе
      if (!data || !data.id) {
        console.error('Response is missing ID:', data);
        message.warning(
          'Приход создан, но не удалось получить его ID для навигации'
        );
        // Перенаправляем на страницу со списком приходов
        queryClient.invalidateQueries({ queryKey: ['purchases'] });
        navigate('/manager/warehouse/incoming');
        return;
      }

      // Выводим ID для диагностики
      console.log('Created purchase ID:', data.id);
      console.log('Type of ID:', typeof data.id);
      message.success('Приход успешно создан');

      // Инвалидируем кэш и перенаправляем на детали нового прихода
      queryClient.invalidateQueries({ queryKey: ['purchases'] });

      // Проверка формата UUID для ID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof data.id === 'string' && uuidRegex.test(data.id)) {
        console.log(`Navigating to /manager/warehouse/purchases/${data.id}`);
        navigate(`/manager/warehouse/purchases/${data.id}`);
      } else if (typeof data.id === 'number') {
        const stringId = String(data.id);
        console.log(`Navigating to /manager/warehouse/purchases/${stringId}`);
        navigate(`/manager/warehouse/purchases/${stringId}`);
      } else {
        console.error('Invalid purchase ID format:', data.id);
        message.warning(
          'Приход создан, но не удалось перейти к его деталям из-за некорректного формата ID'
        );
        navigate('/manager/warehouse/incoming');
      }
    },
    onError: (error: any) => {
      console.error('Error creating purchase in mutation callback:', error);

      // Выводим детали ошибки для диагностики
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else if (error.request) {
        console.error('Request was made but no response was received');
        console.error('Request:', error.request);
      }

      const errorMessage = error.message || 'Неизвестная ошибка';
      message.error(`Ошибка при создании прихода: ${errorMessage}`);

      // Добавляем ошибку в список для отображения
      setErrorMessages((prev) => [
        ...prev,
        `Ошибка при создании прихода: ${errorMessage}`,
      ]);
    },
  });

  // Update purchase mutation
  const updatePurchaseMutation = useMutation({
    mutationFn: (data: { id: string; data: any }) => {
      console.log('Updating purchase:', data.id, data.data);
      return updatePurchaseDraft(data.id, data.data);
    },
    onSuccess: () => {
      console.log('Purchase updated successfully');
      message.success('Приход успешно обновлен');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      navigate('/manager/warehouse/incoming');
    },
    onError: (error: any) => {
      console.error('Error updating purchase:', error);
      message.error(`Ошибка при обновлении прихода: ${error.message}`);
      // Добавляем ошибку в список для отображения
      setErrorMessages((prev) => [
        ...prev,
        `Ошибка при обновлении прихода: ${error.message}`,
      ]);
    },
  });

  // Initialize form with purchase data if editing
  useEffect(() => {
    if (purchaseData) {
      form.setFieldsValue({
        date: purchaseData.date ? dayjs(purchaseData.date) : dayjs(),
        supplierId: purchaseData.supplierId,
        invoiceNumber: purchaseData.number,
        comment: purchaseData.comment,
      });

      if (purchaseData.items && purchaseData.items.length > 0) {
        setPurchaseItems(
          purchaseData.items.map((item) => ({
            ...item,
            id: item.id || uuidv4(),
          }))
        );
      }
    }
  }, [purchaseData, form]);

  // Более явное отображение различных состояний загрузки
  console.log('===== Состояние загрузки компонентов =====');
  console.log('Products loading:', productsLoading);
  console.log('Suppliers loading:', suppliersLoading);
  console.log('Shop loading:', shopLoading);
  console.log('Purchase loading:', isPurchaseLoading);
  console.log('===== Конец состояний загрузки =====');

  // Set shop id if not already set
  useEffect(() => {
    if (shop && !form.getFieldValue('shopId')) {
      form.setFieldsValue({
        shopId: shop.id,
      });
      console.log('Установлен ID магазина в форме:', shop.id);
    }
  }, [shop, form]);

  // Handle adding product to the purchase
  const handleAddProduct = () => {
    if (!selectedProduct) {
      message.error('Выберите товар');
      return;
    }

    const productToAdd = products?.find((p) => p.id === selectedProduct);
    if (!productToAdd) {
      message.error('Товар не найден');
      return;
    }

    // Check if product already exists in the list
    const existingItemIndex = purchaseItems.findIndex(
      (item) =>
        item.productId === productToAdd.id || item.id === productToAdd.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...purchaseItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setPurchaseItems(updatedItems);
    } else {
      // Add new item
      const newItem: PurchaseItem = {
        id: uuidv4(),
        productId: productToAdd.id,
        name: productToAdd.name,
        sku: productToAdd.sku,
        barcode: productToAdd.barcode,
        barcodes: productToAdd.barcodes,
        purchasePrice: productToAdd.purchasePrice || 0,
        sellingPrice: productToAdd.sellingPrice || 0,
        quantity: quantity,
        product: productToAdd,
      };

      setPurchaseItems((prev) => [...prev, newItem]);
    }

    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
    message.success(`Товар "${productToAdd.name}" добавлен в приход`);
  };

  // Handle removing an item from the purchase
  const handleRemoveItem = (itemId: string) => {
    setPurchaseItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    console.log('Form submission started with values:', values);
    console.log('Shop ID:', shopId);

    // Очищаем предыдущие сообщения об ошибках
    setErrorMessages([]);

    // Устанавливаем состояние загрузки
    setIsLoading(true);

    try {
      // Создаем минимальный набор данных для создания прихода
      const purchaseData = {
        shopId: shopId,
        date: values.date
          ? values.date.format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
        // Добавляем необязательные поля, только если они указаны
        ...(values.supplierId && { supplierId: values.supplierId }),
        ...(values.invoiceNumber && { invoiceNumber: values.invoiceNumber }),
        ...(values.comment && { comment: values.comment }),
        // Для элементов списка используем только существующие или пустой массив
        items:
          purchaseItems.length > 0
            ? purchaseItems.map((item) => ({
                productId: item.productId || item.id,
                quantity: item.quantity,
                price: item.purchasePrice,
              }))
            : [],
        // Статус всегда draft для нового прихода
        status: 'draft',
      };

      console.log('Prepared purchase data:', purchaseData);

      // Создаем новый приход или обновляем существующий
      if (effectiveId) {
        console.log('Updating existing purchase with ID:', effectiveId);
        const result = await updatePurchaseMutation.mutateAsync({
          id: effectiveId,
          data: purchaseData,
        });

        message.success('Приход успешно обновлен');
        // Перенаправляем на страницу списка приходов
        navigate('/manager/warehouse/incoming');
      } else {
        console.log('Creating new purchase...');

        try {
          const result = await createPurchaseMutation.mutateAsync(purchaseData);
          console.log('Purchase created successfully:', result);

          message.success('Приход успешно создан');

          // Если есть ID, перенаправляем на страницу деталей
          if (result && result.id) {
            navigate(`/manager/warehouse/purchases/${result.id}`);
          } else {
            // Иначе просто на список приходов
            navigate('/manager/warehouse/incoming');
          }
        } catch (apiError: any) {
          // Обрабатываем ошибку API
          console.error('API error during purchase creation:', apiError);

          let errorMessage = 'Ошибка при создании прихода';

          if (apiError.response?.data?.message) {
            errorMessage = `${errorMessage}: ${apiError.response.data.message}`;
          } else if (apiError.message) {
            errorMessage = `${errorMessage}: ${apiError.message}`;
          }

          message.error(errorMessage);
          setErrorMessages([errorMessage]);
        }
      }
    } catch (error: any) {
      // Обрабатываем общую ошибку
      console.error('General error during form submission:', error);

      const errorMessage = `Ошибка: ${error.message || 'Что-то пошло не так'}`;
      message.error(errorMessage);
      setErrorMessages([errorMessage]);
    } finally {
      // В любом случае снимаем состояние загрузки
      setIsLoading(false);
    }
  };

  // Table columns for the items list
  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PurchaseItem) => (
        <div>
          <div>{text}</div>
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
      render: (quantity: number, record: PurchaseItem) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => {
            const newItems = purchaseItems.map((item) =>
              item.id === record.id ? { ...item, quantity: value || 1 } : item
            );
            setPurchaseItems(newItems);
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Цена закупки',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 150,
      render: (price: number, record: PurchaseItem) => (
        <InputNumber
          min={0}
          step={0.01}
          value={price}
          onChange={(value) => {
            const newItems = purchaseItems.map((item) =>
              item.id === record.id
                ? { ...item, purchasePrice: value || 0 }
                : item
            );
            setPurchaseItems(newItems);
          }}
          style={{ width: '100%' }}
          addonAfter="₸"
        />
      ),
    },
    {
      title: 'Сумма',
      key: 'total',
      width: 120,
      render: (_: any, record: PurchaseItem) =>
        formatPrice(record.quantity * record.purchasePrice),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 80,
      render: (_: any, record: PurchaseItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.id)}
        />
      ),
    },
  ];

  const isFormLoading =
    productsLoading || suppliersLoading || shopLoading || isPurchaseLoading;

  // Очистка ошибок при изменении выбранного продукта, количества или изменении списка товаров
  useEffect(() => {
    if (errorMessages.length > 0) {
      setErrorMessages([]);
    }
  }, [selectedProduct, quantity, purchaseItems.length]);

  // При изменении статуса загрузки сбрасываем ошибки
  useEffect(() => {
    const isLoading =
      productsLoading || suppliersLoading || shopLoading || isPurchaseLoading;
    if (isLoading) {
      setErrorMessages([]);
    }
  }, [productsLoading, suppliersLoading, shopLoading, isPurchaseLoading]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card title={effectiveId ? 'Редактирование прихода' : 'Создание прихода'}>
        {isFormLoading && (
          <div className="p-4 mb-4 bg-blue-50 border-l-4 border-blue-400">
            <div className="flex items-center">
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 18 }} spin />}
                className="mr-2"
              />
              <span>Загрузка данных, пожалуйста, подождите...</span>
            </div>
          </div>
        )}

        {errorMessages.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <h3 className="text-red-700 font-medium">Обнаружены ошибки:</h3>
            <ul className="list-disc pl-5 text-red-600">
              {errorMessages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: dayjs(),
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="date"
              label="Дата прихода"
              rules={[{ required: true, message: 'Укажите дату прихода' }]}
            >
              <DatePicker style={{ width: '100%' }} disabled={isLoading} />
            </Form.Item>

            <Form.Item name="supplierId" label="Поставщик">
              <Select
                placeholder={
                  suppliersLoading
                    ? 'Загрузка поставщиков...'
                    : 'Выберите поставщика'
                }
                allowClear
                loading={suppliersLoading}
                disabled={isLoading || suppliersLoading}
              >
                {suppliers?.map((supplier) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="invoiceNumber" label="Номер накладной">
              <Input
                placeholder="Введите номер накладной"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="comment"
              label="Комментарий"
              className="md:col-span-3"
            >
              <Input.TextArea
                rows={2}
                placeholder="Комментарий к приходу"
                disabled={isLoading}
              />
            </Form.Item>
          </div>

          <Divider>Список товаров</Divider>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Form.Item label="Товар" className="md:col-span-2">
              <Select
                showSearch
                placeholder={
                  productsLoading ? 'Загрузка товаров...' : 'Выберите товар'
                }
                value={selectedProduct}
                onChange={setSelectedProduct}
                filterOption={(input, option) =>
                  option?.children
                    ?.toString()
                    .toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                }
                disabled={isLoading || productsLoading || !products}
                loading={productsLoading}
              >
                {products?.map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Количество">
              <InputNumber
                min={1}
                value={quantity}
                onChange={(value) => setQuantity(value || 1)}
                style={{ width: '100%' }}
                disabled={isLoading || !selectedProduct}
              />
            </Form.Item>

            <Form.Item label=" " colon={false}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddProduct}
                style={{ width: '100%' }}
                disabled={isLoading || !selectedProduct}
              >
                Добавить
              </Button>
            </Form.Item>
          </div>

          <Table
            dataSource={purchaseItems}
            columns={columns}
            rowKey="id"
            pagination={false}
            locale={{
              emptyText: productsLoading
                ? 'Загрузка товаров...'
                : 'Товары не добавлены',
            }}
            loading={isLoading}
          />

          <div className="mt-4 flex justify-end">
            <Space>
              <Button
                onClick={() => navigate('/manager/warehouse/incoming')}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isLoading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Сохранить
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default PurchaseForm;
