import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  Select,
  DatePicker,
  Table,
  InputNumber,
  message,
  Typography,
  Switch,
  Tooltip,
  Card,
  Row,
  Col,
  Divider,
  Upload,
  Modal,
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProducts,
  generateLabels,
  createPurchase,
  createPurchaseDraft,
  completePurchaseDraft,
  CreatePurchaseRequest,
  getPurchaseById,
  getSuppliers,
  getSupplierProducts,
  updatePurchaseDraft,
  createSupplier,
} from '@/services/managerApi';
import { formatDate } from '@/utils/format';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { PurchasePreview } from './PurchasePreview';
import { printElement } from '@/utils/print';
import { Product } from '@/types/product';
import { ApiErrorHandler } from '@/utils/error-handler';
import { Purchase } from '@/types/purchase';
import { debounce } from 'lodash';
import { PRODUCTS_PER_PAGE } from '@/constants';
import { ProductsResponse } from '@/types/product';
import type { InputRef } from 'antd/lib/input';

const { Option } = Select;

// Определяем тип для продукта с расширенными полями
interface ExtendedProduct extends Product {
  unit?: string;
}

interface ExcelRow {
  sku?: string;
  barcode?: string;
  name?: string;
  quantity?: string | number;
  comment?: string;
}

interface PreviewData {
  id: string;
  date: string;
  invoiceNumber: string;
  supplier: {
    name: string;
    address?: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  comment?: string;
}

interface PurchaseItem {
  id?: string;
  productId: string;
  barcode?: string;
  name?: string;
  quantity: number;
  price: number;
  partialQuantity?: number;
  serialNumber?: string;
  expiryDate?: string;
  comment?: string;
  unit: string;
  sku?: string;
  total: number;
  needsLabels?: boolean;
}

interface FormData {
  supplierId: string;
  invoiceNumber: string;
  date: dayjs.Dayjs;
  comment?: string;
  items: PurchaseItem[];
  updatePrices?: boolean;
  createLabels?: boolean;
  checkDuplicates?: boolean;
}

interface PurchaseFormProps {
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

// Добавляем интерфейс для ref
export interface PurchaseFormRef {
  handleCloseWithSave: () => Promise<void>;
}

const PurchaseForm = forwardRef<PurchaseFormRef, PurchaseFormProps>(
  ({ shopId, onClose, onSuccess, initialData }, ref) => {
    const [form] = Form.useForm();
    const [items, setItems] = useState<PurchaseItem[]>(() => {
      // Добавляем уникальные идентификаторы при инициализации
      if (initialData?.items) {
        return initialData.items.map((item: any) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
        }));
      }
      return [];
    });
    const [searchValue, setSearchValue] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const barcodeInputRef = useRef<InputRef>(null);
    const queryClient = useQueryClient();
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
      initialData?.supplierId || null
    );
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    // Идентификатор черновика прихода, если он уже сохранен
    const [draftId, setDraftId] = useState<string | null>(null);
    // Флаг, указывающий, что форма пытается закрыться
    const [isClosing, setIsClosing] = useState(false);
    // Таймер для автосохранения
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Флаг для определения, что форма была изменена
    const [formChanged, setFormChanged] = useState(false);
    // В начале компонента, после объявления состояний
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

    // Queries
    const { data: allProducts = [] } = useQuery({
      queryKey: ['products', shopId],
      queryFn: () => getProducts(shopId),
    });

    const { data: suppliers = [] } = useQuery({
      queryKey: ['suppliers', shopId],
      queryFn: () => getSuppliers(shopId),
    });

    // Загружаем товары поставщика при его выборе
    const { data: supplierProducts = [] } = useQuery({
      queryKey: ['supplierProducts', selectedSupplierId, shopId],
      queryFn: () =>
        selectedSupplierId
          ? getSupplierProducts(selectedSupplierId, shopId)
          : Promise.resolve([]),
      enabled: !!selectedSupplierId,
    });

    // Обновляем отфильтрованные товары при изменении поставщика или всех товаров
    useEffect(() => {
      // Всегда показываем все товары, независимо от выбранного поставщика
      setFilteredProducts(allProducts);
    }, [allProducts]);

    // Обработчик изменения поставщика
    const handleSupplierChange = (supplierId: string) => {
      setSelectedSupplierId(supplierId);
      form.setFieldsValue({ supplierId });
    };

    // Mutations
    const createPurchaseMutation = useMutation({
      mutationFn: createPurchase,
      onSuccess: () => {
        message.success('Приход успешно создан');
        onSuccess();
      },
      onError: (error: Error) => {
        message.error('Ошибка при создании прихода: ' + error.message);
      },
    });

