import React from 'react';
import { Form, Switch, InputNumber, Select, Button, message } from 'antd';
import { Shop } from '@/types/shop';
import { ApiErrorHandler } from '@/utils/error-handler';

interface NotificationSettingsProps {
  shop: Shop;
  onSave: (data: Partial<Shop>) => Promise<void>;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  shop,
  onSave,
}) => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await onSave({
        settings: {
          ...shop.settings,
          notificationSettings: values,
        },
      });
      message.success('Настройки уведомлений успешно сохранены');
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={shop.settings?.notificationSettings}
      onFinish={onFinish}
    >
      <Form.Item
        name="lowStockNotifications"
        label="Уведомления о низком остатке"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="lowStockThreshold"
        label="Порог низкого остатка"
        rules={[
          {
            type: 'number',
            min: 1,
            max: 1000,
            message: 'Значение должно быть от 1 до 1000',
          },
        ]}
        dependencies={['lowStockNotifications']}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          max={1000}
          disabled={!form.getFieldValue('lowStockNotifications')}
        />
      </Form.Item>

      <Form.Item
        name="priceChangeNotifications"
        label="Уведомления об изменении цен"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="priceChangeThreshold"
        label="Порог изменения цены (%)"
        rules={[
          {
            type: 'number',
            min: 1,
            max: 100,
            message: 'Значение должно быть от 1 до 100',
          },
        ]}
        dependencies={['priceChangeNotifications']}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          max={100}
          disabled={!form.getFieldValue('priceChangeNotifications')}
        />
      </Form.Item>

      <Form.Item
        name="notificationChannels"
        label="Каналы уведомлений"
        rules={[
          {
            required: true,
            message: 'Выберите хотя бы один канал уведомлений',
            type: 'array',
          },
        ]}
      >
        <Select
          mode="multiple"
          placeholder="Выберите каналы уведомлений"
          options={[
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'SMS' },
            { value: 'push', label: 'Push-уведомления' },
            { value: 'telegram', label: 'Telegram' },
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
