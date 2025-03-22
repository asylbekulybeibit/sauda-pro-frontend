import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
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
  Radio,
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
  NumberOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProducts,
  generateLabels,
  createPurchase,
  CreatePurchaseRequest,
  getPurchaseById,
  getSuppliers,
  getSupplierProducts,
  createSupplier,
} from '@/services/managerApi';
import { formatDate, formatPrice } from '@/utils/format';
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
  price?: string | number;
  цена?: string | number;
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
  priceWasEdited?: boolean;
  currentPrice?: number;
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
  markup?: number;
  markupType?: 'percentage' | 'fixed';
}

interface PurchaseProps {
  id: string;
  shopId?: string;
  providerId?: string;
  supplierId?: string;
  items?: any[]; // Используем any[] для совместимости
}

interface PurchaseFormProps {
  shopId?: string;
  initialData?: PurchaseProps;
  onClose: () => void;
  onSuccess?: () => void;
}

// Интерфейс для методов, которые будут доступны через ref
interface PurchaseFormHandle {
  handleClose: () => Promise<void>;
}

const PurchaseForm = forwardRef<PurchaseFormHandle, PurchaseFormProps>(
  ({ shopId, initialData, onClose, onSuccess }, ref) => {
    console.log('PurchaseForm initialized with shopId:', shopId);
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
    const [markupSuffix, setMarkupSuffix] = useState('%');

    // Queries
    const { data: allProducts = [] } = useQuery({
      queryKey: ['products', shopId],
      queryFn: () => getProducts(shopId!),
      enabled: !!shopId,
    });

    const { data: suppliers = [] } = useQuery({
      queryKey: ['suppliers', shopId],
      queryFn: () => getSuppliers(shopId!),
      enabled: !!shopId,
    });

    // Загружаем товары поставщика при его выборе
    const { data: supplierProducts = [] } = useQuery({
      queryKey: ['supplierProducts', selectedSupplierId, shopId],
      queryFn: () =>
        selectedSupplierId && shopId
          ? getSupplierProducts(selectedSupplierId, shopId)
          : Promise.resolve([]),
      enabled: !!selectedSupplierId && !!shopId,
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
        onSuccess?.();
      },
      onError: (error: Error) => {
        message.error('Ошибка при создании прихода: ' + error.message);
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

    // Инициализация формы
    useEffect(() => {
      // Инициализация формы значениями по умолчанию
      form.setFieldsValue({
        date: dayjs(),
        updatePrices: false,
        updatePurchasePrices: false,
        createLabels: false,
        checkDuplicates: false,
        markup: 30, // 30% по умолчанию
        markupType: 'percentage', // процентная наценка по умолчанию
      });
      console.log('Форма инициализирована значениями по умолчанию');
    }, [form]);

    // Упростим useEffect для отслеживания изменений типа наценки
    useEffect(() => {
      // Устанавливаем начальное значение суффикса в зависимости от типа наценки
      const markupType = form.getFieldValue('markupType');
      setMarkupSuffix(markupType === 'percentage' ? '%' : '₸');
    }, [form]);

    // Обработчики
    const handleBarcodeScan = (barcode: string) => {
      if (!barcode) return null;

      // Поиск товара по штрих-коду
      const foundProduct = allProducts?.find(
        (product) => product.barcode === barcode
      );

      if (foundProduct) {
        // Проверяем, есть ли товар уже в списке
        const existingItem = items.find(
          (item) => item.productId === foundProduct.id
        );

        if (existingItem) {
          // Показываем предупреждение, если товар уже есть в списке
          message.warning(`Товар "${foundProduct.name}" уже добавлен в приход`);
          return { success: false, product: foundProduct, alreadyExists: true };
        }

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
        const duplicateProducts: string[] = []; // Список дублирующихся товаров
        const notFoundProducts: string[] = []; // Список не найденных товаров

        rows.forEach((row) => {
          console.log('[EXCEL UPLOAD] Processing row:', row);

          // Сначала пытаемся найти продукт по точным совпадениям (SKU или штрихкод)
          let product: ExtendedProduct | undefined;

          // Поиск по SKU (наиболее точный метод)
          if (row.sku) {
            product = filteredProducts?.find((p) => p.sku === row.sku);
            if (product) {
              console.log(`[EXCEL UPLOAD] Product found by SKU: ${row.sku}`);
            }
          }

          // Если не нашли по SKU, ищем по штрихкоду
          if (!product && row.barcode) {
            product = filteredProducts?.find((p) => {
              // Проверяем, есть ли barcodes массив и содержит ли он нужный штрихкод
              if (Array.isArray(p.barcodes) && p.barcodes.length > 0) {
                return p.barcodes.includes(row.barcode);
              }
              // Проверяем поле barcode, если оно есть
              return p.barcode === row.barcode;
            });
            if (product) {
              console.log(
                `[EXCEL UPLOAD] Product found by barcode: ${row.barcode}`
              );
            }
          }

          // Только если не нашли по SKU или штрихкоду, пытаемся найти по имени
          if (!product && row.name) {
            product = filteredProducts?.find((p) => p.name === row.name);
            if (product) {
              console.log(
                `[EXCEL UPLOAD] Product found by exact name match: ${row.name}`
              );
            }
          }

          if (!product) {
            const identifier =
              row.sku || row.barcode || row.name || 'Неизвестный товар';
            notFoundProducts.push(identifier);
            console.log(`[EXCEL UPLOAD] Product not found: ${identifier}`);
            return;
          }

          // Проверяем, есть ли товар уже в списке
          const existingItemInCurrentList = items.find(
            (item) => item.productId === product.id
          );

          if (existingItemInCurrentList) {
            // Добавляем название товара в список дублей
            duplicateProducts.push(product.name);
            console.log(`[EXCEL UPLOAD] Duplicate product: ${product.name}`);
            return;
          }

          // Убедимся, что количество и цена являются числами
          const quantity = Number(row.quantity) || 1;

          // Проверяем, есть ли цена в Excel-файле
          let price = 0;
          let priceWasEdited = true; // ВСЕГДА помечаем цену как отредактированную

          // Если в Excel есть поле "price" или "цена", используем его
          if (row.hasOwnProperty('price') || row.hasOwnProperty('цена')) {
            const excelPrice = Number(row.price || row.цена);
            if (!isNaN(excelPrice) && excelPrice > 0) {
              price = excelPrice;
              console.log(
                `[EXCEL UPLOAD] Для товара ${product.name} используется цена ${price} из Excel`
              );
            }
          }

          // Если цена не найдена в Excel, используем последнюю закупочную
          if (
            price === 0 &&
            typeof product.purchasePrice === 'number' &&
            !isNaN(product.purchasePrice) &&
            product.purchasePrice > 0
          ) {
            price = product.purchasePrice;
            console.log(
              `[EXCEL UPLOAD] Для товара ${product.name} используется закупочная цена ${price}`
            );
          }

          console.log(`[EXCEL UPLOAD] Товар ${product.name}:`);
          console.log(`  - ID: ${product.id}`);
          console.log(`  - Итоговая цена: ${price}`);
          console.log(`  - priceWasEdited: ${priceWasEdited}`);

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
            priceWasEdited,
          });
        });

        // Показываем предупреждение о дублирующихся товарах, если они есть
        if (duplicateProducts.length > 0) {
          message.warning(
            `Следующие товары уже добавлены и не будут добавлены повторно: ${duplicateProducts.join(
              ', '
            )}`
          );
        }

        // Показываем предупреждение о не найденных товарах
        if (notFoundProducts.length > 0) {
          message.warning(
            `Следующие товары не найдены: ${notFoundProducts.join(', ')}`
          );
        }

        // Проверяем каждый элемент на наличие корректной цены
        newItems.forEach((item) => {
          console.log(
            `[EXCEL UPLOAD] Проверка товара перед добавлением: ${
              item.name || item.productId
            }`
          );
          console.log(`  - Цена: ${item.price}`);
          console.log(`  - priceWasEdited: ${item.priceWasEdited}`);

          // Убедимся, что цена всегда число
          if (typeof item.price !== 'number' || isNaN(item.price)) {
            console.warn(
              `[EXCEL UPLOAD] Исправляем невалидную цену для товара ${
                item.name || item.productId
              }`
            );
            item.price = 0;
          }
        });

        // Добавляем только новые товары
        if (newItems.length > 0) {
          setItems(addIdsToItems([...items, ...newItems]));
          message.success(`Добавлено ${newItems.length} товаров`);
        } else if (
          duplicateProducts.length === 0 &&
          notFoundProducts.length === 0
        ) {
          message.info('Нет новых товаров для добавления');
        }

        // Логируем итоги обработки Excel-файла
        console.log('[EXCEL UPLOAD] Processing summary:');
        console.log(`- Rows processed: ${rows.length}`);
        console.log(`- Products added: ${newItems.length}`);
        console.log(`- Duplicate products: ${duplicateProducts.length}`);
        console.log(`- Not found products: ${notFoundProducts.length}`);
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
      // Проверяем, есть ли товар уже в списке
      const existingItem = items.find((item) => item.productId === product.id);

      if (existingItem) {
        // Показываем предупреждение, если товар уже есть в списке
        message.warning(`Товар "${product.name}" уже добавлен в приход`);
        return;
      }

      // Преобразуем цену в правильный числовой формат
      let price = 0;

      // Обрабатываем различные типы цен
      if (typeof product.purchasePrice === 'string') {
        // Безопасное преобразование строки в число
        const strPrice = String(product.purchasePrice);
        price = Number(strPrice.replace(/[^0-9.-]+/g, ''));
      } else if (
        typeof product.purchasePrice === 'number' &&
        !isNaN(product.purchasePrice)
      ) {
        price = product.purchasePrice;
      }

      console.log(`[ADD PRODUCT] Товар ${product.name || product.id}:`);
      console.log(`  - ID: ${product.id}`);
      console.log(`  - Закупочная цена из продукта: ${product.purchasePrice}`);
      console.log(`  - Тип закупочной цены: ${typeof product.purchasePrice}`);
      console.log(`  - Цена после преобразования: ${price}`);
      console.log(`  - Тип цены после преобразования: ${typeof price}`);

      // Создаем новый элемент с гарантированно числовой ценой
      const newItem: PurchaseItem = {
        id: crypto.randomUUID(), // Добавляем уникальный ID сразу
        productId: product.id,
        quantity: 1,
        price: price, // Гарантированно числовое значение
        total: price, // Гарантированно числовое значение
        barcode: product.barcode,
        name: product.name,
        sku: product.sku,
        unit: product.unit || 'шт',
        needsLabels: false,
        comment: '',
        priceWasEdited: true, // ВСЕГДА помечаем цену как отредактированную
      };

      console.log(
        `[ADD PRODUCT] Финальный объект товара для добавления:`,
        newItem
      );

      // Важно: обновляем состояние items напрямую с новым товаром
      const updatedItems = [...items, newItem];
      setItems(updatedItems);

      // Логируем для проверки
      console.log('[ADD PRODUCT] Товары после добавления:', updatedItems);
      console.log(
        `[ADD PRODUCT] Проверка последнего добавленного товара:`,
        updatedItems[updatedItems.length - 1]
      );

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

    // Handle form submission
    const handleSubmit = async () => {
      try {
        const values = await form.validateFields();

        // Логируем значения переключателей
        console.log('[FORM VALUES]', {
          updatePrices: values.updatePrices,
          updatePurchasePrices: values.updatePurchasePrices,
          createLabels: values.createLabels,
          checkDuplicates: values.checkDuplicates,
          markup: values.markup,
          markupType: values.markupType,
        });

        if (!items.length) {
          message.error('Добавьте хотя бы один товар');
          return;
        }

        // Проверка наличия shopId
        if (!shopId) {
          message.error('ID магазина не указан');
          console.error('shopId is undefined or null', { shopId });
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
                // Выводим состояние товаров перед отправкой
                console.log(
                  'Состояние всех товаров перед отправкой:',
                  JSON.stringify(items, null, 2)
                );

                // Получаем текущие значения переключателей
                const formValues = form.getFieldsValue();
                console.log('[SUBMIT] Текущие значения формы:', formValues);

                // Убедимся, что значения переключателей определены
                const updatePrices = formValues.updatePrices === true;
                const updatePurchasePrices =
                  formValues.updatePurchasePrices === true;
                const createLabels = formValues.createLabels === true;
                const checkDuplicates = formValues.checkDuplicates === true;
                const markup =
                  formValues.markup !== undefined
                    ? Number(formValues.markup)
                    : undefined;
                const markupType = formValues.markupType || 'percentage';

                console.log('[SUBMIT] Финальные значения переключателей:', {
                  updatePrices,
                  updatePurchasePrices,
                  createLabels,
                  checkDuplicates,
                  markup,
                  markupType,
                });

                // Создаем новый приход
                const purchaseData: CreatePurchaseRequest = {
                  shopId: shopId || '',
                  supplierId: values.supplierId,
                  invoiceNumber: values.invoiceNumber,
                  date: values.date.format('YYYY-MM-DDTHH:mm:ss'),
                  comment: values.comment,
                  items: items.map((item) => {
                    // Принудительно преобразуем цену к числу
                    let price = 0;

                    if (typeof item.price === 'number' && !isNaN(item.price)) {
                      price = item.price;
                    } else if (typeof item.price === 'string') {
                      price = Number(item.price);
                      if (isNaN(price)) price = 0;
                    }

                    console.log(
                      `ФИНАЛЬНАЯ отправка: товар ${
                        item.name || item.productId
                      }, цена=${price}, исходная цена=${item.price}`
                    );

                    return {
                      productId: item.productId,
                      quantity: item.quantity || 0,
                      price: price, // Гарантированно числовое значение
                      partialQuantity: item.partialQuantity,
                      serialNumber: item.serialNumber,
                      expiryDate: item.expiryDate,
                      comment: item.comment,
                    };
                  }),
                  updatePrices,
                  updatePurchasePrices,
                  createLabels,
                  checkDuplicates,
                  markup,
                  markupType,
                };

                console.log('Отправляем запрос с shopId:', shopId);
                console.log('purchaseData:', purchaseData);
                try {
                  await createPurchaseMutation.mutateAsync(purchaseData);
                  if (onSuccess) {
                    onSuccess();
                  }
                  resolve(true);
                } catch (error) {
                  console.error('Error submitting purchase:', error);
                  if (error instanceof Error) {
                    message.error(error.message);
                  }
                  resolve(false);
                }
              },
              onCancel: () => {
                resolve(false);
              },
            });
          });
        } else {
          // Выводим состояние товаров перед отправкой
          console.log(
            'Состояние всех товаров перед отправкой:',
            JSON.stringify(items, null, 2)
          );

          // Получаем текущие значения переключателей
          const formValues = form.getFieldsValue();
          console.log('[SUBMIT] Текущие значения формы:', formValues);

          // Убедимся, что значения переключателей определены
          const updatePrices = formValues.updatePrices === true;
          const updatePurchasePrices = formValues.updatePurchasePrices === true;
          const createLabels = formValues.createLabels === true;
          const checkDuplicates = formValues.checkDuplicates === true;
          const markup =
            formValues.markup !== undefined
              ? Number(formValues.markup)
              : undefined;
          const markupType = formValues.markupType || 'percentage';

          console.log('[SUBMIT] Финальные значения переключателей:', {
            updatePrices,
            updatePurchasePrices,
            createLabels,
            checkDuplicates,
            markup,
            markupType,
          });

          // Если нет проблемных товаров, продолжаем без подтверждения
          const purchaseData: CreatePurchaseRequest = {
            shopId: shopId || '',
            supplierId: values.supplierId,
            invoiceNumber: values.invoiceNumber,
            date: values.date.format('YYYY-MM-DDTHH:mm:ss'),
            comment: values.comment,
            items: items.map((item) => {
              // Принудительно преобразуем цену к числу
              let price = 0;

              if (typeof item.price === 'number' && !isNaN(item.price)) {
                price = item.price;
              } else if (typeof item.price === 'string') {
                price = Number(item.price);
                if (isNaN(price)) price = 0;
              }

              console.log(
                `ФИНАЛЬНАЯ отправка: товар ${
                  item.name || item.productId
                }, цена=${price}, исходная цена=${item.price}`
              );

              return {
                productId: item.productId,
                quantity: item.quantity || 0,
                price: price, // Гарантированно числовое значение
                partialQuantity: item.partialQuantity,
                serialNumber: item.serialNumber,
                expiryDate: item.expiryDate,
                comment: item.comment,
              };
            }),
            updatePrices,
            updatePurchasePrices,
            createLabels,
            checkDuplicates,
            markup,
            markupType,
          };

          console.log('Отправляем запрос с shopId:', shopId);
          console.log('purchaseData:', purchaseData);
          await createPurchaseMutation.mutateAsync(purchaseData);
          if (onSuccess) {
            onSuccess();
          }
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
      checkDuplicates:
        'Объединять дубликаты одинаковых товаров в один с суммированием количества',
      markup:
        'Укажите величину наценки для автоматического расчёта цены продажи',
      markupPercentage:
        'Процентная наценка: новая цена = закупочная цена × (1 + процент/100)',
      markupFixed:
        'Фиксированная наценка: новая цена = закупочная цена + фиксированная сумма в тенге',
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
        render: (value: number, record: PurchaseItem, index: number) => {
          console.log(
            `[RENDER PRICE] Текущая цена для ${
              record.name || record.productId
            }: ${value}, тип: ${typeof value}`
          );

          // Выполняем проверку, чтобы гарантировать, что value является числом
          let displayValue = value;
          if (typeof value !== 'number' || isNaN(value)) {
            console.warn(
              `[RENDER PRICE] Невалидная цена: ${value}, устанавливаем 0`
            );
            displayValue = 0;
          }

          return (
            <InputNumber
              min={0}
              value={displayValue}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
              onChange={(val) => {
                // Просто обновляем значение без проверки при вводе
                const newItems = [...items];
                if (val !== null) {
                  console.log(
                    `[PRICE CHANGE] Товар: ${record.name || record.productId}`
                  );
                  console.log(
                    `  - Старая цена: ${
                      newItems[index].price
                    }, тип: ${typeof newItems[index].price}`
                  );
                  console.log(`  - Новая цена: ${val}, тип: ${typeof val}`);

                  // Гарантируем, что сохраняется числовое значение
                  newItems[index].price = Number(val);
                  // Помечаем цену как отредактированную пользователем
                  newItems[index].priceWasEdited = true;
                  console.log(
                    `Цена для товара ${
                      newItems[index].name || newItems[index].productId
                    } изменена на ${val}, помечена как отредактированная`
                  );

                  // Убедимся, что количество является числом
                  const quantity =
                    typeof newItems[index].quantity === 'number' &&
                    !isNaN(newItems[index].quantity)
                      ? newItems[index].quantity
                      : 0;

                  newItems[index].total = Number(val) * quantity;

                  console.log(
                    `[PRICE CHANGE] Сохраняем обновленную цену для товара ${
                      record.name || record.productId
                    }, финальная цена: ${newItems[index].price}`
                  );
                  setItems(newItems);
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
                          <strong>
                            {product.purchasePrice.toFixed(2)} KZT
                          </strong>
                        </p>
                        <p>
                          Введенная цена:{' '}
                          <strong>{item.price.toFixed(2)} KZT</strong>
                        </p>
                        <p>
                          Разница:{' '}
                          <strong>
                            {(product.purchasePrice - item.price).toFixed(2)}{' '}
                            KZT
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
          );
        },
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

    // Экспортируем методы через ref
    useImperativeHandle(ref, () => ({
      handleClose: async () => {
        console.log('handleClose called');
        return Promise.resolve();
      },
    }));

    const initialValues = useMemo(() => {
      if (initialData) {
        return {
          shopId: initialData.shopId,
          supplierId: initialData.supplierId,
          // ... existing code ...
        };
      }
      return {
        shopId: shopId,
        // ... existing code ...
      };
    }, [initialData, shopId]);

    // Проверяем имеющиеся цены товаров
    const checkProductPrices = async (
      items: PurchaseItem[]
    ): Promise<boolean> => {
      const itemsWithLowPrices = items.filter((item) => {
        const currentPrice = item.currentPrice ?? 0;
        return item.price < currentPrice;
      });

      // Если есть товары с низкими ценами, показываем подтверждение
      if (itemsWithLowPrices.length > 0) {
        return new Promise((resolve) => {
          Modal.confirm({
            title: 'Внимание: низкие цены',
            content: (
              <div>
                <p>Следующие товары имеют цены ниже текущих закупочных цен:</p>
                <ul>
                  {itemsWithLowPrices.map((item) => (
                    <li key={item.id}>
                      {item.name} - {formatPrice(item.price)} (текущая цена:{' '}
                      {formatPrice(item.currentPrice ?? 0)})
                    </li>
                  ))}
                </ul>
                <p>Вы уверены, что хотите продолжить?</p>
              </div>
            ),
            okText: 'Продолжить',
            cancelText: 'Отмена',
            onOk: () => {
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          });
        });
      }

      return true;
    };

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

          <Form form={form} layout="vertical">
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
                      // Проверяем, есть ли товар уже в списке
                      const existingItem = items.find(
                        (item) => item.productId === selectedProduct.id
                      );

                      if (existingItem) {
                        // Показываем предупреждение, если товар уже есть в списке
                        message.warning(
                          `Товар "${selectedProduct.name}" уже добавлен в приход`
                        );
                      } else {
                        handleAddProduct(selectedProduct);
                        message.success(
                          `Товар "${selectedProduct.name}" добавлен в приход`
                        );
                      }
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
                      <Switch
                        className="bg-gray-300"
                        onChange={(checked) => {
                          console.log(
                            `[SWITCH] updatePrices изменен на: ${checked}`
                          );
                          form.setFieldsValue({ updatePrices: checked });
                        }}
                      />
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
                      <Switch
                        className="bg-gray-300"
                        onChange={(checked) => {
                          console.log(
                            `[SWITCH] updatePurchasePrices изменен на: ${checked}`
                          );
                          form.setFieldsValue({
                            updatePurchasePrices: checked,
                          });
                        }}
                      />
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
                      <Switch
                        className="bg-gray-300"
                        onChange={(checked) => {
                          console.log(
                            `[SWITCH] createLabels изменен на: ${checked}`
                          );
                          form.setFieldsValue({ createLabels: checked });
                        }}
                      />
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
                      <Switch
                        className="bg-gray-300"
                        onChange={(checked) => {
                          console.log(
                            `[SWITCH] checkDuplicates изменен на: ${checked}`
                          );
                          form.setFieldsValue({ checkDuplicates: checked });
                        }}
                      />
                    </Tooltip>
                  </Form.Item>
                  <span className="font-medium text-sm">Проверять дубли</span>
                </div>

                <div className="flex items-center gap-2 border rounded-md p-1.5 bg-gray-50 shadow-sm hover:bg-blue-50 transition-colors">
                  <span className="font-medium text-sm mr-1 flex items-center text-blue-700">
                    <DollarOutlined className="mr-1 text-blue-500" />
                    Наценка:
                  </span>

                  <Form.Item name="markup" noStyle>
                    <Tooltip title={tooltips.markup}>
                      <InputNumber
                        min={0}
                        max={1000}
                        placeholder="30"
                        style={{ width: 90 }}
                        addonAfter={markupSuffix}
                        className="border rounded-l-md"
                        onChange={(value) => {
                          console.log(`[INPUT] Наценка изменена на: ${value}`);
                          form.setFieldsValue({ markup: value });
                        }}
                      />
                    </Tooltip>
                  </Form.Item>

                  <Form.Item name="markupType" noStyle>
                    <Radio.Group
                      buttonStyle="solid"
                      size="small"
                      className="ml-1"
                      onChange={(e) => {
                        const type = e.target.value;
                        console.log(`[RADIO] Тип наценки изменен на: ${type}`);
                        form.setFieldsValue({ markupType: type });
                        // Обновляем суффикс
                        setMarkupSuffix(type === 'percentage' ? '%' : '₸');
                      }}
                    >
                      <Tooltip title={tooltips.markupPercentage}>
                        <Radio.Button
                          value="percentage"
                          className="flex items-center justify-center"
                          style={{
                            backgroundColor:
                              form.getFieldValue('markupType') === 'percentage'
                                ? '#e6f7ff'
                                : undefined,
                            borderColor:
                              form.getFieldValue('markupType') === 'percentage'
                                ? '#1890ff'
                                : undefined,
                          }}
                        >
                          <span className="text-sm font-bold flex items-center">
                            <PercentageOutlined className="mr-1" />%
                          </span>
                        </Radio.Button>
                      </Tooltip>
                      <Tooltip title={tooltips.markupFixed}>
                        <Radio.Button
                          value="fixed"
                          className="flex items-center justify-center"
                          style={{
                            backgroundColor:
                              form.getFieldValue('markupType') === 'fixed'
                                ? '#e6f7ff'
                                : undefined,
                            borderColor:
                              form.getFieldValue('markupType') === 'fixed'
                                ? '#1890ff'
                                : undefined,
                          }}
                        >
                          <span className="text-sm font-bold flex items-center">
                            <PlusOutlined className="mr-1" />₸
                          </span>
                        </Radio.Button>
                      </Tooltip>
                    </Radio.Group>
                  </Form.Item>
                </div>
              </Space>

              <Space>
                <Button
                  onClick={() => {
                    // При нажатии "Отмена" показываем предупреждение о потере данных
                    onClose();
                  }}
                >
                  Отмена
                </Button>
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
