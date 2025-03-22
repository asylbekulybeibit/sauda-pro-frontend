import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Modal,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  DeleteOutlined,
  LoadingOutlined,
  BarcodeOutlined,
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
  createProduct,
  getCategories,
  createCategory,
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

  // Состояния для сканирования штрих-кода и создания нового товара
  const [barcodeInputVisible, setBarcodeInputVisible] =
    useState<boolean>(false);
  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [isScanningBarcode, setIsScanningBarcode] = useState<boolean>(false);
  const [newProductModalVisible, setNewProductModalVisible] =
    useState<boolean>(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const barcodeInputRef = useRef<any>(null);
  const [newProductForm] = Form.useForm();
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);

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

  // Получаем список категорий
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: () => {
      console.log('Fetching categories for shopId:', shopId);
      return getCategories(shopId);
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
  if (categoriesError) {
    console.error('Categories error:', categoriesError);
    setErrorMessages((prev) => [
      ...prev,
      `Ошибка загрузки категорий: ${
        categoriesError instanceof Error
          ? categoriesError.message
          : 'Неизвестная ошибка'
      }`,
    ]);
  }

  // Мутация для создания прихода
  const createPurchaseMutation = useMutation({
    mutationFn: (data: any) => createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  // Мутация для обновления прихода
  const updatePurchaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updatePurchaseDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  // Мутация для создания нового товара
  const createProductMutation = useMutation({
    mutationFn: (data: any) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      message.success('Товар успешно создан');
    },
    onError: (error: any) => {
      console.error('Error creating product:', error);
      message.error(`Ошибка при создании товара: ${error.message}`);
    },
  });

  // Мутация для создания новой категории
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', shopId] });
      message.success('Категория успешно создана');
    },
    onError: (error: any) => {
      console.error('Error creating category:', error);
      message.error(`Ошибка при создании категории: ${error.message}`);
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
  console.log('Categories loading:', categoriesLoading);
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

  // Показать модальное окно для сканирования штрих-кода
  const showBarcodeInput = () => {
    setBarcodeInputVisible(true);
    setIsScanningBarcode(true);
    setBarcodeValue('');

    // Автоматически фокусируемся на поле ввода
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, 100);
  };

  // Обработка ввода штрих-кода
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };

  // Поиск товара по штрих-коду и его добавление
  const handleBarcodeSubmit = () => {
    setIsScanningBarcode(false);

    if (!barcodeValue.trim()) {
      setBarcodeInputVisible(false);
      return;
    }

    // Поиск товара по штрих-коду
    const foundProduct = products?.find(
      (product) =>
        // Проверяем и в поле barcode, и в массиве barcodes
        product.barcode === barcodeValue ||
        (Array.isArray(product.barcodes) &&
          product.barcodes.includes(barcodeValue))
    );

    if (foundProduct) {
      // Добавляем найденный товар
      const existingItemIndex = purchaseItems.findIndex(
        (item) =>
          item.productId === foundProduct.id || item.id === foundProduct.id
      );

      if (existingItemIndex >= 0) {
        // Увеличиваем количество
        const updatedItems = [...purchaseItems];
        updatedItems[existingItemIndex].quantity += 1;
        setPurchaseItems(updatedItems);
        message.success(
          `Товар "${foundProduct.name}" добавлен (${updatedItems[existingItemIndex].quantity} шт.)`
        );
      } else {
        // Добавляем новый товар
        const newItem: PurchaseItem = {
          id: uuidv4(),
          productId: foundProduct.id,
          name: foundProduct.name,
          sku: foundProduct.sku,
          barcode: foundProduct.barcode,
          barcodes: foundProduct.barcodes,
          purchasePrice: foundProduct.purchasePrice || 0,
          sellingPrice: foundProduct.sellingPrice || 0,
          quantity: 1,
          product: foundProduct,
        };

        setPurchaseItems((prev) => [...prev, newItem]);
        message.success(`Товар "${foundProduct.name}" добавлен`);
      }
    } else {
      // Если товар не найден, предлагаем создать новый
      setScannedBarcode(barcodeValue);
      // Инициализируем форму нового товара
      newProductForm.setFieldsValue({
        barcode: barcodeValue,
        quantity: 1,
        minQuantity: 0,
        purchasePrice: 0,
        sellingPrice: 0,
      });
      setNewProductModalVisible(true);
    }

    setBarcodeInputVisible(false);
    setBarcodeValue('');
  };

  // Создание нового товара из модального окна
  const handleCreateNewProduct = async () => {
    try {
      const values = await newProductForm.validateFields();
      setIsCreatingProduct(true);

      // Если цена продажи не указана, устанавливаем её на основе закупочной с наценкой 20%
      if (!values.sellingPrice && values.purchasePrice) {
        values.sellingPrice =
          Math.round(values.purchasePrice * 1.2 * 100) / 100;
      }

      // Если артикул не указан, генерируем его автоматически
      if (!values.sku || values.sku.trim() === '') {
        // Генерируем артикул на основе первых 3 букв названия товара + случайное число
        const namePrefix = values.name.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(Math.random() * 10000);
        values.sku = `${namePrefix}${randomNum}`;
      }

      // Обработка категории с учетом режима tags
      let categoryId = null;

      // Проверяем, есть ли значение категории
      if (values.category) {
        // Если значение является массивом (режим tags), берем первый элемент
        let categoryValue = Array.isArray(values.category)
          ? values.category[0]
          : values.category;

        // Проверяем, является ли значение ID существующей категории
        const isExistingCategory = categories?.some(
          (cat) => cat.id === categoryValue
        );

        if (isExistingCategory) {
          // Это существующая категория, используем её ID
          categoryId = categoryValue;
        } else if (
          categoryValue &&
          typeof categoryValue === 'string' &&
          categoryValue.trim() !== ''
        ) {
          try {
            // Это новая категория, создаем её
            const newCategory = await createCategoryMutation.mutateAsync({
              name: categoryValue.trim(),
              shopId: shopId,
              isActive: true,
            });

            // Используем ID новой категории
            categoryId = newCategory.id;
            message.success(`Категория "${newCategory.name}" создана`);
          } catch (categoryError) {
            console.error('Error creating new category:', categoryError);
            // Продолжаем создание товара без категории
          }
        }
      }

      // Подготавливаем данные для создания нового товара
      const productData = {
        ...values,
        categoryId: categoryId, // Используем ID категории (новой или выбранной)
        shopId: shopId,
        barcodes: [values.barcode],
        isActive: true,
      };

      // Удаляем поле category, оно не нужно для создания товара
      if (productData.category) {
        delete productData.category;
      }

      console.log(
        'Creating product with data:',
        JSON.stringify(productData, null, 2)
      );

      // Создаем новый товар
      const newProduct = await createProductMutation.mutateAsync(productData);

      // Добавляем новый товар в список приходов
      const newItem: PurchaseItem = {
        id: uuidv4(),
        productId: newProduct.id,
        name: newProduct.name,
        sku: newProduct.sku,
        barcode: newProduct.barcode,
        barcodes: newProduct.barcodes,
        purchasePrice: newProduct.purchasePrice || values.purchasePrice,
        sellingPrice:
          newProduct.sellingPrice ||
          values.sellingPrice ||
          values.purchasePrice * 1.2,
        quantity: values.quantity || 1,
        product: newProduct,
      };

      setPurchaseItems((prev) => [...prev, newItem]);
      setNewProductModalVisible(false);
      setIsCreatingProduct(false);
      message.success(
        `Новый товар "${newProduct.name}" создан и добавлен в приход`
      );
    } catch (error: any) {
      console.error('Error creating new product:', error);
      setIsCreatingProduct(false);

      // Показываем более информативное сообщение об ошибке
      let errorMessage = 'Ошибка при создании товара';

      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }

      // Проверяем типичные ошибки
      if (errorMessage.includes('sku') && errorMessage.includes('NULL')) {
        errorMessage =
          'Ошибка: Артикул товара не может быть пустым. Пожалуйста, укажите артикул.';
      } else if (
        errorMessage.includes('артикулом') &&
        errorMessage.includes('уже существует')
      ) {
        errorMessage =
          'Ошибка: Товар с таким артикулом уже существует. Пожалуйста, используйте другой артикул или оставьте поле пустым для автоматической генерации.';
      } else if (errorMessage.includes('Категория не найдена')) {
        errorMessage =
          'Ошибка: Указанная категория не найдена. Пожалуйста, выберите другую категорию.';
      } else if (
        errorMessage.includes('Категория принадлежит другому магазину')
      ) {
        errorMessage =
          'Ошибка: Категория принадлежит другому магазину. Выберите категорию из текущего магазина.';
      }

      message.error(errorMessage);
      setErrorMessages((prev) => [...prev, errorMessage]);
    }
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
    productsLoading ||
    suppliersLoading ||
    shopLoading ||
    isPurchaseLoading ||
    categoriesLoading;

  // Очистка ошибок при изменении выбранного продукта, количества или изменении списка товаров
  useEffect(() => {
    if (errorMessages.length > 0) {
      setErrorMessages([]);
    }
  }, [selectedProduct, quantity, purchaseItems.length]);

  // При изменении статуса загрузки сбрасываем ошибки
  useEffect(() => {
    const isLoading =
      productsLoading ||
      suppliersLoading ||
      shopLoading ||
      isPurchaseLoading ||
      categoriesLoading;
    if (isLoading) {
      setErrorMessages([]);
    }
  }, [
    productsLoading,
    suppliersLoading,
    shopLoading,
    isPurchaseLoading,
    categoriesLoading,
  ]);

  useEffect(() => {
    // При обнаружении клавиатурных событий во время активного сканирования
    const handleBarcodeKeyDown = (e: KeyboardEvent) => {
      if (isScanningBarcode) {
        if (e.key === 'Enter') {
          handleBarcodeSubmit();
        } else if (e.key === 'Escape') {
          setBarcodeInputVisible(false);
          setIsScanningBarcode(false);
        }
      }
    };

    window.addEventListener('keydown', handleBarcodeKeyDown);
    return () => {
      window.removeEventListener('keydown', handleBarcodeKeyDown);
    };
  }, [isScanningBarcode, barcodeValue]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Модальное окно для сканирования штрих-кода */}
      <Modal
        title="Сканирование штрих-кода"
        open={barcodeInputVisible}
        onCancel={() => {
          setBarcodeInputVisible(false);
          setIsScanningBarcode(false);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setBarcodeInputVisible(false);
              setIsScanningBarcode(false);
            }}
          >
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleBarcodeSubmit}
          >
            Найти товар
          </Button>,
        ]}
      >
        <div className="py-4">
          <p className="mb-4">
            Отсканируйте штрих-код товара или введите его вручную:
          </p>
          <Input
            ref={barcodeInputRef}
            value={barcodeValue}
            onChange={handleBarcodeInputChange}
            placeholder="Штрих-код товара"
            autoFocus
            onPressEnter={handleBarcodeSubmit}
          />
        </div>
      </Modal>

      {/* Модальное окно для создания нового товара */}
      <Modal
        title="Создание нового товара"
        open={newProductModalVisible}
        onCancel={() => setNewProductModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setNewProductModalVisible(false)}>
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleCreateNewProduct}
            loading={isCreatingProduct}
          >
            Создать товар
          </Button>,
        ]}
        width={600}
      >
        <div className="py-4">
          <p className="mb-4">
            Товар со штрих-кодом <strong>{scannedBarcode}</strong> не найден.
            Создайте новый товар:
          </p>
          <p className="mb-4 text-sm text-gray-500">
            Обязательные поля: Название товара и Закупочная цена. Артикул будет
            сгенерирован автоматически, если не указан. Если цена продажи не
            указана, она будет автоматически рассчитана с наценкой 20% от
            закупочной. Категорию можно выбрать из списка или создать новую,
            просто введя её название в поле и нажав Enter.
          </p>

          <Form form={newProductForm} layout="vertical" requiredMark="optional">
            <Form.Item
              name="name"
              label="Название товара"
              rules={[{ required: true, message: 'Введите название товара' }]}
            >
              <Input placeholder="Введите название товара" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="barcode"
                label="Штрих-код"
                initialValue={scannedBarcode}
              >
                <Input disabled />
              </Form.Item>

              <Form.Item
                name="sku"
                label="Артикул"
                rules={[{ required: false }]}
                help="Необязательное поле. Если оставить пустым, будет сгенерировано автоматически. Если указать, должно быть уникальным для магазина."
              >
                <Input
                  placeholder="Артикул товара"
                  onPressEnter={handleCreateNewProduct}
                />
              </Form.Item>

              <Form.Item
                name="category"
                label="Категория"
                help="Выберите из списка или введите название новой категории и нажмите Enter"
              >
                <Select
                  placeholder="Выберите или создайте категорию"
                  allowClear
                  showSearch
                  style={{ width: '100%' }}
                  loading={categoriesLoading}
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={categories?.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                  notFoundContent={
                    categoriesLoading ? <Spin size="small" /> : null
                  }
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ padding: '0 8px 4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Чтобы создать новую категорию, просто введите её
                          название и нажмите Enter
                        </Text>
                      </div>
                    </>
                  )}
                  mode="tags"
                  maxTagCount={1}
                  tokenSeparators={[',']}
                />
              </Form.Item>

              <Form.Item
                name="quantity"
                label="Количество в приходе"
                initialValue={1}
                rules={[{ required: true, message: 'Введите количество' }]}
              >
                <InputNumber
                  placeholder="0"
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="minQuantity"
                label="Минимальное количество"
                initialValue={0}
              >
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="purchasePrice"
                label="Закупочная цена"
                rules={[{ required: true, message: 'Введите закупочную цену' }]}
              >
                <InputNumber
                  placeholder="0"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  addonAfter="₸"
                />
              </Form.Item>

              <Form.Item
                name="sellingPrice"
                label="Цена продажи"
                rules={[{ required: false, message: 'Введите цену продажи' }]}
                help="Необязательное поле. Можно заполнить позже."
              >
                <InputNumber
                  placeholder="0"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  addonAfter="₸"
                />
              </Form.Item>
            </div>

            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={4} placeholder="Описание товара" />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Card className="mb-6 shadow-sm">
        <div className="flex justify-between mb-4">
          <Title level={4} className="m-0">
            {effectiveId ? 'Редактирование прихода' : 'Создание прихода'}
          </Title>
        </div>

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
              <div className="flex items-center space-x-2">
                <Select
                  placeholder="Выберите товар"
                  showSearch
                  optionFilterProp="children"
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  style={{ width: 400 }}
                  loading={productsLoading}
                  filterOption={(input, option: any) => {
                    const productId = option?.value;
                    const product = products?.find((p) => p.id === productId);
                    if (!product) return false;

                    // Включаем поиск по имени, SKU, штрих-коду
                    return (
                      product.name
                        .toLowerCase()
                        .includes(input.toLowerCase()) ||
                      (product.sku &&
                        product.sku
                          .toLowerCase()
                          .includes(input.toLowerCase())) ||
                      (product.barcode &&
                        product.barcode
                          .toLowerCase()
                          .includes(input.toLowerCase())) ||
                      (Array.isArray(product.barcodes) &&
                        product.barcodes.some((barcode) =>
                          barcode.toLowerCase().includes(input.toLowerCase())
                        ))
                    );
                  }}
                >
                  {products?.map((product) => (
                    <Option key={product.id} value={product.id}>
                      {product.name} {product.sku ? `(${product.sku})` : ''}
                    </Option>
                  ))}
                </Select>

                <InputNumber
                  min={1}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                  placeholder="Кол-во"
                />

                <Button
                  type="primary"
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleAddProduct}
                  disabled={!selectedProduct}
                >
                  Добавить
                </Button>

                <Button
                  type="default"
                  icon={<BarcodeOutlined />}
                  onClick={showBarcodeInput}
                  title="Сканировать штрих-код"
                >
                  Сканировать
                </Button>
              </div>
            </Form.Item>

            <Form.Item label="Магазин" className="hidden">
              <Input
                value={shop?.name || shopId}
                disabled
                className="w-full p-2"
              />
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
