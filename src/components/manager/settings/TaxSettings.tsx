import React from 'react';
import { Form, InputNumber,  Button, message } from 'antd';
import { Shop } from '@/types/shop';
import { ApiErrorHandler } from '@/utils/error-handler';

interface TaxSettingsProps {
  shop: Shop;
  onSave: (data: Partial<Shop>) => Promise<void>;
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ shop, onSave }) => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await onSave({
        settings: {
          ...shop.settings,
          taxRate: values.taxRate,
        },
      });
      message.success('Настройки налогов успешно сохранены');
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        taxRate: shop.settings?.taxRate ?? 20,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="taxRate"
        label="Ставка НДС (%)"
        rules={[
          { required: true, message: 'Введите ставку НДС' },
          {
            type: 'number',
            min: 0,
            max: 100,
            message: 'Ставка НДС должна быть от 0 до 100',
          },
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          max={100}
          step={1}
          precision={0}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Сохранить
        </Button>
      </Form.Item>
    </Form>
  );
};
