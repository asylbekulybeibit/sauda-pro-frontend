import React from 'react';
import { Form, Input, InputNumber, Select, Button, message } from 'antd';
import { Shop } from '@/types/shop';
import { ApiErrorHandler } from '@/utils/error-handler';

interface PrinterSettingsProps {
  shop: Shop;
  onSave: (data: Partial<Shop>) => Promise<void>;
}

export const PrinterSettings: React.FC<PrinterSettingsProps> = ({
  shop,
  onSave,
}) => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await onSave({
        settings: {
          ...shop.settings,
          printerSettings: values,
        },
      });
      message.success('Настройки принтера успешно сохранены');
    } catch (error) {
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={shop.settings?.printerSettings}
      onFinish={onFinish}
    >
      <Form.Item
        name="defaultPrinter"
        label="Принтер по умолчанию"
        rules={[{ required: true, message: 'Выберите принтер по умолчанию' }]}
      >
        <Select
          placeholder="Выберите принтер"
          options={[
            // TODO: Получить список доступных принтеров
            { value: 'printer1', label: 'Принтер 1' },
            { value: 'printer2', label: 'Принтер 2' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="labelWidth"
        label="Ширина этикетки (мм)"
        rules={[
          { required: true, message: 'Введите ширину этикетки' },
          {
            type: 'number',
            min: 20,
            max: 100,
            message: 'Ширина должна быть от 20 до 100 мм',
          },
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={20}
          max={100}
          step={1}
          precision={0}
        />
      </Form.Item>

      <Form.Item
        name="labelHeight"
        label="Высота этикетки (мм)"
        rules={[
          { required: true, message: 'Введите высоту этикетки' },
          {
            type: 'number',
            min: 10,
            max: 100,
            message: 'Высота должна быть от 10 до 100 мм',
          },
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={10}
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
