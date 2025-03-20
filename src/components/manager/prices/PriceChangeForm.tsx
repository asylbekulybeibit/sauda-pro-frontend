import React from 'react';
import { Form, InputNumber, Input, Button, message } from 'antd';
import { addPriceChange } from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';
import { useRoleStore } from '@/store/roleStore';
import { formatPrice } from '@/utils/format';

interface PriceChangeFormProps {
  productId: string;
  shopId: string;
  currentPrice: number;
  onSuccess: () => void;
}

export const PriceChangeForm: React.FC<PriceChangeFormProps> = ({
  productId,
  shopId,
  currentPrice,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { currentRole } = useRoleStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    // При изменении currentPrice обновляем начальное значение формы
    form.setFieldsValue({ newPrice: currentPrice });
  }, [currentPrice, form]);

  const onFinish = async (values: any) => {
    try {
      setIsSubmitting(true);

      // Убедимся, что oldPrice и newPrice - числа
      const oldPrice = Number(currentPrice);
      const newPrice = Number(values.newPrice);

      console.log('Отправка данных для изменения цены:', {
        productId,
        shopId,
        oldPrice,
        newPrice,
        reason: values.reason,
        changedBy: currentRole?.type === 'shop' ? currentRole.id : 'unknown',
      });

      // Проверяем, что oldPrice - положительное число
      if (isNaN(oldPrice) || oldPrice < 0) {
        throw new Error('Текущая цена должна быть положительным числом');
      }

      // Проверяем, что newPrice - положительное число
      if (isNaN(newPrice) || newPrice < 0) {
        throw new Error('Новая цена должна быть положительным числом');
      }

      await addPriceChange({
        productId,
        shopId,
        oldPrice: oldPrice,
        newPrice: newPrice,
        reason: values.reason,
        changedBy: currentRole?.type === 'shop' ? currentRole.id : 'unknown',
      });

      message.success('Цена успешно изменена');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Ошибка при изменении цены:', error);
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ newPrice: currentPrice }}
    >
      <Form.Item label="Текущая цена">
        <span>{formatPrice(currentPrice)}</span>
      </Form.Item>

      <Form.Item
        name="newPrice"
        label="Новая цена"
        rules={[
          { required: true, message: 'Введите новую цену' },
          {
            type: 'number',
            min: 0.01,
            message: 'Цена должна быть больше 0',
          },
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          step={0.01}
          precision={2}
          formatter={(value) => `${value} ₸`}
          parser={(value) => {
            const parsed = value!.replace(/[^\d.]/g, '');
            console.log('Parsed price input:', parsed);
            return parsed;
          }}
        />
      </Form.Item>

      <Form.Item
        name="reason"
        label="Причина изменения"
        rules={[{ required: true, message: 'Укажите причину изменения цены' }]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Изменить цену
        </Button>
      </Form.Item>
    </Form>
  );
};
