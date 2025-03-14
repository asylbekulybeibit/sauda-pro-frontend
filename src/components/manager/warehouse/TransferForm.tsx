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
import { getProducts, createTransfer } from '@/services/managerApi';
import { Product } from '@/types/product';
import { CreateTransferDto } from '@/types/transfer';
import { ApiErrorHandler } from '@/utils/error-handler';
import dayjs from 'dayjs';

interface TransferFormProps {
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TransferItem {
  productId: number;
  product: Product;
  quantity: number;
  comment?: string;
}

interface Shop {
  id: string;
  name: string;
}

export function TransferForm({
  shopId,
  onClose,
  onSuccess,
}: TransferFormProps) {
  const [items, setItems] = useState<TransferItem[]>([]);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId),
  });

  // Временное решение, пока нет API для получения магазинов
  const mockShops: Shop[] = [
    { id: '1', name: 'Магазин 1' },
    { id: '2', name: 'Магазин 2' },
    { id: '3', name: 'Магазин 3' },
  ];

  const shops = mockShops;
  const isLoadingShops = false;

  const createMutation = useMutation({
    mutationFn: (data: CreateTransferDto) => createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      onSuccess();
    },
    onError: (error) => {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const transferData: CreateTransferDto = {
        fromShopId: shopId,
        toShopId: values.toShopId,
        date: values.date.toISOString(),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          comment: item.comment,
        })),
        comment: values.comment,
      };

      await createMutation.mutateAsync(transferData);
    } catch (error) {
      // Form validation error
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const handleAddProduct = (productId: number) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    if (items.some((item) => item.productId === productId)) {
      message.warning('Этот товар уже добавлен');
      return;
    }

    setItems([...items, { productId, product, quantity: 1 }]);
  };

  const handleQuantityChange = (productId: number, quantity: number | null) => {
    setItems(
      items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: quantity || 0 }
          : item
      )
    );
  };

  const handleCommentChange = (productId: number, comment: string) => {
    setItems(
      items.map((item) =>
        item.productId === productId ? { ...item, comment } : item
      )
    );
  };

  const handleRemoveProduct = (productId: number) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const columns = [
    {
      title: 'Товар',
      dataIndex: ['product', 'name'],
      key: 'name',
    },
    {
      title: 'Артикул',
      dataIndex: ['product', 'sku'],
      key: 'sku',
    },
    {
      title: 'Количество',
      key: 'quantity',
      render: (_: unknown, record: TransferItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => handleQuantityChange(record.productId, value)}
        />
      ),
    },
    {
      title: 'Комментарий',
      key: 'comment',
      render: (_: unknown, record: TransferItem) => (
        <Input
          value={record.comment}
          onChange={(e) =>
            handleCommentChange(record.productId, e.target.value)
          }
          placeholder="Комментарий к товару"
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: TransferItem) => (
        <Button
          type="link"
          danger
          onClick={() => handleRemoveProduct(record.productId)}
        >
          Удалить
        </Button>
      ),
    },
  ];

  const availableShops = shops?.filter((s: Shop) => s.id !== shopId) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Создание перемещения</h2>

          <Form form={form} layout="vertical">
            <Form.Item
              name="toShopId"
              label="Куда"
              rules={[
                { required: true, message: 'Выберите магазин назначения' },
              ]}
            >
              <Select
                loading={isLoadingShops}
                placeholder="Выберите магазин"
                options={availableShops.map((shop) => ({
                  label: shop.name,
                  value: shop.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="date"
              label="Дата"
              initialValue={dayjs()}
              rules={[{ required: true, message: 'Укажите дату' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="comment" label="Комментарий">
              <Input.TextArea
                rows={2}
                placeholder="Общий комментарий к перемещению"
              />
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
