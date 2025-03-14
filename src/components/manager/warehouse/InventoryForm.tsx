import { useState } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Space,
  Select,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts, createInventoryTransaction } from '@/services/managerApi';
import dayjs from 'dayjs';

interface InventoryFormProps {
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface InventoryItem {
  productId: number;
  currentQuantity: number;
  actualQuantity: number;
  difference: number;
  comment?: string;
}

export function InventoryForm({
  shopId,
  onClose,
  onSuccess,
}: InventoryFormProps) {
  const [form] = Form.useForm();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();

  // Загрузка списка товаров
  const { data: products } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId),
  });

  // Мутация для создания инвентаризации
  const createInventoryMutation = useMutation({
    mutationFn: createInventoryTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onSuccess();
    },
  });

  // Колонки для таблицы товаров
  const columns = [
    {
      title: 'Товар',
      dataIndex: 'productId',
      key: 'productId',
      render: (productId: string) => {
        const product = products?.find((p) => p.id === productId);
        return product?.name || '';
      },
    },
    {
      title: 'Текущий остаток',
      dataIndex: 'currentQuantity',
      key: 'currentQuantity',
    },
    {
      title: 'Фактический остаток',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      render: (value: number, record: InventoryItem, index: number) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(newValue) => handleQuantityChange(index, newValue || 0)}
        />
      ),
    },
    {
      title: 'Расхождение',
      dataIndex: 'difference',
      key: 'difference',
      render: (value: number) => (
        <span
          className={
            value < 0 ? 'text-red-500' : value > 0 ? 'text-green-500' : ''
          }
        >
          {value}
        </span>
      ),
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
      render: (value: string, record: InventoryItem, index: number) => (
        <Input
          value={value}
          onChange={(e) => handleCommentChange(index, e.target.value)}
          placeholder="Причина расхождения"
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, __: any, index: number) => (
        <Button type="link" danger onClick={() => handleRemoveItem(index)}>
          Удалить
        </Button>
      ),
    },
  ];

  // Обработчики изменений
  const handleQuantityChange = (index: number, value: number) => {
    const newItems = [...items];
    newItems[index].actualQuantity = value;
    newItems[index].difference = value - newItems[index].currentQuantity;
    setItems(newItems);
  };

  const handleCommentChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].comment = value;
    setItems(newItems);
  };

  const handleAddItem = () => {
    const productId = form.getFieldValue('productId');
    if (!productId) {
      message.error('Выберите товар');
      return;
    }

    if (items.some((item) => item.productId === productId)) {
      message.error('Этот товар уже добавлен');
      return;
    }

    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    setItems([
      ...items,
      {
        productId,
        currentQuantity: product.quantity,
        actualQuantity: product.quantity,
        difference: 0,
      },
    ]);
    form.setFieldValue('productId', undefined);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (items.length === 0) {
        message.error('Добавьте хотя бы один товар');
        return;
      }

      const inventoryData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        items,
        shopId,
        type: 'INVENTORY',
      };

      await createInventoryMutation.mutateAsync(inventoryData);
    } catch (error) {
      console.error('Ошибка при создании инвентаризации:', error);
    }
  };

  // Фильтрация товаров для поиска
  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.barcode?.includes(searchValue) ||
      product.sku?.includes(searchValue)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Инвентаризация</h2>

        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="date"
              label="Дата"
              initialValue={dayjs()}
              rules={[{ required: true, message: 'Укажите дату' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="comment" label="Комментарий">
              <Input.TextArea rows={1} />
            </Form.Item>
          </div>

          <div className="mb-4">
            <Space>
              <Form.Item name="productId" noStyle>
                <Select
                  placeholder="Поиск товара"
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
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
              >
                Добавить товар
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={items}
            rowKey="productId"
            pagination={false}
          />

          <div className="mt-4 flex justify-end space-x-4">
            <Button onClick={onClose}>Отмена</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createInventoryMutation.isPending}
          className="bg-blue-500"

            >
              Завершить инвентаризацию
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
