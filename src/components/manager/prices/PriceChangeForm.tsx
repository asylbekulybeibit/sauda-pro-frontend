import React from 'react';
import { Form, InputNumber, Input, Button, message } from 'antd';
import { addPriceChange } from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';

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

  const onFinish = async (values: any) => {
    try {
      await addPriceChange({
        productId,
        shopId,
        oldPrice: currentPrice,
        newPrice: values.newPrice,
        reason: values.reason,
        changedBy: 'current-user-id', // TODO: Replace with actual user ID
      });
      message.success('Цена успешно изменена');
      form.resetFields();
      onSuccess();
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
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
        <span>{currentPrice.toFixed(2)} ₽</span>
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
          formatter={(value) => `${value} ₽`}
          parser={(value) => value!.replace(' ₽', '')}
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
        <Button type="primary" htmlType="submit">
          Изменить цену
        </Button>
      </Form.Item>
    </Form>
  );
};
