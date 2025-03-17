import React from 'react';
import { Form, Input, Button, Switch, message } from 'antd';
import { Supplier } from '@/types/supplier';
import { createSupplier, updateSupplier } from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';

interface SupplierFormProps {
  shopId: string;
  initialData?: Supplier;
  onSuccess: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  shopId,
  initialData,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!initialData;

  const onFinish = async (values: any) => {
    try {
      if (isEdit && initialData) {
        await updateSupplier(
          initialData.id,
          {
            ...values,
            shopId,
          },
          shopId
        );
        message.success('Поставщик успешно обновлен');
      } else {
        await createSupplier(
          {
            ...values,
            shopId,
            isActive: true,
          },
          shopId
        );
        message.success('Поставщик успешно создан');
      }
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
      initialValues={initialData}
    >
      <Form.Item
        name="name"
        label="Название"
        rules={[{ required: true, message: 'Введите название поставщика' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="contactPerson" label="Контактное лицо">
        <Input />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[{ type: 'email', message: 'Введите корректный email' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Телефон"
        rules={[{ required: true, message: 'Введите телефон' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="address" label="Адрес">
        <Input.TextArea />
      </Form.Item>

      {isEdit && (
        <Form.Item name="isActive" label="Активен" valuePropName="checked">
          <Switch />
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" className="bg-blue-500">
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </Form.Item>
    </Form>
  );
};
