import React from 'react';
import { Form, Select, InputNumber, Button, message } from 'antd';
import { Shop } from '@/types/shop';
import { ApiErrorHandler } from '@/utils/error-handler';

interface CurrencySettingsProps {
  shop: Shop;
  onSave: (data: Partial<Shop>) => Promise<void>;
}

type CurrencySettingsFormValues = {
  currency: string;
  decimalPlaces: number;
  showCurrencySymbol: 'before' | 'after' | 'code';
};

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({
  shop,
  onSave,
}) => {
  const [form] = Form.useForm<CurrencySettingsFormValues>();

  const onFinish = async (values: CurrencySettingsFormValues) => {
    try {
      await onSave({
        settings: {
          ...shop.settings,
          currencySettings: values,
        },
      });
      message.success('Настройки валюты успешно сохранены');
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={shop.settings?.currencySettings}
      onFinish={onFinish}
    >
      <Form.Item
        name="currency"
        label="Валюта"
        rules={[{ required: true, message: 'Выберите валюту' }]}
      >
        <Select
          placeholder="Выберите валюту"
          options={[
            { value: 'RUB', label: 'Российский рубль (₽)' },
            { value: 'USD', label: 'Доллар США ($)' },
            { value: 'EUR', label: 'Евро (€)' },
            { value: 'KZT', label: 'Тенге (₸)' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="decimalPlaces"
        label="Количество знаков после запятой"
        rules={[
          {
            required: true,
            message: 'Укажите количество знаков после запятой',
          },
          {
            type: 'number',
            min: 0,
            max: 4,
            message: 'Значение должно быть от 0 до 4',
          },
        ]}
      >
        <InputNumber style={{ width: '100%' }} min={0} max={4} precision={0} />
      </Form.Item>

      <Form.Item
        name="showCurrencySymbol"
        label="Отображение символа валюты"
        rules={[{ required: true, message: 'Выберите способ отображения' }]}
      >
        <Select
          placeholder="Выберите способ отображения"
          options={[
            { value: 'before', label: 'Перед суммой (₽100)' },
            { value: 'after', label: 'После суммы (100₽)' },
            { value: 'code', label: 'Код валюты (100 RUB)' },
          ]}
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
