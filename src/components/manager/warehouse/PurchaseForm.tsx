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
  ExclamationCircleOutlined,
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
  createPurchaseWithoutSupplier,
} from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { Product } from '@/types/product';
import { Purchase, PurchaseItem } from '@/types/purchase';
import { useRoleStore } from '@/store/roleStore';

const { Option } = Select;
const { Title, Text } = Typography;

interface PurchaseFormProps {
  shopId: string;
  id?: string;
  warehouseId?: string;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  shopId: propShopId,
  id: externalId,
  warehouseId: propWarehouseId,
}) => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const effectiveId = externalId || purchaseId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shopContext = useContext(ShopContext);
  const { currentRole } = useRoleStore();
  const [warehouseId, setWarehouseId] = useState<string | undefined>(
    propWarehouseId
  );

  // Получаем ID склада из текущей роли менеджера, если он не передан в props
  useEffect(() => {
    if (
      !warehouseId &&
      currentRole &&
      currentRole.type === 'shop' &&
      currentRole.warehouse
    ) {
      setWarehouseId(currentRole.warehouse.id);
      console.log(
        '[PurchaseForm] Установлен ID склада из роли:',
        currentRole.warehouse.id
      );
    }
  }, [currentRole, warehouseId]);

  // Генерируем временный ID для нового прихода, если нет effectiveId
  const [tempId] = useState(() => {
    // Определяем, создаем ли мы новый приход
    const isNewPurchase = !effectiveId || effectiveId.indexOf('temp-') === 0;

    // Если создаем новый приход, очищаем предыдущие черновики и генерируем новый ID
    if (isNewPurchase) {
      // Очищаем все существующие черновики при создании нового прихода
      try {
        // Получаем shopId из разных источников для очистки
        const shopIdFromUrl = getShopIdFromUrl();
        const potentialShopId =
          propShopId || shopIdFromUrl || shopContext?.currentShop?.id;

        if (potentialShopId) {
          const draftKeyPrefix = `purchase_draft_${potentialShopId}_`;
          // Находим и удаляем все черновики для текущего магазина
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(draftKeyPrefix)) {
              console.log('Очищаем старый черновик прихода:', key);
              localStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при очистке предыдущих черновиков:', error);
      }

      return `temp-${uuidv4()}`;
    }

    // Для существующего прихода используем его ID
    return effectiveId;
  });

  console.log('===== PurchaseForm Debug =====');
  console.log('Props shopId:', propShopId);
  console.log('Props id:', externalId);
  console.log('URL purchaseId:', purchaseId);
  console.log('effectiveId:', effectiveId);
  console.log('tempId:', tempId);
  console.log('URL:', window.location.href);
  console.log('===== End Debug =====');

  // Попытка получить shopId из query параметра в URL
  const getShopIdFromUrl = () => {
    try {
      // Пробуем извлечь shopId из пути URL (формат: /manager/{shopId}/warehouse/...)
      const pathMatch = window.location.pathname.match(
        /\/manager\/([^\/]+)\/warehouse\//
      );
      if (pathMatch && pathMatch[1]) {
        // Проверка на UUID формат
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(pathMatch[1])) {
          console.log('Найден shopId в пути URL:', pathMatch[1]);
          return pathMatch[1];
        }
      }

      // Если не удалось найти в пути, пробуем query параметр
      const searchParams = new URLSearchParams(window.location.search);
      const shopIdParam = searchParams.get('shopId');
      // Проверяем, что это валидный UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (shopIdParam && uuidRegex.test(shopIdParam)) {
        console.log('Найден shopId в query параметре:', shopIdParam);
        return shopIdParam;
      }

      return null;
    } catch (error) {
      console.error('Ошибка при извлечении shopId из URL:', error);
      return null;
    }
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

  // Загрузка данных
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ['products', warehouseId],
    queryFn: () => {
      if (!warehouseId) {
        throw new Error('warehouseId не определен');
      }
      return getProducts(warehouseId);
    },
    enabled: !!warehouseId,
    staleTime: 1000 * 60 * 5, // 5 минут кэширования
  });

  // Загрузка поставщиков
  const {
    data: suppliers,
    isLoading: isLoadingSuppliers,
    error: suppliersError,
  } = useQuery({
    queryKey: ['suppliers', warehouseId],
    queryFn: () => {
      if (!warehouseId) {
        throw new Error('warehouseId не определен');
      }
      return getSuppliers(warehouseId);
    },
    enabled: !!warehouseId,
    staleTime: 1000 * 60 * 5, // 5 минут кэширования
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
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories', warehouseId],
    queryFn: () => {
      if (!warehouseId) {
        throw new Error('warehouseId не определен');
      }
      return getCategories(warehouseId);
    },
    enabled: !!warehouseId,
    staleTime: 1000 * 60 * 5, // 5 минут кэширования
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
  useEffect(() => {
    const newErrorMessages = [];

    if (productsError) {
      console.error('Products error:', productsError);
      newErrorMessages.push(
        `Ошибка загрузки товаров: ${
          productsError instanceof Error
            ? productsError.message
            : 'Неизвестная ошибка'
        }`
      );
    }

    if (suppliersError) {
      console.error('Suppliers error:', suppliersError);
      newErrorMessages.push(
        `Ошибка загрузки поставщиков: ${
          suppliersError instanceof Error
            ? suppliersError.message
            : 'Неизвестная ошибка'
        }`
      );
    }

    if (shopError) {
      console.error('Shop error:', shopError);
      newErrorMessages.push(
        `Ошибка загрузки данных магазина: ${
          shopError instanceof Error ? shopError.message : 'Неизвестная ошибка'
        }`
      );
    }

    if (purchaseError) {
      console.error('Purchase error:', purchaseError);
      newErrorMessages.push(
        `Ошибка загрузки данных прихода: ${
          purchaseError instanceof Error
            ? purchaseError.message
            : 'Неизвестная ошибка'
        }`
      );
    }

    if (categoriesError) {
      console.error('Categories error:', categoriesError);
      newErrorMessages.push(
        `Ошибка загрузки категорий: ${
          categoriesError instanceof Error
            ? categoriesError.message
            : 'Неизвестная ошибка'
        }`
      );
    }

    if (newErrorMessages.length > 0) {
      setErrorMessages((prev) => [...prev, ...newErrorMessages]);
    }
  }, [
    productsError,
    suppliersError,
    shopError,
    purchaseError,
    categoriesError,
  ]);

  // Мутация для создания прихода
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Данные перед созданием прихода:', data);

      // Всегда используем стандартный метод createPurchase, который корректно обрабатывает все поля,
      // включая supplierId (null или UUID)
      return createPurchase(data);
    },
    onSuccess: (data) => {
      console.log('Приход успешно создан:', data);
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
    onError: (error) => {
      console.error('Ошибка при создании прихода:', error);
    },
  });

  // Мутация для обновления прихода
  const updatePurchaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      if (!data.shopId) {
        console.error('Попытка обновить приход без shopId!', data);
        return Promise.reject(new Error('shopId не указан'));
      }
      return updatePurchaseDraft(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
    onError: (error) => {
      console.error('Ошибка при обновлении прихода:', error);
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

  // Расчет состояния загрузки всех данных
  const isFormLoading =
    isLoadingProducts ||
    isLoadingSuppliers ||
    shopLoading ||
    isPurchaseLoading ||
    isLoadingCategories;

  // Функция для сохранения данных формы в localStorage
  const saveFormStateToLocalStorage = () => {
    try {
      // Проверяем, был ли уже успешно создан приход
      const hasJustSubmitted =
        sessionStorage.getItem('purchase_submitted') === 'true';
      if (hasJustSubmitted) {
        console.log(
          'Приход уже был успешно создан, не сохраняем в localStorage'
        );
        return false;
      }

      // Сохранение данных формы только если есть хотя бы один элемент
      if (purchaseItems.length > 0) {
        const currentFormValues = form.getFieldsValue();
        const formData = {
          ...currentFormValues,
          date: currentFormValues.date
            ? currentFormValues.date.toISOString() // Сохраняем полный формат даты со временем
            : new Date().toISOString(),
          items: purchaseItems,
          tempId: tempId,
        };

        const storageKey = `purchase_draft_${shopId}_${tempId}`;
        localStorage.setItem(storageKey, JSON.stringify(formData));
        console.log('Успешно сохранено состояние формы:', storageKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка при сохранении состояния формы:', error);
      return false;
    }
  };

  // Функция для немедленного сохранения состояния формы
  const forceFormStateSave = () => {
    if (isFormLoading || !shopId) return;

    console.log('Принудительное сохранение данных формы прихода');
    saveFormStateToLocalStorage();
  };

  // Функция для восстановления данных формы из localStorage
  const loadFormStateFromLocalStorage = () => {
    // Проверяем, был ли редирект после успешного создания прихода
    const hasJustSubmitted =
      sessionStorage.getItem('purchase_submitted') === 'true';
    if (hasJustSubmitted) {
      // Очищаем флаг, чтобы не мешал при следующих загрузках
      sessionStorage.removeItem('purchase_submitted');
      console.log(
        'Был редирект после успешного создания прихода - не восстанавливаем данные'
      );

      // Очищаем все черновики для текущего магазина, чтобы данные завершенного прихода не восстановились
      if (shopId) {
        clearAllDraftsForShop(shopId);
        console.log('Очищены все черновики после успешного создания прихода');
      }

      return false;
    }

    // Если это редактирование существующего прихода (effectiveId не начинается с 'temp-')
    // то не восстанавливаем данные
    if (
      effectiveId &&
      !effectiveId.startsWith('temp-') &&
      effectiveId !== tempId
    ) {
      console.log(
        'Редактирование существующего прихода - не восстанавливаем данные из localStorage'
      );
      return false;
    }

    // Строим ключ для поиска черновика
    const storageKey = `purchase_draft_${shopId}_${tempId}`;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) {
        console.log('Нет сохраненных данных для ключа:', storageKey);

        // Если мы не нашли данные для конкретного ключа, попробуем найти любой черновик для этого магазина
        if (shopId) {
          const draftKeyPrefix = `purchase_draft_${shopId}_`;

          // Находим все черновики для текущего магазина
          let mostRecentDraft = null;
          let mostRecentTimestamp = 0;

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(draftKeyPrefix)) {
              try {
                const draftData = localStorage.getItem(key);
                if (draftData) {
                  const parsed = JSON.parse(draftData);

                  // Проверяем, есть ли в черновике товары
                  if (parsed.items && parsed.items.length > 0) {
                    // Находим самый свежий черновик
                    if (!mostRecentDraft) {
                      mostRecentDraft = { key, data: parsed };
                      console.log('Найден черновик:', key);
                    }
                  }
                }
              } catch (e) {
                console.error('Ошибка при парсинге черновика:', e);
              }
            }
          }

          // Используем найденный черновик
          if (mostRecentDraft) {
            console.log(
              'Используем существующий черновик:',
              mostRecentDraft.key
            );

            // Сначала копируем данные в текущий ключ
            localStorage.setItem(
              storageKey,
              JSON.stringify(mostRecentDraft.data)
            );

            // Загружаем данные
            const parsedData = mostRecentDraft.data;

            // Конвертируем строку даты в объект dayjs
            if (parsedData.date) {
              parsedData.date = dayjs(parsedData.date);
            }

            // Устанавливаем значения формы
            form.setFieldsValue(parsedData);

            // Загружаем товары, если они есть
            if (parsedData.items && Array.isArray(parsedData.items)) {
              setPurchaseItems(parsedData.items);
            }

            console.log('Успешно загружены данные из существующего черновика');
            return true;
          }
        }

        return false;
      }

      const parsedData = JSON.parse(savedData);

      // Загружаем данные формы, если они есть
      if (parsedData) {
        // Конвертируем строку даты в объект dayjs
        if (parsedData.date) {
          parsedData.date = dayjs(parsedData.date); // Парсим ISO формат даты
        }

        // Устанавливаем значения формы
        form.setFieldsValue(parsedData);

        // Загружаем товары, если они есть
        if (parsedData.items && Array.isArray(parsedData.items)) {
          setPurchaseItems(parsedData.items);
        }

        console.log(
          'Успешно загружены данные формы из localStorage:',
          parsedData
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Ошибка при загрузке данных формы из localStorage:', error);
      return false;
    }
  };

  // Обработчик изменения значений формы
  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    // Сохраняем изменения с дебаунсом
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      forceFormStateSave();
    }, 500);
  };

  // Функция для очистки всех черновиков прихода для данного магазина
  const clearAllDraftsForShop = (shopIdToClear: string) => {
    if (!shopIdToClear) return;

    try {
      const draftKeyPrefix = `purchase_draft_${shopIdToClear}_`;
      // Находим и удаляем все черновики для указанного магазина
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(draftKeyPrefix)) {
          console.log('Очищаем черновик прихода:', key);
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Ошибка при очистке черновиков прихода:', error);
    }
  };

  // Функция для очистки сохраненных данных
  const clearSavedFormState = () => {
    if (!shopId) return;

    const storageKey = `purchase_draft_${shopId}_${tempId}`;
    localStorage.removeItem(storageKey);
    console.log('Очищены сохраненные данные прихода:', storageKey);
  };

  // Создаем ref для хранения setTimeout
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Загружаем состояние формы при инициализации
  useEffect(() => {
    // Проверяем, есть ли возможность загрузить сохраненные данные
    if (shopId && tempId && !isFormLoading) {
      console.log(
        `Попытка восстановить данные формы при инициализации. TempId: ${tempId}`
      );
      // Устанавливаем значение по умолчанию для даты, если создаем новый приход
      if (!effectiveId || effectiveId.startsWith('temp-')) {
        form.setFieldsValue({
          date: dayjs(),
        });
      }

      // Пытаемся загрузить данные
      const restored = loadFormStateFromLocalStorage();
      if (restored) {
        console.log('Форма успешно восстановлена из localStorage');
        message.info('Восстановлены сохраненные данные формы');
      } else {
        console.log('Не удалось восстановить данные формы, или данных нет');
      }
    }
  }, [shopId, tempId, isFormLoading]);

  // Автоматически сохраняем данные формы при изменениях с более коротким интервалом
  useEffect(() => {
    // Используем debounce, чтобы не сохранять слишком часто
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      if (!isFormLoading && shopId) {
        console.log('Автоматическое сохранение данных формы (интервал 350мс)');
        saveFormStateToLocalStorage();
      }
    }, 350); // Уменьшаем время до 350 мс для более частого сохранения

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [
    purchaseItems,
    shopId,
    isFormLoading,
    // Добавляем больше переменных для отслеживания:
    form.getFieldValue('date'),
    form.getFieldValue('supplierId'),
    form.getFieldValue('invoiceNumber'),
    form.getFieldValue('comment'),
  ]);

  // Добавляем обработчик события beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Принудительно сохраняем состояние формы перед обновлением/закрытием страницы
      if (shopId) {
        console.log('BeforeUnload: Сохраняем данные формы перед выходом');
        forceFormStateSave();
      }

      // Стандартное сообщение для подтверждения ухода со страницы
      if (purchaseItems.length > 0) {
        const message =
          'У вас есть несохраненные изменения. Вы действительно хотите покинуть страницу?';
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [purchaseItems, shopId, tempId]);

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
    } else if (!effectiveId || effectiveId.indexOf('temp-') === 0) {
      // Если это новый приход или временный - пробуем восстановить из localStorage
      loadFormStateFromLocalStorage();
    }
  }, [purchaseData, form, effectiveId, shopId, tempId]);

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

    // Обязательно получаем цены из объекта товара и используем значения по умолчанию, если они не заданы
    const purchasePrice = productToAdd.purchasePrice || 0;
    const sellingPrice = productToAdd.sellingPrice || 0;

    // Check if product already exists in the list
    const existingItemIndex = purchaseItems.findIndex(
      (item) =>
        item.productId === productToAdd.id || item.id === productToAdd.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...purchaseItems];
      updatedItems[existingItemIndex].quantity += quantity;
      // Для уверенности также обновляем цены, чтобы они не потерялись при отправке
      updatedItems[existingItemIndex].purchasePrice = purchasePrice;
      updatedItems[existingItemIndex].sellingPrice = sellingPrice;
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
        purchasePrice: purchasePrice,
        sellingPrice: sellingPrice,
        quantity: quantity,
        product: productToAdd,
      };

      setPurchaseItems((prev) => [...prev, newItem]);
    }

    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
    message.success(`Товар "${productToAdd.name}" добавлен в приход`);

    // Добавляем принудительное сохранение после добавления товара
    setTimeout(forceFormStateSave, 100);
  };

  // Handle removing an item from the purchase
  const handleRemoveItem = (itemId: string) => {
    setPurchaseItems((prev) => prev.filter((item) => item.id !== itemId));

    // Добавляем принудительное сохранение после удаления товара
    setTimeout(forceFormStateSave, 100);
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
      // Получаем цены из объекта товара, гарантируя, что они не будут undefined
      const purchasePrice = foundProduct.purchasePrice || 0;
      const sellingPrice = foundProduct.sellingPrice || 0;

      // Добавляем найденный товар
      const existingItemIndex = purchaseItems.findIndex(
        (item) =>
          item.productId === foundProduct.id || item.id === foundProduct.id
      );

      if (existingItemIndex >= 0) {
        // Увеличиваем количество
        const updatedItems = [...purchaseItems];
        updatedItems[existingItemIndex].quantity += 1;
        // Обязательно обновляем цены
        updatedItems[existingItemIndex].purchasePrice = purchasePrice;
        updatedItems[existingItemIndex].sellingPrice = sellingPrice;
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
          purchasePrice: purchasePrice,
          sellingPrice: sellingPrice,
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

    // Добавляем принудительное сохранение
    setTimeout(forceFormStateSave, 100);
  };

  // Создание нового товара из модального окна
  const handleCreateNewProduct = async () => {
    try {
      const values = await newProductForm.validateFields();
      setIsCreatingProduct(true);

      // Преобразуем цены в числа и гарантируем, что они не будут undefined
      const purchasePrice = parseFloat(values.purchasePrice || 0);
      let sellingPrice = parseFloat(values.sellingPrice || 0);

      // Если цена продажи не указана, устанавливаем её на основе закупочной с наценкой 20%
      if (!sellingPrice && purchasePrice) {
        sellingPrice = Math.round(purchasePrice * 1.2 * 100) / 100;
      }

      // Обновляем поля с преобразованными значениями
      values.purchasePrice = purchasePrice;
      values.sellingPrice = sellingPrice;

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

      // Гарантируем, что цены будут числами, а не undefined
      const newPurchasePrice = newProduct.purchasePrice || purchasePrice;
      const newSellingPrice = newProduct.sellingPrice || sellingPrice;

      // Добавляем новый товар в список приходов
      const newItem: PurchaseItem = {
        id: uuidv4(),
        productId: newProduct.id,
        name: newProduct.name,
        sku: newProduct.sku,
        barcode: newProduct.barcode,
        barcodes: newProduct.barcodes,
        purchasePrice: newPurchasePrice,
        sellingPrice: newSellingPrice,
        quantity: values.quantity || 1,
        product: newProduct,
      };

      setPurchaseItems((prev) => [...prev, newItem]);
      setNewProductModalVisible(false);
      setIsCreatingProduct(false);
      message.success(
        `Новый товар "${newProduct.name}" создан и добавлен в приход`
      );

      // Сохраняем состояние формы после добавления нового товара
      setTimeout(forceFormStateSave, 100);
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
            // Сохраняем изменения после обновления количества
            setTimeout(forceFormStateSave, 100);
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
            // Сохраняем изменения после обновления цены
            setTimeout(forceFormStateSave, 100);
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

  // Очистка ошибок при изменении выбранного продукта, количества или изменении списка товаров
  useEffect(() => {
    if (errorMessages.length > 0) {
      setErrorMessages([]);
    }
  }, [selectedProduct, quantity, purchaseItems.length]);

  // При изменении статуса загрузки сбрасываем ошибки
  useEffect(() => {
    const isLoading =
      isLoadingProducts ||
      isLoadingSuppliers ||
      shopLoading ||
      isPurchaseLoading ||
      isLoadingCategories;
    if (isLoading) {
      setErrorMessages([]);
    }
  }, [
    isLoadingProducts,
    isLoadingSuppliers,
    shopLoading,
    isPurchaseLoading,
    isLoadingCategories,
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

  // Функция для очистки формы и возврата на страницу приходов
  const handleCancel = () => {
    // Показываем модальное окно подтверждения
    Modal.confirm({
      title: 'Подтверждение отмены',
      content:
        purchaseItems.length > 0
          ? `Вы не закончили создание прихода. В форме уже добавлено ${purchaseItems.length} товаров. Если вы отмените операцию, все введенные данные будут потеряны. Хотите продолжить?`
          : 'Вы не закончили создание прихода. Если вы отмените операцию, все введенные данные будут потеряны. Хотите продолжить?',
      okText: 'Да, отменить',
      cancelText: 'Нет, вернуться к форме',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      onOk: () => {
        console.log('Отмена прихода: начало очистки данных');

        // Очищаем форму
        form.resetFields();
        console.log('Форма сброшена');

        // Очищаем список товаров
        setPurchaseItems([]);
        console.log('Список товаров очищен');

        // Очищаем данные из localStorage
        if (shopId) {
          // 1. Очищаем данные текущего прихода
          if (tempId) {
            const storageKey = `purchase_draft_${shopId}_${tempId}`;
            localStorage.removeItem(storageKey);
            console.log(`Удален ключ localStorage: ${storageKey}`);
          }

          // 2. Очищаем все черновики для текущего магазина
          const draftKeyPrefix = `purchase_draft_${shopId}_`;
          let removedCount = 0;

          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(draftKeyPrefix)) {
              localStorage.removeItem(key);
              removedCount++;
              console.log(`Удален дополнительный ключ: ${key}`);
              // После удаления элемента индексы сдвигаются, поэтому уменьшаем i
              i--;
            }
          }

          console.log(`Всего удалено ${removedCount} ключей из localStorage`);
        } else {
          console.warn('Невозможно очистить localStorage: отсутствует shopId');
        }

        // Удаляем флаг создания нового прихода
        sessionStorage.removeItem('creating_new_purchase');
        console.log('Флаг creating_new_purchase удален из sessionStorage');

        // Показываем сообщение пользователю
        message.success('Форма очищена, данные удалены');

        // Перенаправляем на страницу со списком приходов
        if (shopId) {
          console.log(
            `Перенаправление на /manager/${shopId}/warehouse/incoming`
          );
          navigate(`/manager/${shopId}/warehouse/incoming`);
        } else {
          console.log('Перенаправление на /manager/warehouse/incoming');
          navigate('/manager/warehouse/incoming');
        }
      },
      // Стилизуем кнопки, чтобы они всегда были синими
      okButtonProps: {
        style: { backgroundColor: '#1890ff', borderColor: '#1890ff' },
      },
      cancelButtonProps: {
        style: {
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          color: 'white',
        },
      },
    });
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    console.log('Form submission started with values:', values);
    console.log('Shop ID:', shopId);

    // Очищаем предыдущие сообщения об ошибках
    setErrorMessages([]);

    // Устанавливаем состояние загрузки
    setIsLoading(true);

    // Сохраняем состояние формы перед отправкой
    // (даже если запрос не выполнится, у пользователя останутся данные)
    forceFormStateSave();

    try {
      if (!shopId) {
        throw new Error('ID магазина не определен. Невозможно создать приход.');
      }

      // Проверяем, есть ли хотя бы один товар в приходе
      if (purchaseItems.length === 0) {
        message.warning('Невозможно создать приход без товаров');
        setIsLoading(false);
        return;
      }

      // Проверяем, указан ли поставщик или номер накладной
      const missingSupplier = !values.supplierId;
      const missingInvoiceNumber = !values.invoiceNumber;

      // Если отсутствует поставщик или номер накладной, показываем предупреждение
      if (missingSupplier || missingInvoiceNumber) {
        setIsLoading(false); // Снимаем состояние загрузки на время показа модального окна

        // Формируем сообщение в зависимости от того, что именно отсутствует
        let warningMessage = '';
        if (missingSupplier && missingInvoiceNumber) {
          warningMessage =
            'В приходе не указан поставщик и номер накладной. Это может затруднить учет и поиск в будущем.';
        } else if (missingSupplier) {
          warningMessage =
            'В приходе не указан поставщик. Это может затруднить учет и поиск в будущем.';
        } else {
          warningMessage =
            'В приходе не указан номер накладной. Это может затруднить учет и поиск в будущем.';
        }

        // Показываем модальное окно с предупреждением
        Modal.confirm({
          title: 'Предупреждение',
          content: warningMessage + ' Хотите продолжить?',
          okText: 'Продолжить сохранение',
          cancelText: 'Вернуться к форме',
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
          // Стилизуем кнопки, чтобы они всегда были синими
          okButtonProps: {
            style: { backgroundColor: '#1890ff', borderColor: '#1890ff' },
          },
          cancelButtonProps: {
            style: {
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              color: 'white',
            },
          },
          onOk: () => {
            // Пользователь решил продолжить, выполняем сохранение
            proceedWithSubmit(values);
          },
          onCancel: () => {
            // Пользователь решил вернуться к форме
            console.log('Пользователь отменил сохранение для заполнения полей');
            setIsLoading(false);
          },
        });
      } else {
        // Если все поля заполнены, продолжаем с сохранением
        proceedWithSubmit(values);
      }
    } catch (error: any) {
      // Обрабатываем общую ошибку
      console.error('General error during form submission:', error);

      const errorMessage = `Ошибка: ${error.message || 'Что-то пошло не так'}`;
      message.error(errorMessage);
      setErrorMessages([errorMessage]);
      setIsLoading(false);
    }
  };

  // Функция для продолжения отправки формы после всех проверок
  const proceedWithSubmit = async (values: any) => {
    try {
      setIsLoading(true);

      // Подготавливаем элементы прихода, гарантируя, что все поля правильно заполнены
      const preparedItems = purchaseItems.map((item) => {
        // Преобразуем цены в числовой формат, если это не так
        const price =
          typeof item.purchasePrice === 'number'
            ? item.purchasePrice
            : parseFloat(item.purchasePrice as any) || 0;

        return {
          productId: item.productId || item.id,
          quantity: item.quantity,
          price: price,
        };
      });

      console.log('Подготовленные элементы прихода:', preparedItems);

      // Создаем минимальный набор данных для создания прихода
      const purchaseData = {
        shopId: shopId,
        date: values.date
          ? values.date.toISOString() // Используем полный ISO формат даты со временем
          : new Date().toISOString(), // Для текущей даты тоже используем полный формат
        // Всегда явно передаем supplierId даже если он null
        supplierId: values.supplierId || null,
        // Для номера накладной тоже устанавливаем null, если он не задан
        invoiceNumber: values.invoiceNumber || null,
        ...(values.comment && { comment: values.comment }),
        // Используем подготовленные элементы
        items: preparedItems,
        // Статус всегда draft для нового прихода
        status: 'draft',
        // Включаем автоматическое обновление закупочной цены при создании прихода
        updatePurchasePrices: true,
      };

      console.log('Prepared purchase data:', purchaseData);
      console.log('supplierId передаётся:', purchaseData.supplierId);

      // Создаем новый приход или обновляем существующий
      if (effectiveId && effectiveId.indexOf('temp-') !== 0) {
        console.log('Updating existing purchase with ID:', effectiveId);
        const result = await updatePurchaseMutation.mutateAsync({
          id: effectiveId,
          data: purchaseData,
        });

        message.success('Приход успешно обновлен');

        // Очищаем сохраненные данные
        clearSavedFormState();

        // Для надежности очищаем все черновики магазина
        clearAllDraftsForShop(shopId);

        // Обновленный URL с shopId
        if (shopId) {
          navigate(`/manager/${shopId}/warehouse/incoming`);
        } else {
          navigate('/manager/warehouse/incoming');
        }
      } else {
        console.log('Creating new purchase...');

        try {
          // Сохраняем данные еще раз перед отправкой формы
          forceFormStateSave();

          const result = await createPurchaseMutation.mutateAsync(purchaseData);
          console.log('Purchase created successfully:', result);

          message.success('Приход успешно создан');

          // Устанавливаем флаг успешного создания прихода ПЕРЕД очисткой хранилища
          sessionStorage.setItem('purchase_submitted', 'true');
          console.log('Установлен флаг успешного создания прихода');

          // Очищаем сохраненные данные
          clearSavedFormState();

          // Для надежности очищаем все черновики магазина
          clearAllDraftsForShop(shopId);

          // Явно очищаем форму, чтобы она точно не сохранилась снова
          form.resetFields();
          setPurchaseItems([]);

          // Обновленный URL с shopId
          if (result && typeof result === 'object' && result.id) {
            // Перенаправляем на страницу деталей прихода
            if (shopId) {
              navigate(`/manager/${shopId}/warehouse/purchases/${result.id}`);
            } else {
              navigate(`/manager/warehouse/purchases/${result.id}`);
            }
          } else {
            console.warn('Результат API не содержит ID прихода:', result);
            // Перенаправляем на страницу списка приходов
            if (shopId) {
              navigate(`/manager/${shopId}/warehouse/incoming`);
            } else {
              navigate('/manager/warehouse/incoming');
            }
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
      console.error('Error in proceedWithSubmit:', error);
      const errorMessage = `Ошибка: ${error.message || 'Что-то пошло не так'}`;
      message.error(errorMessage);
      setErrorMessages([errorMessage]);
    } finally {
      // В любом случае снимаем состояние загрузки
      setIsLoading(false);
    }
  };

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
            style={{
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              color: 'white',
            }}
          >
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-blue-500"
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
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
          <Button
            key="cancel"
            onClick={() => setNewProductModalVisible(false)}
            style={{
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              color: 'white',
            }}
          >
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-blue-500"
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
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
                  loading={isLoadingCategories}
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
                    isLoadingCategories ? <Spin size="small" /> : null
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
          onValuesChange={handleFormValuesChange}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="date"
              label="Дата прихода"
              rules={[{ required: true, message: 'Укажите дату прихода' }]}
            >
              <DatePicker style={{ width: '100%' }} disabled={isLoading} />
            </Form.Item>

            <Form.Item
              name="supplierId"
              label="Поставщик"
              help="Необязательное поле. Рекомендуется указать поставщика для лучшего учета."
            >
              <Select
                placeholder={
                  isLoadingSuppliers
                    ? 'Загрузка поставщиков...'
                    : 'Выберите поставщика'
                }
                allowClear
                loading={isLoadingSuppliers}
                disabled={isLoading || isLoadingSuppliers}
              >
                {suppliers?.map((supplier) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="invoiceNumber"
              label="Номер накладной"
              help="Необязательное поле. Рекомендуется указать номер накладной для лучшего учета."
            >
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
                  loading={isLoadingProducts}
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
              emptyText: isLoadingProducts
                ? 'Загрузка товаров...'
                : 'Товары не добавлены',
            }}
            loading={isLoading}
          />

          <div className="mt-4 flex justify-end">
            <Space>
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                style={{
                  backgroundColor: purchaseItems.length > 0 ? '#1890ff' : '',
                  color: purchaseItems.length > 0 ? 'white' : '',
                }}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isLoading}
                className="bg-blue-500"
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
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
