import { useState } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Table,
  message,
  InputNumber,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createInventoryTransaction } from '@/services/managerApi';
import { Product } from '@/types/product';
import dayjs from 'dayjs';

interface WriteOffFormProps {
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface WriteOffItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  comment?: string;
}

export default function WriteOffForm({
  shopId,
  onClose,
  onSuccess,
}: WriteOffFormProps) {
  const [items, setItems] = useState<WriteOffItem[]>([]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId),
  });

  const createMutation = useMutation({
    mutationFn: createInventoryTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      onSuccess();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (items.length === 0) {
        message.error('Добавьте хотя бы один товар');
        return;
      }

      await createMutation.mutateAsync({
        shopId,
        type: 'WRITE_OFF',
        productId: items[0].productId,
        quantity: -items[0].quantity,
        price: items[0].price,
        description: values.description,
        comment: values.comment,
      });

      if (items.length > 1) {
        for (let i = 1; i < items.length; i++) {
          await createMutation.mutateAsync({
            shopId,
            type: 'WRITE_OFF',
            productId: items[i].productId,
            quantity: -items[i].quantity,
            price: items[i].price,
            description: values.description,
            comment: values.comment,
          });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const handleAddProduct = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    if (items.some((item) => item.productId === productId)) {
      message.warning('Этот товар уже добавлен');
      return;
    }

    setItems([
      ...items,
      {
        productId,
        product,
        quantity: 1,
        price: product.purchasePrice,
      },
    ]);
  };

  const columns = [
    {
      title: 'Товар',
      dataIndex: ['product', 'name'],
      key: 'name',
    },
    {
      title: 'Количество',
      key: 'quantity',
      render: (_: unknown, record: WriteOffItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => {
            if (value === null) return;
            setItems(
              items.map((item) =>
                item.productId === record.productId
                  ? { ...item, quantity: value }
                  : item
              )
            );
          }}
        />
      ),
    },
    {
      title: 'Цена списания',
      key: 'price',
      render: (_: unknown, record: WriteOffItem) => (
        <InputNumber
          min={0}
          value={record.price}
          onChange={(value) => {
            if (value === null) return;
            setItems(
              items.map((item) =>
                item.productId === record.productId
                  ? { ...item, price: value }
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
      render: (_: unknown, record: WriteOffItem) => (
        <Button
          type="link"
          danger
          onClick={() =>
            setItems(
              items.filter((item) => item.productId !== record.productId)
            )
          }
        >
          Удалить
        </Button>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Создание списания</h2>

          <Form form={form} layout="vertical">
            <Form.Item
              name="date"
              label="Дата"
              initialValue={dayjs()}
              rules={[{ required: true, message: 'Укажите дату' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Причина списания"
              rules={[{ required: true, message: 'Укажите причину списания' }]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item name="comment" label="Комментарий">
              <Input.TextArea rows={2} />
            </Form.Item>

            <div className="mb-4">
              <Select
                loading={isLoadingProducts}
                placeholder="Добавить товар"
                showSearch
                optionFilterProp="label"
                onChange={handleAddProduct}
                value={undefined}
                options={products?.map((product) => ({
                  label: `${product.name} (${product.sku})`,
                  value: product.id,
                }))}
              />
            </div>

            <Table
              columns={columns}
              dataSource={items}
              rowKey="productId"
              pagination={false}
            />

            <div className="mt-6 flex justify-end space-x-4">
              <Button onClick={onClose}>Отмена</Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={items.length === 0}
                loading={createMutation.isPending}
              >
                Создать
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
