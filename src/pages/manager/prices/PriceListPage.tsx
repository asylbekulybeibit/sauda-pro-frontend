import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Tag,
  Tooltip,
  Tabs,
} from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProducts,
  updateProduct,
  addPriceChange,
  getBarcodes,
  getCategories,
  deleteWarehouseProduct,
} from '@/services/managerApi';
import { formatPrice } from '@/utils/format';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Product } from '@/types/product';
import { useRoleStore } from '@/store/roleStore';
import { AddServiceForm } from '@/components/manager/warehouse/AddServiceForm';

interface PriceListPageProps {
  warehouseId: string;
}

const PriceListPage: React.FC<PriceListPageProps> = ({ warehouseId }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addServiceModalVisible, setAddServiceModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('products');
  const { currentRole } = useRoleStore();
  const shopId = currentRole?.type === 'shop' ? currentRole.shop.id : undefined;

  console.log('PriceListPage - Current IDs:', {
    warehouseId,
    shopId,
    currentRole: {
      type: currentRole?.type,
      shopId: currentRole?.type === 'shop' ? currentRole.shop.id : undefined,
      warehouseId:
        currentRole?.type === 'shop' ? currentRole.warehouse?.id : undefined,
    },
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', warehouseId],
    queryFn: () => getProducts(warehouseId),
    enabled: activeTab === 'products' && !!warehouseId,
    select: (data) => data.filter((product) => !product.isService),
  });

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['products', warehouseId],
    queryFn: () => getProducts(warehouseId),
    enabled: activeTab === 'services' && !!warehouseId,
    select: (data) => data.filter((product) => product.isService),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId!),
    enabled: !!shopId,
  });

  const handleEdit = (item: Product) => {
    setSelectedProduct(item);
    form.setFieldsValue({
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      reason: '',
    });
    setEditModalVisible(true);
  };

  const handleDelete = async (item: Product) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: `Вы уверены, что хотите удалить "${
        item.name || 'элемент'
      }" со склада?`,
      okText: 'Удалить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteWarehouseProduct(item.id);
          message.success('Элемент успешно удален со склада');
          queryClient.invalidateQueries({
            queryKey: [
              activeTab === 'products' ? 'products' : 'services',
              warehouseId,
            ],
          });
        } catch (error) {
          message.error('Ошибка при удалении');
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      if (!selectedProduct || !currentRole || currentRole.type !== 'shop')
        return;

      const values = await form.validateFields();

      console.log('Selected Product:', {
        id: selectedProduct.id,
        barcodeId: selectedProduct.barcode?.id,
        name: selectedProduct.name || selectedProduct.barcode?.productName,
        warehouseId: selectedProduct.warehouseId,
        isService: activeTab === 'services',
      });

      // Update product/service price
      await updateProduct(selectedProduct.id, {
        ...(activeTab !== 'services' && {
          purchasePrice: values.purchasePrice,
        }),
        sellingPrice: values.sellingPrice,
      });

      // Record price history changes
      if (
        activeTab !== 'services' &&
        selectedProduct.purchasePrice !== values.purchasePrice
      ) {
        const priceChangeData = {
          productId: selectedProduct.id,
          warehouseProductId: selectedProduct.id,
          oldPrice: selectedProduct.purchasePrice,
          newPrice: values.purchasePrice,
          priceType: 'purchase' as const,
          reason: values.reason,
          shopId: currentRole.shop.id,
          changedBy: currentRole.shop.id,
        };

        console.log('Adding purchase price change:', priceChangeData);
        await addPriceChange(priceChangeData);
      }

      // Record selling price change for both products and services
      if (selectedProduct.sellingPrice !== values.sellingPrice) {
        const priceChangeData = {
          productId: selectedProduct.id,
          warehouseProductId: selectedProduct.id,
          oldPrice: selectedProduct.sellingPrice,
          newPrice: values.sellingPrice,
          priceType: 'selling' as const,
          reason: values.reason,
          shopId: currentRole.shop.id,
          changedBy: currentRole.shop.id,
        };

        console.log('Adding selling price change:', priceChangeData);
        await addPriceChange(priceChangeData);
      }

      message.success('Цены успешно обновлены');
      setEditModalVisible(false);
      queryClient.invalidateQueries({
        queryKey: ['products', warehouseId],
      });
    } catch (error) {
      console.error('Error updating prices:', error);
      message.error('Ошибка при обновлении цен');
    }
  };

  const getColumns = (isServices: boolean) => [
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, record: any) =>
        record.barcode?.productName || record.name || 'Без названия',
    },
    {
      title: 'Штрихкод',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (barcode: any) => barcode?.code || '—',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (_: any, record: any) => {
        const categoryId = record.barcode?.categoryId;
        const category = categories?.find((cat) => cat.id === categoryId);
        return category?.name || '—';
      },
    },
    ...(!isServices
      ? [
          {
            title: 'Закупочная цена',
            dataIndex: 'purchasePrice',
            key: 'purchasePrice',
            render: (price: number) => formatPrice(price),
          },
        ]
      : []),
    {
      title: 'Продажная цена',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price: number) => formatPrice(price),
    },
    ...(!isServices
      ? [
          {
            title: 'Количество',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity: number) => Math.floor(quantity) || 0,
          },
          {
            title: 'Сумма',
            key: 'total',
            render: (_: any, record: Product) =>
              formatPrice(record.purchasePrice * record.quantity),
          },
        ]
      : []),
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Tooltip title="Изменить цены">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="link"
            />
          </Tooltip>
          <Tooltip title="Удалить">
            <Button
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              type="link"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: 'products',
      label: 'Товары',
      children: (
        <Table
          columns={getColumns(false)}
          dataSource={products}
          rowKey="id"
          loading={isLoadingProducts}
        />
      ),
    },
    {
      key: 'services',
      label: 'Услуги',
      children: (
        <>
          <div className="flex justify-end mb-4">
            <Button
              type="primary"
              className="!bg-blue-600 hover:!bg-blue-500"
              icon={<PlusOutlined />}
              onClick={() => setAddServiceModalVisible(true)}
            >
              Добавить услугу
            </Button>
          </div>
          <Table
            columns={getColumns(true)}
            dataSource={services}
            rowKey="id"
            loading={isLoadingServices}
          />
        </>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        className="mb-4"
      />

      <Modal
        title="Изменение цен"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          {activeTab === 'products' && (
            <Form.Item
              name="purchasePrice"
              label="Закупочная цена"
              rules={[{ required: true, message: 'Введите закупочную цену' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item
            name="sellingPrice"
            label="Продажная цена"
            rules={[{ required: true, message: 'Введите продажную цену' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Причина изменения"
            rules={[{ required: true, message: 'Укажите причину изменения' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Добавление услуги на склад"
        open={addServiceModalVisible}
        onCancel={() => setAddServiceModalVisible(false)}
        footer={null}
      >
        <AddServiceForm
          warehouseId={warehouseId}
          onSuccess={() => {
            setAddServiceModalVisible(false);
            queryClient.invalidateQueries({
              queryKey: ['products', warehouseId],
            });
          }}
          onCancel={() => setAddServiceModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default PriceListPage;
