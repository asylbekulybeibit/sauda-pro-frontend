import React from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import { Shop } from '@/types/shop';
import { ApiErrorHandler } from '@/utils/error-handler';

interface ShopSettingsProps {
  shop: Shop;
  onSave: (data: Partial<Shop>) => Promise<void>;
}

export const ShopSettings: React.FC<ShopSettingsProps> = ({ shop, onSave }) => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await onSave(values);
      message.success('Настройки магазина успешно сохранены');
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={shop}
      onFinish={onFinish}
    >
      <Form.Item
        name="name"
        label="Название магазина"
        rules={[{ required: true, message: 'Введите название магазина' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="address"
        label="Адрес"
        rules={[{ required: true, message: 'Введите адрес магазина' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Телефон"
        rules={[{ required: true, message: 'Введите телефон магазина' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Введите email магазина' },
          { type: 'email', message: 'Введите корректный email' },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="timezone"
        label="Часовой пояс"
        rules={[{ required: true, message: 'Выберите часовой пояс' }]}
      >
        <Select
          showSearch
          placeholder="Выберите часовой пояс"
          options={[
            { value: 'UTC+3', label: 'Москва (UTC+3)' },
            { value: 'UTC+4', label: 'Самара (UTC+4)' },
            { value: 'UTC+5', label: 'Екатеринбург (UTC+5)' },
            { value: 'UTC+6', label: 'Омск (UTC+6)' },
            { value: 'UTC+7', label: 'Красноярск (UTC+7)' },
            { value: 'UTC+8', label: 'Иркутск (UTC+8)' },
            { value: 'UTC+9', label: 'Якутск (UTC+9)' },
            { value: 'UTC+10', label: 'Владивосток (UTC+10)' },
            { value: 'UTC+11', label: 'Магадан (UTC+11)' },
            { value: 'UTC+12', label: 'Камчатка (UTC+12)' },
          ]}
        />
      </Form.Item>

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