    const createDraftMutation = useMutation({
      mutationFn: createPurchaseDraft,
      onSuccess: (response) => {
        if (response.id) {
          setDraftId(response.id.toString());
          console.log('Черновик сохранен, ID:', response.id);
          setFormChanged(false);
        }
      },
      onError: (error: Error) => {
        console.error('Ошибка при сохранении черновика:', error);
      },
    });

    const completeDraftMutation = useMutation({
      mutationFn: (id: string) => completePurchaseDraft(id),
      onSuccess: () => {
        message.success('Приход успешно завершен');
        onSuccess();
      },
      onError: (error: any) => {
        const apiError = ApiErrorHandler.handle(error);
        message.error(apiError.message);
      },
    });

    const generateLabelsMutation = useMutation({
      mutationFn: generateLabels,
      onSuccess: () => {
        message.success('Этикетки успешно созданы');
      },
      onError: (error: Error) => {
        message.error('Ошибка при создании этикеток: ' + error.message);
      },
    });

    // Эффекты
    useEffect(() => {
      if (isScanning && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }, [isScanning]);

    // Добавляем эффект для установки ID черновика при инициализации
    useEffect(() => {
      if (initialData) {
        console.log('=== ИНИЦИАЛИЗАЦИЯ ФОРМЫ ===');
        console.log('Исходные данные:', initialData);

        // Пытаемся получить ID из всех возможных мест в initialData
        let draftId = null;
        if (typeof initialData === 'object') {
          // Проверяем все возможные пути к ID
          draftId =
            initialData.id || // прямой id
            initialData._id || // mongodb style
            initialData.draftId || // специальное поле
            (initialData.draft && initialData.draft.id) || // вложенный draft
            (typeof initialData === 'string' ? initialData : null); // если передан просто id строкой
        }

        console.log('Извлеченный ID черновика:', draftId);

        if (draftId) {
          console.log('Устанавливаем ID черновика:', draftId);
          setCurrentDraftId(draftId);
          setDraftId(draftId); // Устанавливаем также в draftId для совместимости
        }

        // Инициализируем форму с данными из initialData
        console.log('Инициализация формы из initialData');
        form.setFieldsValue({
          supplierId: initialData.supplierId || initialData.supplier?.id,
          invoiceNumber: initialData.invoiceNumber,
          date: dayjs(initialData.date),
          comment: initialData.comment,
          updatePrices: initialData.updatePrices,
          updatePurchasePrices: initialData.updatePurchasePrices,
          createLabels: initialData.createLabels,
        });
      }
    }, [initialData, form]);

    // Обработчики
    const handleBarcodeScan = (barcode: string) => {
      if (!barcode) return null;

      // Поиск товара по штрих-коду
      const foundProduct = allProducts?.find(
        (product) => product.barcode === barcode
      );

      if (foundProduct) {
        // Вызываем handleAddProduct чтобы использовать единую логику добавления товаров
        handleAddProduct(foundProduct);
        return { success: true, product: foundProduct };
      } else {
        message.error('Товар не найден по штрих-коду');
        return null;
      }
    };

    const handleExcelUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet);

        const newItems: PurchaseItem[] = [];

        rows.forEach((row) => {
          const product = filteredProducts?.find(
            (p) =>
              p.sku === row.sku ||
              p.barcode === row.barcode ||
              p.name === row.name
          );

          if (!product) {
            message.warning(
              `Товар не найден: ${row.sku || row.barcode || row.name}`
            );
            return;
          }

          // Убедимся, что количество и цена являются числами
          const quantity = Number(row.quantity) || 1;
          const price =
            typeof product.purchasePrice === 'number' &&
            !isNaN(product.purchasePrice)
              ? product.purchasePrice
              : 0;

          newItems.push({
            id: crypto.randomUUID(),
            productId: product.id.toString(),
            quantity,
            price,
            total: price * quantity,
            barcode: product.barcode,
            name: product.name,
            sku: product.sku,
            unit: product.unit || 'шт',
            needsLabels: false,
            comment: row.comment,
          });
        });

        // Merge with existing items
        const mergedItems = [...items];
        newItems.forEach((newItem) => {
          const existingIndex = mergedItems.findIndex(
            (item) => item.productId === newItem.productId
          );
          if (existingIndex >= 0) {
            const existingQuantity =
              typeof mergedItems[existingIndex].quantity === 'number'
                ? mergedItems[existingIndex].quantity
                : 0;
            const existingTotal =
              typeof mergedItems[existingIndex].total === 'number'
                ? mergedItems[existingIndex].total
                : 0;

            mergedItems[existingIndex] = {
              ...mergedItems[existingIndex],
              quantity: existingQuantity + newItem.quantity,
              total: existingTotal + newItem.total,
              comment: newItem.comment || mergedItems[existingIndex].comment,
            };
          } else {
            mergedItems.push(newItem);
          }
        });

