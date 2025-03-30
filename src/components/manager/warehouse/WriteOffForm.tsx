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
        quantity: items[0].quantity,
        price: Number(items[0].price),
        description: values.description,
        comment: items[0].comment || values.comment || '',
        note: `Списание товара. Причина: ${values.description}`,
      });

      if (items.length > 1) {
        for (let i = 1; i < items.length; i++) {
          await createMutation.mutateAsync({
            shopId,
            type: 'WRITE_OFF',
            productId: items[i].productId,
            quantity: items[i].quantity,
            price: Number(items[i].price),
            description: values.description,
            comment: items[i].comment || values.comment || '',
            note: `Списание товара. Причина: ${values.description}`,
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
        <div>
          <InputNumber
            min={0}
            value={record.price * record.quantity}
            disabled={true}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
            }
            style={{ width: '100%' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            Списание по учетной стоимости: {record.price} × {record.quantity}
          </div>
        </div>
      ),
    },
    {
      title: 'Комментарий к товару',
      key: 'itemComment',
      render: (_: unknown, record: WriteOffItem) => (
        <Input
          placeholder="Комментарий к позиции"
          value={record.comment}
          onChange={(e) => {
            setItems(
              items.map((item) =>
                item.productId === record.productId
                  ? { ...item, comment: e.target.value }
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 flex-1 overflow-auto">
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
                  label: `${product.name} `,
                  value: product.id,
                }))}
              />
            </div>

            <div className="overflow-auto max-h-[300px]">
              <Table
                columns={columns}
                dataSource={items}
                rowKey="productId"
                pagination={false}
                scroll={{ y: '240px' }}
              />
            </div>
          </Form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-4">
            <Button onClick={onClose}>Отмена</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              disabled={items.length === 0}
              loading={createMutation.isPending}
              className="bg-blue-500"
            >
              Создать
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
