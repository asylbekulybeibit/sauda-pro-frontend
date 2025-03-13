import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, message } from 'antd';
import {
  getSupplierProducts,
  addProductToSupplier,
  removeProductFromSupplier,
  getProducts,
} from '@/services/managerApi';
import { Product } from '@/types/product';
import { ApiErrorHandler } from '@/utils/error-handler';

interface SupplierProductsProps {
  supplierId: string;
}

export const SupplierProducts: React.FC<SupplierProductsProps> = ({
  supplierId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [supplierProducts, allProducts] = await Promise.all([
        getSupplierProducts(supplierId),
        getProducts('your-shop-id'), // TODO: Replace with actual shopId
      ]);
      setProducts(supplierProducts);
      setAvailableProducts(
        allProducts.filter(
          (p) => !supplierProducts.find((sp) => sp.id === p.id)
        )
      );
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [supplierId]);

  const handleAddProduct = async (values: any) => {
    try {
      await addProductToSupplier(supplierId, values.productId, {
        price: values.price,
        minimumOrder: values.minimumOrder,
      });
      message.success('Товар успешно добавлен');
      setModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      await removeProductFromSupplier(supplierId, productId);
      message.success('Товар успешно удален');
      fetchProducts();
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toFixed(2)} ₽`,
    },
    {
      title: 'Мин. заказ',
      dataIndex: 'minimumOrder',
      key: 'minimumOrder',
      render: (minimumOrder?: number) =>
        minimumOrder ? `${minimumOrder} шт.` : 'Не указано',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Button danger onClick={() => handleRemoveProduct(record.id)}>
          Удалить
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setModalVisible(true)}>
          Добавить товар
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="Добавить товар"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
      >
        <Form form={form} onFinish={handleAddProduct} layout="vertical">
          <Form.Item
            name="productId"
            label="Товар"
            rules={[{ required: true, message: 'Выберите товар' }]}
          >
            <Select
              showSearch
              placeholder="Выберите товар"
              optionFilterProp="children"
            >
              {availableProducts.map((product) => (
                <Select.Option key={product.id} value={product.id}>
                  {product.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: 'Введите цену' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Введите цену"
            />
          </Form.Item>

          <Form.Item name="minimumOrder" label="Минимальный заказ">
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="Введите минимальное количество"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