        setItems(addIdsToItems(mergedItems));
        message.success(`Добавлено ${newItems.length} товаров`);
      };
      reader.readAsArrayBuffer(file);
      return false;
    };

    // Функция для добавления уникальных идентификаторов к элементам
    const addIdsToItems = (itemsArray: PurchaseItem[]): PurchaseItem[] => {
      return itemsArray.map((item) => {
        // Если id отсутствует или пустой, генерируем новый
        if (!item.id || item.id.trim() === '') {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });
    };

    const handleQuantityChange = (productId: string, value: number | null) => {
      if (value === null) return;

      const updatedItems = items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: value,
              total:
                value *
                (typeof item.price === 'number' && !isNaN(item.price)
                  ? item.price
                  : 0),
            }
          : item
      );

      setItems(addIdsToItems(updatedItems));
    };

    const handleExpiryDateChange = (
      productId: string,
      date: dayjs.Dayjs | null
    ) => {
      const updatedItems = items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              expiryDate: date ? date.format('YYYY-MM-DD') : undefined,
            }
          : item
      );

      setItems(addIdsToItems(updatedItems));
    };

    const handlePartialQuantityChange = (index: number, value: number) => {
      const newItems = [...items];
      newItems[index].partialQuantity = value;
      setItems(addIdsToItems(newItems));
    };

    // Обработчик удаления товара
    const handleRemoveProduct = (productId: string) => {
      const filteredItems = items.filter(
        (item) => item.productId !== productId
      );
      setItems(addIdsToItems(filteredItems));
      message.success('Товар удален из прихода');
    };

    const handleAddProduct = (product: ExtendedProduct) => {
      const price = product.purchasePrice || 0;
      const newItem: PurchaseItem = {
        productId: product.id,
        quantity: 1,
        price: price,
        total: price,
        barcode: product.barcode,
        name: product.name,
        sku: product.sku,
        unit: product.unit || 'шт',
        needsLabels: false,
        comment: '',
      };
      setItems(addIdsToItems([...items, newItem]));
      setSearchValue('');
    };

    // Prepare preview data
    const preparePreviewData = async () => {
      try {
        const values = await form.validateFields();
        const supplier = suppliers.find((s) => s.id === values.supplierId);

        if (!supplier) {
          throw new Error('Поставщик не найден');
        }

        const productMap: Record<string, Product> = {};
        allProducts.forEach((product) => {
          productMap[product.id.toString()] = product;
        });

        const previewItems = items.map((item) => {
          return {
            productId: item.productId,
            product: {
              name: productMap[item.productId]?.name || 'Неизвестный товар',
              sku: productMap[item.productId]?.sku || '',
            },
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
          };
        });

        const totalAmount =
          Array.isArray(previewItems) && previewItems.length > 0
            ? previewItems.reduce((sum, item) => sum + (item.total || 0), 0)
            : 0;

        setPreviewData({
          id: crypto.randomUUID(),
          date: values.date.format('YYYY-MM-DDTHH:mm:ss'),
          invoiceNumber: values.invoiceNumber,
          supplier: {
            name: supplier.name,
            address: supplier.address,
            phone: supplier.phone,
          },
          items: previewItems,
          totalAmount,
          comment: values.comment,
        });

        setShowPreview(true);
        return previewData;
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message);
        }
        return null;
      }
    };

    // Функция для проверки товаров с ценой ниже закупочной
    const getProblemItems = () => {
      return items.filter((item) => {
        const product = filteredProducts?.find(
          (p) => p.id.toString() === item.productId
        );
        return (
          product &&
          typeof item.price === 'number' &&
          typeof product.purchasePrice === 'number' &&
          item.price < product.purchasePrice
        );
      });
    };

    // Функция для сохранения черновика
    const saveDraft = async () => {
      console.log('Сохранение черновика...');
      try {
        // Проверяем, что есть хотя бы минимально необходимые данные
        if (items.length === 0) {
          console.log('Нет товаров для сохранения черновика');
          return;
        }

        // Получаем значения формы
        const formValues = form.getFieldsValue();
        console.log('Данные формы:', formValues);
        console.log('Товары для черновика:', items);

        // Подготавливаем данные для сохранения
        const purchaseData = {
          shopId,
          supplierId: formValues.supplierId,
          invoiceNumber: formValues.invoiceNumber,
          date: formValues.date
            ? formValues.date.format('YYYY-MM-DDTHH:mm:ss')
            : undefined,
          comment: formValues.comment,
          items: items,
          updatePrices: formValues.updatePrices,
          updatePurchasePrices: formValues.updatePurchasePrices,
          createLabels: formValues.createLabels,
          status: 'draft', // Используем нижний регистр вместо DRAFT
        };

        console.log('Данные для сохранения черновика:', purchaseData);

        // Выбираем метод API в зависимости от наличия draftId
        let response;
        if (draftId) {
          console.log(`Обновляем существующий черновик с ID: ${draftId}`);
          response = await updatePurchaseDraft(draftId, purchaseData);
        } else {
          console.log('Создаем новый черновик');
          response = await createPurchaseDraft(purchaseData);
          // Сохраняем ID созданного черновика
          setDraftId(response.id);
        }

        console.log('Черновик сохранен:', response);
        message.success('Черновик сохранен');
        return response;
      } catch (error) {
        console.error('Ошибка при сохранении черновика:', error);
        message.error(
          'Ошибка при сохранении черновика. Пожалуйста, проверьте данные и попробуйте снова.'
        );
        throw error;
      }
    };

    // Настройка автосохранения каждые 30 секунд при изменении формы
    useEffect(() => {
      if (formChanged) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
          console.log('Автосохранение черновика...');
          saveDraft();
        }, 30000); // 30 секунд
      }

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }, [formChanged, items, form.getFieldsValue()]);

    // Отслеживаем изменения в форме
    const handleFormChange = () => {
      setFormChanged(true);
    };

    // Модифицируем метод handleCloseWithSave
    const handleCloseWithSave = async () => {
      try {
        const formValues = form.getFieldsValue();
        console.log('=== НАЧАЛО СОХРАНЕНИЯ ЧЕРНОВИКА ===');
        console.log('Текущие значения формы:', formValues);
        console.log('Текущие товары:', items);
        console.log('ID черновика из состояния (draftId):', draftId);
        console.log('ID из currentDraftId:', currentDraftId);
        console.log('ID из initialData:', initialData?.id);
        console.log('Тип initialData:', typeof initialData);
        console.log(
          'Содержимое initialData:',
          JSON.stringify(initialData, null, 2)
        );
        console.log('Изменена ли форма:', formChanged);

        // Проверяем, есть ли товары для сохранения
        if (items.length === 0) {
          console.log('Нет товаров для сохранения, просто закрываем форму');
          return;
        }

        // Проверяем обязательные поля
        if (
          !formValues.supplierId ||
          !formValues.invoiceNumber ||
          !formValues.date
        ) {
          console.log('Не заполнены обязательные поля, пропускаем сохранение');
          return;
        }

        // Проверяем корректность данных товаров
        const validatedItems = items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          serialNumber: item.serialNumber,
          expiryDate: item.expiryDate,
          comment: item.comment,
          partialQuantity: item.partialQuantity
            ? Number(item.partialQuantity)
            : undefined,
        }));

        // Подготавливаем данные для сохранения
        const updateData = {
          shopId,
          supplierId: formValues.supplierId,
          invoiceNumber: formValues.invoiceNumber,
          date: formValues.date.format('YYYY-MM-DDTHH:mm:ss'),
          comment: formValues.comment,
          items: validatedItems,
          updatePrices: false,
          updatePurchasePrices: false,
          createLabels: false,
          status: 'draft',
        };

        // Определяем ID существующего черновика, проверяя все возможные источники
        const existingDraftId = currentDraftId || draftId || initialData?.id;
        console.log('=== ОПРЕДЕЛЕНИЕ ID ЧЕРНОВИКА ===');
        console.log('ID из currentDraftId:', currentDraftId);
        console.log('ID из состояния draftId:', draftId);
        console.log('ID из initialData:', initialData?.id);
        console.log('Итоговый ID черновика:', existingDraftId);

        try {
          if (existingDraftId) {
            console.log(`=== ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО ЧЕРНОВИКА ===`);
            console.log(`ID черновика для обновления: ${existingDraftId}`);
            const result = await updatePurchaseDraft(
              existingDraftId,
              updateData
            );
            console.log('Результат обновления черновика:', result);
            message.success('Черновик сохранен');
            // Инвалидируем кэш после обновления
            queryClient.invalidateQueries({ queryKey: ['purchases', shopId] });
          } else {
            console.log('=== СОЗДАНИЕ НОВОГО ЧЕРНОВИКА ===');
            console.log('Причина: отсутствует existingDraftId');
            const response = await createPurchaseDraft(updateData);
            console.log('Ответ от сервера при создании:', response);
            setCurrentDraftId(response.id);
            setDraftId(response.id);
            console.log('Новый черновик создан с ID:', response.id);
            console.log('ID сохранен в состояние');
            message.success('Новый черновик создан');
            // Инвалидируем кэш после создания
            queryClient.invalidateQueries({ queryKey: ['purchases', shopId] });
          }
        } catch (error) {
          console.error('=== ОШИБКА ПРИ СОХРАНЕНИИ ЧЕРНОВИКА ===');
          console.error(
            'Тип ошибки:',
            error instanceof Error ? 'Error' : typeof error
          );
          console.error('Содержимое ошибки:', error);
          if (error instanceof Error) {
            message.error(`Ошибка при сохранении: ${error.message}`);
          } else {
            message.error('Произошла неизвестная ошибка при сохранении');
          }
        }
      } catch (error) {
        console.error('=== КРИТИЧЕСКАЯ ОШИБКА ПРИ СОХРАНЕНИИ ===');
        console.error('Ошибка:', error);
        message.error('Произошла ошибка при сохранении черновика');
      }
      console.log('=== ЗАВЕРШЕНИЕ СОХРАНЕНИЯ ЧЕРНОВИКА ===');
    };

    // Экспортируем метод через ref
    useImperativeHandle(ref, () => ({
      handleCloseWithSave: async () => {
        console.log('handleCloseWithSave вызван через ref');
        return handleCloseWithSave();
      },
    }));

    // Handle form submission
    const handleSubmit = async () => {
      try {
        const values = await form.validateFields();

        // Проверяем наличие товаров
        if (items.length === 0) {
          message.error('Добавьте хотя бы один товар');
          return;
        }

        // Проверка на цены ниже текущих закупочных
        const itemsWithLowPrice = getProblemItems();
        if (itemsWithLowPrice.length > 0) {
          return new Promise((resolve) => {
            Modal.confirm({
              title: 'Внимание',
              icon: <ExclamationCircleOutlined />,
              content: `${itemsWithLowPrice.length} ${
                itemsWithLowPrice.length === 1 ? 'товар имеет' : 'товаров имеют'
              } цену ниже текущей закупочной. Продолжить?`,
              okText: 'Продолжить',
              cancelText: 'Отмена',
              onOk: async () => {
                // Если пользователь подтверждает, продолжаем сохранение
                if (draftId) {
                  // Если у нас есть ID черновика, завершаем его
                  try {
                    await completeDraftMutation.mutateAsync(draftId);
                    onClose();
                    resolve(true);
                  } catch (error) {
                    console.error('Error completing draft:', error);
                    if (error instanceof Error) {
                      message.error(error.message);
                    }
                    resolve(false);
                  }
                } else {
                  // Иначе создаем новый приход как обычно
                  const purchaseData: CreatePurchaseRequest = {
                    shopId,
                    supplierId: values.supplierId,
                    invoiceNumber: values.invoiceNumber,
                    date: values.date.format('YYYY-MM-DDTHH:mm:ss'),
                    comment: values.comment,
                    items: items.map((item) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      price: item.price,
                      partialQuantity: item.partialQuantity,
                      serialNumber: item.serialNumber,
                      expiryDate: item.expiryDate,
                      comment: item.comment,
                    })),
                    updatePrices: values.updatePrices,
                    updatePurchasePrices: values.updatePurchasePrices,
                    createLabels: values.createLabels,
                  };

                  try {
                    await createPurchaseMutation.mutateAsync(purchaseData);
                    onClose();
                    resolve(true);
                  } catch (error) {
                    console.error('Error submitting purchase:', error);
                    if (error instanceof Error) {
                      message.error(error.message);
                    }
                    resolve(false);
                  }
                }
              },
              onCancel: () => {
                resolve(false);
              },
            });
          });
        } else {
          // Если нет проблемных товаров, продолжаем без подтверждения
          if (draftId) {
            // Если у нас есть ID черновика, завершаем его
            await completeDraftMutation.mutateAsync(draftId);
          } else {
            // Иначе создаем новый приход
            const purchaseData: CreatePurchaseRequest = {
              shopId,
              supplierId: values.supplierId,
              invoiceNumber: values.invoiceNumber,
              date: values.date.format('YYYY-MM-DDTHH:mm:ss'),
              comment: values.comment,
              items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                partialQuantity: item.partialQuantity,
                serialNumber: item.serialNumber,
                expiryDate: item.expiryDate,
                comment: item.comment,
              })),
              updatePrices: values.updatePrices,
              updatePurchasePrices: values.updatePurchasePrices,
              createLabels: values.createLabels,
            };

            await createPurchaseMutation.mutateAsync(purchaseData);
          }
          onClose();
        }
      } catch (error) {
        console.error('Error submitting purchase:', error);
        if (error instanceof Error) {
          message.error(error.message);
        }
      }
    };

    // Handle print preview
    const handlePrint = async () => {
      if (!previewData) {
        message.error('Нет данных для печати');
        return;
      }

      const element = document.getElementById('purchase-preview');
      if (element) {
        await printElement(element.innerHTML);
      }
    };

    // Подсказки для полей
    const tooltips = {
      invoiceNumber: 'Введите номер накладной поставщика',
      supplier: 'Выберите поставщика из списка',
      date: 'Укажите дату прихода',
      barcode: 'Отсканируйте штрих-код товара для быстрого добавления',
      partialQuantity:
        'Укажите фактически принятое количество, если оно отличается от документа',
      serialNumber: 'Введите серийный номер товара, если требуется',
      expiryDate: 'Укажите срок годности товара, если применимо',
      updatePrices:
        'Автоматически обновить цены продажи на основе новых закупочных цен',
      updatePurchasePrices:
        'Автоматически обновить закупочные цены товаров на основе текущего прихода',
      createLabels: 'Автоматически создать этикетки для новых товаров',
      checkDuplicates: 'Проверять наличие накладных с таким же номером',
    };

    const columns = [
      {
        title: 'Название',
        dataIndex: 'productId',
        key: 'name',
        width: '20%',
        render: (productId: string) => {
          const product = filteredProducts.find(
            (p) => p.id.toString() === productId
          );
          return product?.name || 'Неизвестный товар';
        },
      },
      {
        title: 'Артикул',
        dataIndex: 'productId',
        key: 'sku',
        width: '10%',
        render: (productId: string) => {
          const product = filteredProducts.find(
            (p) => p.id.toString() === productId
          );
          return product?.sku || 'Н/Д';
        },
      },
      {
        title: 'Кол-во',
        dataIndex: 'quantity',
        key: 'quantity',
        width: '10%',
        render: (value: number, record: PurchaseItem) => (
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => handleQuantityChange(record.productId, val)}
            style={{ width: '100%' }}
            size="small"
          />
        ),
      },
      {
        title: 'Цена',
        dataIndex: 'price',
        key: 'price',
        width: '10%',
        render: (value: number, record: PurchaseItem, index: number) => (
          <InputNumber
            min={0}
            value={value}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }
            parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
            onChange={(val) => {
              // Просто обновляем значение без проверки при вводе
              const newItems = [...items];
              if (val !== null) {
                newItems[index].price = val;

                // Убедимся, что количество является числом
                const quantity =
                  typeof newItems[index].quantity === 'number' &&
                  !isNaN(newItems[index].quantity)
                    ? newItems[index].quantity
                    : 0;

                newItems[index].total = val * quantity;
                setItems(addIdsToItems(newItems));
              }
            }}
            onBlur={() => {
              // Проверяем цену только при потере фокуса
              const item = items[index];
              const product = filteredProducts?.find(
                (p) => p.id.toString() === item.productId
              );

              if (
                product &&
                typeof item.price === 'number' &&
                typeof product.purchasePrice === 'number' &&
                item.price < product.purchasePrice
              ) {
                Modal.confirm({
                  title: 'Внимание',
                  icon: <ExclamationCircleOutlined />,
                  content: (
                    <div>
                      <p>Цена ниже текущей закупочной.</p>
                      <p>
                        Текущая закупочная цена:{' '}
                        <strong>{product.purchasePrice.toFixed(2)} KZT</strong>
                      </p>
                      <p>
                        Введенная цена:{' '}
                        <strong>{item.price.toFixed(2)} KZT</strong>
                      </p>
                      <p>
                        Разница:{' '}
                        <strong>
                          {(product.purchasePrice - item.price).toFixed(2)} KZT
                        </strong>
                      </p>
                      <p>Продолжить с новой ценой?</p>
                    </div>
                  ),
                  okText: 'Продолжить с новой ценой',
                  cancelText: 'Вернуть старую цену',
                  onCancel: () => {
                    // Возвращаем предыдущую цену при отмене
                    const newItems = [...items];
                    newItems[index].price = product.purchasePrice;

                    // Убедимся, что количество является числом
                    const quantity =
                      typeof newItems[index].quantity === 'number' &&
                      !isNaN(newItems[index].quantity)
                        ? newItems[index].quantity
                        : 0;

                    newItems[index].total = product.purchasePrice * quantity;
                    setItems(addIdsToItems(newItems));
                  },
                });
              }
            }}
            style={{ width: '100%' }}
            size="small"
          />
        ),
      },
      {
        title: 'Серийный №',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: '15%',
        render: (value: string, record: PurchaseItem) => (
          <Input
            value={value}
            onChange={(e) => {
              const newItems = [...items];
              const index = items.findIndex(
                (item) => item.productId === record.productId
              );
              if (index !== -1) {
                newItems[index].serialNumber = e.target.value;
                setItems(addIdsToItems(newItems));
              }
            }}
            placeholder="Серийный №"
            size="small"
          />
        ),
      },
      {
        title: 'Срок годности',
        dataIndex: 'expiryDate',
        key: 'expiryDate',
        width: '15%',
        render: (value: string, record: PurchaseItem) => (
          <DatePicker
            value={value ? dayjs(value) : null}
            onChange={(date) => handleExpiryDateChange(record.productId, date)}
            format="DD.MM.YYYY"
            placeholder="Срок годности"
            style={{ width: '100%' }}
            size="small"
          />
        ),
      },
      {
        title: 'Этикетки',
        dataIndex: 'needsLabels',
        key: 'needsLabels',
        width: '10%',
        render: (value: boolean, record: PurchaseItem) => (
          <Switch
            checked={value}
            onChange={(checked) => {
              const newItems = [...items];
              const index = items.findIndex(
                (item) => item.productId === record.productId
              );
              if (index !== -1) {
                newItems[index].needsLabels = checked;
                setItems(addIdsToItems(newItems));
              }
            }}
            size="small"
          />
        ),
      },
      {
        title: 'Комментарий',
        dataIndex: 'comment',
        key: 'comment',
        width: '15%',
        render: (value: string, record: PurchaseItem) => (
          <Input
            value={value}
            onChange={(e) => {
              const newItems = [...items];
              const index = items.findIndex(
                (item) => item.productId === record.productId
              );
              if (index !== -1) {
                newItems[index].comment = e.target.value;
                setItems(addIdsToItems(newItems));
              }
            }}
            placeholder="Комментарий"
            size="small"
          />
        ),
      },
      {
        title: '',
        key: 'actions',
        width: '5%',
        render: (_: any, record: PurchaseItem) => (
          <Button
            danger
            onClick={() => handleRemoveProduct(record.productId)}
            icon={<DeleteOutlined />}
            size="small"
          />
        ),
      },
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Новый приход</h2>
            <div className="flex items-center gap-2">
              <Button
                icon={<BarcodeOutlined />}
                onClick={() => {
                  setIsScanning(!isScanning);
                  if (!isScanning) {
                    setTimeout(() => {
                      barcodeInputRef.current?.focus();
                    }, 100);
                  }
                }}
                type={isScanning ? 'primary' : 'default'}
                className={isScanning ? 'bg-blue-500' : ''}
              >
                {isScanning ? 'Отключить сканер' : 'Включить сканер'}
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={async () => {
                  try {
                    const data = await preparePreviewData();
                    if (data) {
                      setPreviewData(data);
                      setShowPreview(true);
                    }
                  } catch (error) {
                    if (error instanceof Error) {
                      message.error(error.message);
                    }
                  }
                }}
                disabled={items.length === 0}
              >
                Предпросмотр
              </Button>
            </div>
          </div>

          <Form form={form} layout="vertical" onChange={handleFormChange}>
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
              <Form.Item
                name="supplierId"
                label={<span className="font-medium">Поставщик</span>}
                rules={[{ required: true, message: 'Выберите поставщика' }]}
                tooltip={tooltips.supplier}
                help={
                  selectedSupplierId && supplierProducts.length === 0
                    ? 'У этого поставщика нет связанных товаров. Отображаются все товары магазина.'
                    : null
                }
              >
                <Select
                  placeholder="Выберите поставщика"
                  options={suppliers?.map((s) => ({
                    label: s.name,
                    value: s.id,
                  }))}
                  className="w-full"
                  showSearch
                  optionFilterProp="label"
                  onChange={handleSupplierChange}
                />
              </Form.Item>

              <Form.Item
                name="invoiceNumber"
                label={<span className="font-medium">Номер накладной</span>}
                rules={[{ required: true, message: 'Введите номер накладной' }]}
                tooltip={tooltips.invoiceNumber}
              >
                <Input placeholder="Введите номер накладной" />
              </Form.Item>

              <Form.Item
                name="date"
                label={<span className="font-medium">Дата</span>}
                initialValue={dayjs()}
                rules={[{ required: true, message: 'Укажите дату' }]}
                tooltip={tooltips.date}
              >
                <DatePicker
                  className="w-full"
                  format="DD.MM.YYYY HH:mm:ss"
                  placeholder="Выберите дату"
                  showTime
                />
              </Form.Item>

              <Form.Item
                name="comment"
                label={<span className="font-medium">Комментарий</span>}
              >
                <Input.TextArea
                  rows={1}
                  placeholder="Введите комментарий (необязательно)"
                />
              </Form.Item>
            </div>

            {isScanning && (
              <div className="mb-3 bg-blue-50 p-2 rounded-lg">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Отсканируйте штрих-код"
                  onPressEnter={(e) => {
                    const result = handleBarcodeScan(e.currentTarget.value);
                    if (result && result.success) {
                      message.success(
                        `Товар "${result.product.name}" добавлен по штрих-коду`
                      );
                    }
                    e.currentTarget.value = '';
                  }}
                  prefix={<BarcodeOutlined className="text-blue-500" />}
                  className="text-lg"
                />
              </div>
            )}

            <div className="mb-3 bg-gray-50 p-3 rounded-lg">
              <h3 className="text-base font-medium mb-2 text-blue-600">
                Добавление товаров
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Form.Item name="productId" noStyle>
                  <Select
                    placeholder="Поиск товара по названию или артикулу"
                    style={{ width: 300 }}
                    showSearch
                    onSearch={setSearchValue}
                    filterOption={false}
                    options={filteredProducts?.map((product) => ({
                      label: `${product.name} (${
                        product.sku || product.barcode || 'Нет кода'
                      })`,
                      value: product.id,
                    }))}
                    onChange={(value) => setSearchValue(value)}
                  />
                </Form.Item>
                <Button
                  onClick={() => {
                    const selectedProduct = filteredProducts.find(
                      (p) => p.id === searchValue
                    );
                    if (selectedProduct) {
                      handleAddProduct(selectedProduct);
                      message.success(
                        `Товар "${selectedProduct.name}" добавлен в приход`
                      );
                    } else {
                      message.error('Выберите товар из списка');
                    }
                  }}
                  type="primary"
                  className="bg-blue-500"
                  icon={<PlusOutlined />}
                  disabled={!searchValue}
                >
                  Добавить
                </Button>
                <Upload beforeUpload={handleExcelUpload} showUploadList={false}>
                  <Button
                    icon={<UploadOutlined />}
                    className="bg-green-50 text-green-700 border-green-500"
                  >
                    Загрузить из Excel
                  </Button>
                </Upload>

                {Array.isArray(items) && items.length > 0 && (
                  <div className="ml-auto">
                    <span className="text-gray-500 mr-2">
                      Всего товаров:{' '}
                      <strong>
                        {items.reduce(
                          (sum, item) => sum + (item.quantity || 0),
                          0
                        )}
                      </strong>
                    </span>
                    <span className="text-gray-500">
                      На сумму:{' '}
                      <strong>
                        {(() => {
                          const total = items.reduce((sum, item) => {
                            // Проверяем, что item.total является числом
                            const itemTotal =
                              typeof item.total === 'number' ? item.total : 0;
                            return sum + itemTotal;
                          }, 0);
                          return typeof total === 'number'
                            ? total.toFixed(2)
                            : '0.00';
                        })()}{' '}
                        KZT
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg mb-3">
              <Table
                columns={columns}
                dataSource={items}
                rowKey={(record) => record.id || record.productId}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
                locale={{
                  emptyText: (
                    <div className="py-6 text-center">
                      <InboxOutlined
                        style={{ fontSize: 40 }}
                        className="text-gray-300 mb-2"
                      />
                      <p className="text-gray-500 mb-1">Товары не добавлены</p>
                      <p className="text-gray-400 text-sm">
                        Используйте поле поиска выше для добавления товаров или
                        загрузите из Excel
                      </p>
                    </div>
                  ),
                }}
              />
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <Space size="middle">
                <div className="flex items-center gap-2">
                  <Form.Item
                    name="updatePrices"
                    valuePropName="checked"
                    noStyle
                  >
                    <Tooltip title={tooltips.updatePrices}>
                      <Switch className="bg-gray-300" />
                    </Tooltip>
                  </Form.Item>
                  <span className="font-medium text-sm">
                    Обновить цены продажи
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Form.Item
                    name="updatePurchasePrices"
                    valuePropName="checked"
                    noStyle
                  >
                    <Tooltip title={tooltips.updatePurchasePrices}>
                      <Switch className="bg-gray-300" />
                    </Tooltip>
                  </Form.Item>
                  <span className="font-medium text-sm">
                    Обновить закупочные цены
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Form.Item
                    name="createLabels"
                    valuePropName="checked"
                    noStyle
                  >
                    <Tooltip title={tooltips.createLabels}>
                      <Switch className="bg-gray-300" />
                    </Tooltip>
                  </Form.Item>
                  <span className="font-medium text-sm">Создать этикетки</span>
                </div>

                <div className="flex items-center gap-2">
                  <Form.Item
                    name="checkDuplicates"
                    valuePropName="checked"
                    noStyle
                  >
                    <Tooltip title={tooltips.checkDuplicates}>
                      <Switch className="bg-gray-300" />
                    </Tooltip>
                  </Form.Item>
                  <span className="font-medium text-sm">Проверять дубли</span>
                </div>
              </Space>

              <Space>
                <Button onClick={handleCloseWithSave}>Отмена</Button>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={createPurchaseMutation.isPending}
                  className="bg-blue-500"
                >
                  Сохранить
                </Button>
              </Space>
            </div>
          </Form>

          {showPreview && previewData && (
            <PurchasePreview
              data={previewData}
              visible={showPreview}
              onClose={() => setShowPreview(false)}
              onPrint={() => printElement('printable-area')}
            />
          )}
        </div>
      </div>
    );
  }
);

export default PurchaseForm;
