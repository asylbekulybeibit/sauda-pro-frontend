import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, message } from 'antd';
import {
  getSupplierProducts,
  addProductToSupplier,
  removeProductFromSupplier,
  getProducts,
} from '@/services/managerApi';
import { Product } from '@/types/product';
import { ApiErrorHandler } from '@/utils/error-handler';
import { useShop } from '@/hooks/useShop';
import { useParams } from 'react-router-dom';

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
  const { currentShop } = useShop();
  const { shopId } = useParams<{ shopId: string }>();

  const fetchProducts = useCallback(async () => {
    if (!currentShop && !shopId) return;

    const actualShopId = currentShop?.id || shopId || '';
    console.log(`Using shopId: ${actualShopId} for supplier: ${supplierId}`);

    try {
      setLoading(true);

      // Сначала получаем все товары
      const allProducts = await getProducts(actualShopId);
      console.log(
        `Fetched ${allProducts.length} products for shop ${actualShopId}`
      );

      try {
        // Затем получаем товары поставщика
        console.log(
          `Attempting to fetch products for supplier ${supplierId} with shopId ${actualShopId}`
        );
        const supplierProducts = await getSupplierProducts(
          supplierId,
          actualShopId
        );
        console.log(
          `Fetched ${supplierProducts.length} products for supplier ${supplierId}`
        );

        // Добавляем подробное логирование для отладки
        console.log(
          'Supplier products data:',
          JSON.stringify(supplierProducts, null, 2)
        );

        // Проверяем типы цен
        supplierProducts.forEach((product, index) => {
          console.log(
            `Product ${index} (${product.name}) price:`,
            'price' in product ? product.price : 'undefined',
            'type:',
            'price' in product ? typeof product.price : 'undefined'
          );
        });

        setProducts(supplierProducts);
        setAvailableProducts(
          allProducts.filter(
            (p) => !supplierProducts.find((sp) => sp.id === p.id)
          )
        );
      } catch (error) {
        console.error('Error fetching supplier products:', error);
        const apiError = ApiErrorHandler.handle(error);

        if (ApiErrorHandler.isNotFoundError(apiError)) {
          message.error(
            'Товары поставщика не найдены. Возможно, у поставщика еще нет товаров или API не настроен корректно.'
          );
          setProducts([]);
        } else {
          message.error(
            `Ошибка при загрузке товаров поставщика: ${apiError.message}. Проверьте консоль для деталей.`
          );
        }

        // Все равно устанавливаем доступные товары
        setAvailableProducts(allProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      const apiError = ApiErrorHandler.handle(error);
      message.error(`Ошибка при загрузке товаров: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentShop, shopId, supplierId]);

  useEffect(() => {
    if (currentShop || shopId) {
      fetchProducts();
    }
  }, [currentShop, shopId, fetchProducts]);

  const handleAddProduct = async (values: any) => {
    if (!currentShop && !shopId) return;

    const actualShopId = currentShop?.id || shopId || '';
    console.log(
      `Adding product ${values.productId} to supplier ${supplierId} in shop ${actualShopId}`
    );

    try {
      console.log(`Request data:`, {
        supplierId,
        productId: values.productId,
        price: values.price,
        minimumOrder: values.minimumOrder,
        shopId: actualShopId,
      });

      // Добавляем подробное логирование для отладки
      console.log('Price value:', values.price);
      console.log('Price type:', typeof values.price);

      await addProductToSupplier(
        supplierId,
        values.productId,
        {
          price: values.price,
          minimumOrder: values.minimumOrder,
        },
        actualShopId
      );
      message.success('Товар успешно добавлен');
      setModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      console.error('Error adding product to supplier:', error);
      const apiError = ApiErrorHandler.handle(error);

      if (ApiErrorHandler.isNotFoundError(apiError)) {
        message.error(
          'Поставщик или товар не найден. Проверьте консоль для деталей.'
        );
      } else {
        message.error(
          `Ошибка при добавлении товара: ${apiError.message}. Проверьте консоль для деталей.`
        );
      }
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!currentShop && !shopId) return;

    const actualShopId = currentShop?.id || shopId || '';
    console.log(
      `Removing product ${productId} from supplier ${supplierId} in shop ${actualShopId}`
    );

    try {
      console.log(`Request data:`, {
        supplierId,
        productId,
        shopId: actualShopId,
      });

      await removeProductFromSupplier(supplierId, productId, actualShopId);
      message.success('Товар успешно удален');
      fetchProducts();
    } catch (error) {
      console.error('Error removing product from supplier:', error);
      const apiError = ApiErrorHandler.handle(error);

      if (ApiErrorHandler.isNotFoundError(apiError)) {
        message.error(
          'Поставщик или товар не найден. Проверьте консоль для деталей.'
        );
        // Обновляем список товаров, чтобы отразить актуальное состояние
        fetchProducts();
      } else {
        message.error(
          `Ошибка при удалении товара: ${apiError.message}. Проверьте консоль для деталей.`
        );
      }
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
      render: (price: any) => {
        console.log('Rendering price:', price, 'type:', typeof price);

        // Обработка различных типов данных
        if (price === null || price === undefined) {
          console.warn('Price is null or undefined');
          return 'Не указано';
        }

        if (typeof price === 'number') {
          if (isNaN(price)) {
            console.warn('Price is NaN');
            return 'Не указано';
          }
          return `${price.toFixed(2)} KZT`;
        }

        if (typeof price === 'string') {
          const parsedPrice = parseFloat(price);
          if (!isNaN(parsedPrice)) {
            return `${parsedPrice.toFixed(2)} KZT`;
          }
        }

        console.warn('Price has unexpected type:', typeof price, price);
        return 'Не указано';
      },
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
        <Button
          danger
          onClick={() => handleRemoveProduct(record.id.toString())}
        >
          Удалить
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => setModalVisible(true)}
          className="bg-blue-500"
        >
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
        okButtonProps={{ className: 'bg-blue-500 hover:bg-blue-500' }}
        cancelButtonProps={{ className: 'bg-blue-500 hover:bg-blue-500' }}
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
