import { useState, useRef, useEffect } from 'react';
import {
  Form,
  Input as AntInput,
  InputRef,
  Select,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Space,
  Upload,
  message,
  Switch,
  Tooltip,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  fetchSuppliers,
  generateLabels,
  createPurchase,
  CreatePurchaseRequest,
  getPurchaseById,
} from '@/services/managerApi';
import { formatDate } from '@/utils/format';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { PurchasePreview } from './PurchasePreview';
import { printElement } from '@/utils/print';
import { Product } from '@/types/product';
import { ApiErrorHandler } from '@/utils/error-handler';
import { Purchase } from '@/types/purchase';

interface ExcelRow {
  sku?: string;
  barcode?: string;
  name?: string;
  quantity?: string | number;
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
  productId: string;
  quantity: number;
  price: number;
  total: number;
  partialQuantity?: number;
  serialNumber?: string;
  expiryDate?: string;
  needsLabels: boolean;
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
  initialData?: FormData;
}

export function PurchaseForm({
  shopId,
  onClose,
  onSuccess,
  initialData,
}: PurchaseFormProps) {
  const [form] = Form.useForm();
  const [items, setItems] = useState<PurchaseItem[]>(initialData?.items || []);
  const [searchValue, setSearchValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const barcodeInputRef = useRef<InputRef>(null);
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => fetchProducts(shopId),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ['purchases', shopId],
    queryFn: async () => {
      const response = await getPurchaseById(shopId);
      return Array.isArray(response) ? response : [response];
    },
  });

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

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        supplierId: initialData.supplierId,
        invoiceNumber: '', // Очищаем номер накладной при копировании
        date: dayjs(), // Устанавливаем текущую дату
        comment: initialData.comment,
      });
      setItems(
        initialData.items.map((item: any) => ({
          ...item,
          id: undefined, // Очищаем ID при копировании
        }))
      );
    }
  }, [initialData, form]);

  // Обработчики
  const handleBarcodeScan = (barcode: string) => {
    const product = products?.find(
      (p) => p.barcode === barcode || p.barcodes?.includes(barcode)
    );

    if (product) {
      return {
        productId: product.id.toString(),
        quantity: 1,
        price: product.purchasePrice,
        total: product.purchasePrice,
        needsLabels: false,
      };
    }

    return null;
  };

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet);

      const newItems = rows
        .map((row) => {
          const product = products?.find(
            (p) =>
              p.sku === row.sku ||
              p.barcode === row.barcode ||
              p.name === row.name
          );

          if (!product) {
            message.warning(
              `Товар не найден: ${row.sku || row.barcode || row.name}`
            );
            return undefined;
          }

          const quantity = Number(row.quantity) || 1;

          return {
            productId: product.id.toString(),
            quantity,
            price: product.purchasePrice,
            total: product.purchasePrice * quantity,
            needsLabels: false,
          };
        })
        .filter((item): item is PurchaseItem => item !== undefined);

      // Merge with existing items
      const mergedItems = [...items];
      newItems.forEach((newItem) => {
        const existingIndex = mergedItems.findIndex(
          (item) => item.productId === newItem.productId
        );
        if (existingIndex >= 0) {
          mergedItems[existingIndex] = {
            ...mergedItems[existingIndex],
            quantity:
              (mergedItems[existingIndex].quantity || 0) + newItem.quantity,
            total: (mergedItems[existingIndex].total || 0) + newItem.total,
          };
        } else {
          mergedItems.push(newItem);
        }
      });

      setItems(mergedItems);
      message.success(`Добавлено ${newItems.length} товаров`);
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleQuantityChange = (productId: string, value: number | null) => {
    if (value === null) return;

    setItems(
      items.map((item) =>
        item.productId === productId ? { ...item, quantity: value } : item
      )
    );
  };

  const handleExpiryDateChange = (
    productId: string,
    date: dayjs.Dayjs | null
  ) => {
    setItems(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              expiryDate: date ? date.format('YYYY-MM-DD') : undefined,
            }
          : item
      )
    );
  };

  const handlePartialQuantityChange = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index].partialQuantity = value;
    setItems(newItems);
  };

  const handlePriceChange = (index: number, value: number | null) => {
    if (value === null) return;

    const newItems = [...items];
    const item = items[index];
    const product = products?.find((p) => p.id.toString() === item.productId);

    if (!product) {
      message.error('Товар не найден');
      return;
    }

    if (value < product.purchasePrice) {
      Modal.confirm({
        title: 'Внимание',
        icon: <ExclamationCircleOutlined />,
        content: 'Цена ниже текущей закупочной. Продолжить?',
        onOk: () => {
          newItems[index].price = value;
          newItems[index].total = value * newItems[index].quantity;
          setItems(newItems);
        },
      });
    } else {
      newItems[index].price = value;
      newItems[index].total = value * newItems[index].quantity;
      setItems(newItems);
    }
  };

  const handleAddProduct = (product: Product) => {
    const productId = product.id.toString();
    const newItem: PurchaseItem = {
      productId,
      quantity: 1,
      price: product.purchasePrice,
      total: product.purchasePrice,
      needsLabels: false,
    };
    setItems([...items, newItem]);
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

      const previewItems = items.map((item) => {
        const product = products.find(
          (p) => p.id.toString() === item.productId
        );
        if (!product) {
          throw new Error(`Товар с ID ${item.productId} не найден`);
        }

        return {
          productId: item.productId,
          product: {
            name: product.name,
            sku: product.sku,
          },
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        };
      });

      const totalAmount = previewItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      setPreviewData({
        id: crypto.randomUUID(),
        date: values.date.format('YYYY-MM-DD'),
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
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (items.length === 0) {
        throw new Error('Добавьте хотя бы один товар');
      }

      const purchaseData: CreatePurchaseRequest = {
        shopId,
        supplierId: values.supplierId,
        invoiceNumber: values.invoiceNumber,
        date: values.date.format('YYYY-MM-DD'),
        comment: values.comment,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          partialQuantity: item.partialQuantity,
          serialNumber: item.serialNumber,
          expiryDate: item.expiryDate,
        })),
        updatePrices: values.updatePrices,
        createLabels: values.createLabels,
      };

      await createPurchaseMutation.mutateAsync(purchaseData);
      onClose();
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

  const handleCopy = async (purchaseId: string) => {
    try {
      const purchase = await getPurchaseById(purchaseId);
      if (!purchase) return;

      setItems(
        purchase.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          needsLabels: false,
        }))
      );

      form.setFieldsValue({
        supplierId: purchase.supplier.id.toString(),
        invoiceNumber: '',
        date: dayjs(),
        comment: purchase.comment,
      });
    } catch (error) {
      console.error('Error copying purchase:', error);
      message.error('Ошибка при копировании закупки');
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
    createLabels: 'Автоматически создать этикетки для новых товаров',
    checkDuplicates: 'Проверять наличие накладных с таким же номером',
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'productId',
      key: 'name',
      render: (productId: string) => {
        const product = products.find((p) => p.id.toString() === productId);
        return product?.name || 'Неизвестный товар';
      },
    },
    {
      title: 'Артикул',
      dataIndex: 'productId',
      key: 'sku',
      render: (productId: string) => {
        const product = products.find((p) => p.id.toString() === productId);
        return product?.sku || 'Н/Д';
      },
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: number, record: PurchaseItem) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => handleQuantityChange(record.productId, val)}
        />
      ),
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (value: number, record: PurchaseItem) => (
        <InputNumber
          min={0}
          value={value}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          }
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
          onChange={(val) => {
            if (val === null) return;
            const newItems = [...items];
            const index = items.findIndex(
              (item) => item.productId === record.productId
            );
            if (index === -1) return;

            const product = products?.find((p) => p.id === record.productId);
            if (product && val < product.purchasePrice) {
              Modal.confirm({
                title: 'Внимание',
                icon: <ExclamationCircleOutlined />,
                content: 'Цена ниже текущей закупочной. Продолжить?',
                onOk: () => {
                  newItems[index].price = val;
                  newItems[index].total = val * newItems[index].quantity;
                  setItems(newItems);
                },
              });
            } else {
              newItems[index].price = val;
              newItems[index].total = val * newItems[index].quantity;
              setItems(newItems);
            }
          }}
        />
      ),
    },
    {
      title: 'Серийный номер',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      render: (value: string | undefined, record: PurchaseItem) => (
        <AntInput
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setItems(
              items.map((item) =>
                item.productId === record.productId
                  ? { ...item, serialNumber: e.target.value }
                  : item
              )
            );
          }}
        />
      ),
    },
    {
      title: 'Срок годности',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (value: string | undefined, record: PurchaseItem) => (
        <DatePicker
          value={value ? dayjs(value) : undefined}
          onChange={(date) => handleExpiryDateChange(record.productId, date)}
        />
      ),
    },
    {
      title: 'Этикетки',
      dataIndex: 'needsLabels',
      key: 'needsLabels',
      render: (value: boolean | undefined, record: PurchaseItem) => (
        <Switch
          checked={value}
          onChange={(checked) => {
            setItems(
              items.map((item) =>
                item.productId === record.productId
                  ? { ...item, needsLabels: checked }
                  : item
              )
            );
          }}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: PurchaseItem) => (
        <Button
          type="link"
          danger
          onClick={() => {
            setItems(
              items.filter((item) => item.productId !== record.productId)
            );
          }}
        >
          Удалить
        </Button>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Приход товара</h2>
          <Space>
            <Tooltip title="Сканировать штрих-код">
              <Button
                icon={<BarcodeOutlined />}
                onClick={() => setIsScanning(!isScanning)}
                type={isScanning ? 'primary' : 'default'}
              />
            </Tooltip>
            <Tooltip title="Предпросмотр и печать">
              <Button icon={<PrinterOutlined />} onClick={handlePrint} />
            </Tooltip>
            <Tooltip title="Копировать существующий приход">
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Копировать существующий приход',
                    content: (
                      <Select
                        placeholder="Выберите приход для копирования"
                        style={{ width: '100%' }}
                        onChange={(value) => handleCopy(value)}
                        options={purchases?.map((p) => ({
                          label: `${p.invoiceNumber} (${formatDate(p.date)})`,
                          value: p.id,
                        }))}
                      />
                    ),
                    okText: 'Копировать',
                    cancelText: 'Отмена',
                    onOk: () => {},
                  });
                }}
              />
            </Tooltip>
          </Space>
        </div>

        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="supplierId"
              label="Поставщик"
              rules={[{ required: true, message: 'Выберите поставщика' }]}
              tooltip={tooltips.supplier}
            >
              <Select
                placeholder="Выберите поставщика"
                options={suppliers?.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="invoiceNumber"
              label="Номер накладной"
              rules={[{ required: true, message: 'Введите номер накладной' }]}
              tooltip={tooltips.invoiceNumber}
            >
              <AntInput />
            </Form.Item>

            <Form.Item
              name="date"
              label="Дата"
              initialValue={dayjs()}
              rules={[{ required: true, message: 'Укажите дату' }]}
              tooltip={tooltips.date}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="comment" label="Комментарий">
              <AntInput.TextArea rows={1} />
            </Form.Item>
          </div>

          {isScanning && (
            <div className="mb-4">
              <AntInput
                ref={barcodeInputRef}
                placeholder="Отсканируйте штрих-код"
                onPressEnter={(e) => {
                  handleBarcodeScan(e.currentTarget.value);
                  e.currentTarget.value = '';
                }}
              />
            </div>
          )}

          <div className="mb-4">
            <Space>
              <Form.Item name="productId" noStyle>
                <Select
                  placeholder="Поиск товара"
                  style={{ width: 300 }}
                  showSearch
                  onSearch={setSearchValue}
                  filterOption={false}
                  options={products?.map((product) => ({
                    label: `${product.name} (${
                      product.sku || product.barcode || 'Нет кода'
                    })`,
                    value: product.id,
                  }))}
                />
              </Form.Item>
              {searchValue && (
                <Button
                  onClick={() =>
                    handleAddProduct(
                      products.find((p) => p.id === searchValue) as Product
                    )
                  }
                >
                  Добавить
                </Button>
              )}
              <Upload beforeUpload={handleExcelUpload} showUploadList={false}>
                <Button icon={<UploadOutlined />}>Загрузить из Excel</Button>
              </Upload>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={items}
            rowKey="productId"
            pagination={false}
          />

          <div className="mt-4 flex justify-between items-center">
            <Space>
              <Form.Item name="updatePrices" valuePropName="checked" noStyle>
                <Tooltip title={tooltips.updatePrices}>
                  <Switch />
                </Tooltip>
              </Form.Item>
              <span>Обновить цены продажи</span>

              <Form.Item name="createLabels" valuePropName="checked" noStyle>
                <Tooltip title={tooltips.createLabels}>
                  <Switch />
                </Tooltip>
              </Form.Item>
              <span>Создать этикетки</span>

              <Form.Item name="checkDuplicates" valuePropName="checked" noStyle>
                <Tooltip title={tooltips.checkDuplicates}>
                  <Switch />
                </Tooltip>
              </Form.Item>
              <span>Проверять дубли</span>
            </Space>

            <Space>
              <Button onClick={onClose}>Отмена</Button>
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
