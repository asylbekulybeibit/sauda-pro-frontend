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
  Table,
  Space,
  Typography,
  InputNumber,
  Divider,
  Modal,
} from 'antd';
import {
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
  createProduct,
} from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { Product } from '@/types/product';
import { PurchaseItem } from '@/types/purchase';

const { Option } = Select;
const { Title } = Typography;

interface PurchaseFormProps {
  shopId: string;
  warehouseId?: string;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  shopId,
  warehouseId: propWarehouseId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [newProductForm] = Form.useForm();

  // Basic state
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modal states
  const [newProductModalVisible, setNewProductModalVisible] =
    useState<boolean>(false);
  const [barcodeModalVisible, setBarcodeModalVisible] =
    useState<boolean>(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);

  // Queries
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', propWarehouseId],
    queryFn: () => getProducts(propWarehouseId!),
    enabled: !!propWarehouseId,
  });

  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers', shopId],
    queryFn: () => getSuppliers(shopId),
    enabled: !!shopId,
  });

  const { data: shop, isLoading: isLoadingShop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getManagerShop(shopId),
    enabled: !!shopId,
  });

  // Mutations
  const createPurchaseMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      message.success('Приход успешно создан');
      navigate(`/manager/${shopId}/warehouse/incoming`);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['products', propWarehouseId],
      });
      message.success('Товар успешно создан');
    },
  });

  // Loading state
  const isFormLoading =
    isLoadingProducts || isLoadingSuppliers || isLoadingShop;

  // Handlers
  const handleCreateProduct = async (values: any) => {
    try {
      setIsCreatingProduct(true);

      const purchasePrice = parseFloat(values.purchasePrice || 0);
      const sellingPrice =
        parseFloat(values.sellingPrice || 0) || purchasePrice * 1.2;

      const productData = {
        ...values,
        shopId,
        warehouseId: propWarehouseId,
        barcodes: [values.barcode],
        isActive: true,
        purchasePrice,
        sellingPrice,
      };

      const newProduct = await createProductMutation.mutateAsync(productData);

      const newItem: PurchaseItem = {
        id: uuidv4(),
        productId: newProduct.id,
        name: values.name,
        barcode: values.barcode,
        purchasePrice,
        sellingPrice,
        quantity: values.quantity || 1,
        product: newProduct,
      };

      setPurchaseItems((prev) => [...prev, newItem]);
      setNewProductModalVisible(false);
      newProductForm.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Ошибка при создании товара');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProduct) {
      message.error('Выберите товар');
      return;
    }

    const product = products?.find((p) => p.id === selectedProduct);
    if (!product) {
      message.error('Товар не найден');
      return;
    }

    const existingItem = purchaseItems.find(
      (item) => item.productId === product.id
    );
    if (existingItem) {
      setPurchaseItems((prev) =>
        prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      const newItem: PurchaseItem = {
        id: uuidv4(),
        productId: product.id,
        name: product.barcode?.productName || 'Без названия',
        barcode: product.barcode?.code,
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        quantity,
        product,
      };
      setPurchaseItems((prev) => [...prev, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    message.success('Товар добавлен');
  };

  const handleSubmit = async (values: any) => {
    if (purchaseItems.length === 0) {
      message.warning('Добавьте хотя бы один товар');
      return;
    }

    if (!propWarehouseId) {
      message.error('Не указан склад');
      return;
    }

    try {
      setIsLoading(true);

      const purchaseData = {
        warehouseId: propWarehouseId,
        shopId,
        date: values.date.toISOString(),
        supplierId: values.supplierId || null,
        invoiceNumber: values.invoiceNumber || null,
        comment: values.comment,
        items: purchaseItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.purchasePrice,
        })),
        status: 'draft' as const,
        updatePurchasePrices: true,
      };

      await createPurchaseMutation.mutateAsync(purchaseData);
    } catch (error: any) {
      message.error(error.message || 'Ошибка при создании прихода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Modal.confirm({
      title: 'Отменить создание прихода?',
      content: 'Все несохраненные данные будут потеряны',
      onOk: () => navigate(`/manager/${shopId}/warehouse/incoming`),
      okButtonProps: {
        type: 'primary',
        className: 'bg-blue-600',
      },
      okText: 'Ок',
      cancelText: 'Отмена',
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Штрих-код',
      dataIndex: 'barcode',
      width: 150,
    },
    {
      title: 'Название',
      dataIndex: 'name',
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      width: 120,
      render: (_: any, record: PurchaseItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => {
            setPurchaseItems((prev) =>
              prev.map((item) =>
                item.id === record.id ? { ...item, quantity: value || 1 } : item
              )
            );
          }}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Цена закупки',
      dataIndex: 'purchasePrice',
      width: 150,
      render: (_: any, record: PurchaseItem) => (
        <InputNumber
          min={0}
          step={0.01}
          value={record.purchasePrice}
          onChange={(value) => {
            setPurchaseItems((prev) =>
              prev.map((item) =>
                item.id === record.id
                  ? { ...item, purchasePrice: value || 0 }
                  : item
              )
            );
          }}
          style={{ width: '100%' }}
          addonAfter="₸"
        />
      ),
    },
    {
      title: 'Сумма',
      width: 120,
      render: (_: any, record: PurchaseItem) =>
        formatPrice(record.quantity * record.purchasePrice),
    },
    {
      title: 'Действия',
      width: 80,
      render: (_: any, record: PurchaseItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() =>
            setPurchaseItems((prev) =>
              prev.filter((item) => item.id !== record.id)
            )
          }
        />
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* New Product Modal */}
      <Modal
        title="Создание нового товара"
        open={newProductModalVisible}
        onCancel={() => {
          setNewProductModalVisible(false);
          newProductForm.resetFields();
        }}
        footer={null}
        maskClosable={false}
        destroyOnClose
      >
        <Form
          form={newProductForm}
          layout="vertical"
          onFinish={handleCreateProduct}
          preserve={false}
          initialValues={{
            barcode: scannedBarcode,
            quantity: 1,
            minQuantity: 0,
            purchasePrice: 0,
            sellingPrice: 0,
          }}
        >
          <Form.Item
            name="name"
            label="Название товара"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="barcode" label="Штрих-код">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Количество"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="purchasePrice"
            label="Закупочная цена"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              addonAfter="₸"
            />
          </Form.Item>

          <Form.Item name="sellingPrice" label="Цена продажи">
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              addonAfter="₸"
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setNewProductModalVisible(false)}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreatingProduct}
                className="bg-blue-600"
              >
                Создать
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Main Form */}
      <Card className="shadow-sm">
        <Title level={4}>Создание прихода</Title>

        {isFormLoading ? (
          <div className="text-center py-4">
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            preserve={false}
            initialValues={{
              date: dayjs(),
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item name="date" label="Дата" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="supplierId" label="Поставщик">
                <Select
                  allowClear
                  placeholder="Выберите поставщика"
                  loading={isLoadingSuppliers}
                >
                  {suppliers?.map((supplier) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="invoiceNumber" label="Номер накладной">
                <Input placeholder="Введите номер накладной" />
              </Form.Item>

              <Form.Item
                name="comment"
                label="Комментарий"
                className="md:col-span-3"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </div>

            <Divider>Товары</Divider>

            <div className="mb-4 flex items-center space-x-2">
              <Select
                showSearch
                style={{ width: 400 }}
                placeholder="Выберите товар"
                value={selectedProduct}
                onChange={setSelectedProduct}
                loading={isLoadingProducts}
                filterOption={(input, option) => {
                  const product = products?.find((p) => p.id === option?.value);
                  return (
                    product?.barcode?.productName
                      ?.toLowerCase()
                      .includes(input.toLowerCase()) || false
                  );
                }}
              >
                {products?.map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.barcode?.productName}
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
                onClick={handleAddProduct}
                disabled={!selectedProduct}
                className="bg-blue-600"
              >
                Добавить
              </Button>

              <Button
                icon={<BarcodeOutlined />}
                onClick={() => setBarcodeModalVisible(true)}
              >
                Сканировать
              </Button>
            </div>

            <Table
              dataSource={purchaseItems}
              columns={columns}
              rowKey="id"
              pagination={false}
            />

            <div className="mt-4 flex justify-end space-x-2">
              <Button onClick={handleCancel}>Отмена</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={isLoading}
                className="bg-blue-600"
              >
                Сохранить
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default PurchaseForm;
