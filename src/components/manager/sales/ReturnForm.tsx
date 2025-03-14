import { Form, Input, Select, Button, InputNumber, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createInventoryTransaction } from '@/services/managerApi';
import { Product } from '@/types/product';
import { TransactionType } from '@/types/inventory';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ReturnFormProps {
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReturnForm({ shopId, onClose, onSuccess }: ReturnFormProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId),
    enabled: !!shopId,
  });

  const createMutation = useMutation({
    mutationFn: createInventoryTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      message.success('Возврат успешно оформлен');
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('Error creating return:', error);
      message.error(error.message || 'Ошибка при оформлении возврата');
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values);

      const payload = {
        shopId,
        type: 'RETURN' as TransactionType,
        productId: values.productId,
        quantity: Number(values.quantity),
        price: Number(values.price),
        note: values.reason || undefined,
      };
      console.log('Submitting payload:', payload);

      await createMutation.mutateAsync(payload);
    } catch (error) {
      console.error('Form validation or submission error:', error);
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Оформление возврата</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <Form form={form} layout="vertical" initialValues={{ quantity: 1 }}>
            <Form.Item
              name="productId"
              label="Товар"
              rules={[{ required: true, message: 'Выберите товар' }]}
            >
              <Select
                loading={isLoadingProducts}
                placeholder="Выберите товар"
                showSearch
                optionFilterProp="label"
                options={products?.map((product) => ({
                  label: `${product.name} (${product.sku})`,
                  value: product.id,
                }))}
                onChange={(productId) => {
                  const product = products?.find((p) => p.id === productId);
                  if (product) {
                    form.setFieldsValue({
                      price: product.sellingPrice,
                    });
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Количество"
              rules={[{ required: true, message: 'Укажите количество' }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>

            <Form.Item
              name="price"
              label="Цена возврата"
              rules={[
                { required: true, message: 'Укажите цену возврата' },
                {
                  validator: async (_, value) => {
                    if (value === undefined || value === null || value < 0) {
                      throw new Error('Цена не может быть отрицательной');
                    }
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                className="w-full"
                stringMode
              />
            </Form.Item>

            <Form.Item name="reason" label="Причина возврата">
              <Input.TextArea rows={3} />
            </Form.Item>

            <div className="flex justify-end space-x-4 mt-6">
              <Button onClick={onClose}>Отмена</Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={createMutation.isPending}
                className="bg-blue-500"
              >
                Оформить возврат
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
