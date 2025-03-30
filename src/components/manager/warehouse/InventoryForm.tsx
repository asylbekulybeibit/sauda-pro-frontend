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
  Modal,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts, createInventoryTransaction } from '@/services/managerApi';
import dayjs from 'dayjs';
import { Product } from '@/types/product';

interface InventoryFormProps {
  warehouseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface InventoryItem {
  productId: string;
  currentQuantity: number;
  actualQuantity: number;
  difference: number;
  comment?: string;
}

interface FormData {
  date: dayjs.Dayjs;
  comment?: string;
  productId?: string;
}

export function InventoryForm({
  warehouseId,
  onClose,
  onSuccess,
}: InventoryFormProps) {
  const [form] = Form.useForm<FormData>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Загрузка списка товаров
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<
    Product[]
  >({
    queryKey: ['products', warehouseId],
    queryFn: () => getProducts(warehouseId),
    enabled: !!warehouseId,
  });

  // Колонки для таблицы товаров
  const columns = [
    {
      title: 'Товар',
      dataIndex: 'productId',
      key: 'productId',
      render: (productId: string) => {
        const product = products.find((p: Product) => p.id === productId);
        return product?.barcode?.productName || 'Без названия';
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
      render: (_: unknown, record: InventoryItem, index: number) => (
        <InputNumber
          min={0}
          value={record.actualQuantity}
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
      render: (_: unknown, record: InventoryItem, index: number) => (
        <Input
          value={record.comment}
          onChange={(e) => handleCommentChange(index, e.target.value)}
          placeholder="Причина расхождения"
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, __: unknown, index: number) => (
        <Button type="link" danger onClick={() => handleRemoveItem(index)}>
          Удалить
        </Button>
      ),
    },
  ];

  // Фильтрация товаров для поиска
  const filteredProducts = products.filter((product: Product) => {
    const searchLower = searchValue.toLowerCase();
    return (
      product.barcode?.productName?.toLowerCase().includes(searchLower) ||
      product.barcode?.code?.includes(searchLower)
    );
  });

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

    const product = products.find((p: Product) => p.id === productId);
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

  const startSubmitProcess = async () => {
    try {
      await form.validateFields();

      if (items.length === 0) {
        message.error('Добавьте хотя бы один товар');
        return;
      }

      // Посчитаем общие изменения для отображения в модальном окне
      const totalItems = items.length;
      const totalQuantityBefore = items.reduce(
        (sum, item) => sum + item.currentQuantity,
        0
      );
      const totalQuantityAfter = items.reduce(
        (sum, item) => sum + item.actualQuantity,
        0
      );
      const totalDifference = totalQuantityAfter - totalQuantityBefore;

      // Проверяем, есть ли значительные изменения
      const hasSeriousDifference = items.some(
        (item) =>
          Math.abs(item.difference) > item.currentQuantity * 0.2 &&
          Math.abs(item.difference) > 2
      );

      if (hasSeriousDifference) {
        Modal.confirm({
          title: 'Обнаружены значительные расхождения',
          content: (
            <div>
              <p>
                В некоторых товарах обнаружены значительные расхождения
                фактического количества с учётным.
              </p>
              <p>
                Общее количество товаров до инвентаризации:{' '}
                {totalQuantityBefore}
              </p>
              <p>
                Общее количество товаров после инвентаризации:{' '}
                {totalQuantityAfter}
              </p>
              <p>
                Общая разница: {totalDifference > 0 ? '+' : ''}
                {totalDifference} единиц
              </p>
              <p>Вы уверены, что хотите продолжить?</p>
            </div>
          ),
          okText: 'Да, сохранить',
          cancelText: 'Нет, проверить еще раз',
          onOk: () => {
            setShowConfirmModal(true);
          },
          okButtonProps: { className: 'bg-blue-500 hover:bg-blue-500' },
          cancelButtonProps: { className: 'bg-blue-500 hover:bg-blue-500' },
        });
      } else {
        setShowConfirmModal(true);
      }
    } catch (error) {
      console.error('Ошибка при валидации формы:', error);
    }
  };

  const handleSubmit = async () => {
    // Закрываем модальное окно подтверждения
    setShowConfirmModal(false);

    try {
      setIsSubmitting(true);
      const values = await form.validateFields();

      console.log('Starting inventory submission for items:', items);

      // Сохраняем текущую дату для логирования
      const submissionStartTime = new Date().toISOString();

      // Информация об устройстве и браузере
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: submissionStartTime,
        submissionId: `inv-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      // Создаем транзакции для каждого товара
      const promises = items.map((item, index) => {
        // Создаем простой объект с только нужными данными, избегая циклических ссылок
        const transactionData = {
          warehouseId: warehouseId,
          type: 'ADJUSTMENT' as const,
          warehouseProductId: item.productId,
          quantity: Number(item.actualQuantity),
          comment: item.comment,
          description: `Инвентаризация от ${values.date.format('YYYY-MM-DD')}`,
          note: values.comment,
          metadata: {
            currentQuantity: Number(item.currentQuantity),
            actualQuantity: Number(item.actualQuantity),
            difference: Number(item.difference),
            date: values.date.format('YYYY-MM-DD'),
            deviceInfo,
            itemIndex: index,
            inventory: {
              id: deviceInfo.submissionId,
              date: values.date.format('YYYY-MM-DD'),
              comment: values.comment,
              itemCount: items.length,
            },
          },
        };

        // Добавляем логирование для отладки
        console.log(
          'Sending inventory transaction with metadata:',
          JSON.stringify(transactionData.metadata, null, 2)
        );
        console.log(
          'Full transaction data:',
          JSON.stringify(transactionData, null, 2)
        );

        return createInventoryTransaction(transactionData).catch((error) => {
          console.error(`Error creating transaction for item ${index}:`, error);
          throw error;
        });
      });

      // Ждем завершения всех запросов с обработкой ошибок
      try {
        const results = await Promise.all(promises);
        console.log('All inventory transactions completed:', results);

        // Очищаем все связанные кэши данных для гарантированного обновления
        await queryClient.invalidateQueries({ queryKey: ['inventory'] });
        await queryClient.invalidateQueries({ queryKey: ['products'] });

        // Явно инвалидируем кэш с конкретным shopId
        await queryClient.invalidateQueries({
          queryKey: ['products', warehouseId],
        });
        await queryClient.invalidateQueries({
          queryKey: ['inventory', warehouseId],
        });

        const completionTime = new Date();
        const elapsedMs =
          completionTime.getTime() - new Date(submissionStartTime).getTime();
        console.log(
          `Inventory submission completed successfully in ${elapsedMs}ms`
        );

        // Принудительно ждем небольшую задержку для обновления данных
        setTimeout(() => {
          message.success('Инвентаризация успешно завершена');
          setIsSubmitting(false);
          onSuccess();
        }, 500);
      } catch (error) {
        console.error('Error during inventory transaction creation:', error);
        message.error(
          'Ошибка при создании инвентаризации. Некоторые позиции могли не сохраниться.'
        );
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Ошибка при создании инвентаризации:', error);
      message.error('Ошибка при создании инвентаризации');
      setIsSubmitting(false);
    }
  };

  console.log('Filtered products:', filteredProducts);

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
                  options={filteredProducts?.map((product) => {
                    console.log('Product for select:', product);
                    return {
                      label: `${
                        product.barcode?.productName || 'Без названия'
                      } (${product.barcode?.code || 'Нет штрихкода'})`,
                      value: product.id,
                    };
                  })}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                className="bg-blue-500"
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

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={onClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button
              type="primary"
              onClick={startSubmitProcess}
              loading={isSubmitting}
              className="bg-blue-500"
            >
              Сохранить
            </Button>
          </div>
        </Form>
      </div>

      <Modal
        title="Подтверждение инвентаризации"
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        footer={[
          <Button key="back" onClick={() => setShowConfirmModal(false)}>
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={handleSubmit}
            className="bg-blue-500"
          >
            Подтвердить
          </Button>,
        ]}
      >
        <p>Вы уверены, что хотите сохранить результаты инвентаризации?</p>
        <p>
          После сохранения данные о количестве товаров будут обновлены в
          системе.
        </p>
        {items.length > 0 && (
          <div className="mt-4">
            <p>Краткая сводка:</p>
            <ul>
              <li>Количество товаров: {items.length}</li>
              <li>
                Товары с расхождениями:{' '}
                {items.filter((item) => item.difference !== 0).length}
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
