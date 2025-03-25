import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, message, Select } from 'antd';
import { Supplier } from '@/types/supplier';
import {
  createSupplier,
  updateSupplier,
  getWarehouses,
} from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';

interface SupplierFormProps {
  shopId: string;
  initialData?: Supplier;
  onSuccess: () => void;
}

interface Warehouse {
  id: string;
  name: string;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  shopId,
  initialData,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouses(shopId);
        setWarehouses(data);
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
        message.error('Не удалось загрузить список складов');
      }
    };

    fetchWarehouses();
  }, [shopId]);

  const onFinish = async (values: any) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

      <Form.Item
        name="warehouseId"
        label="Склад"
        tooltip="Выберите склад, если поставщик работает только с конкретным складом"
      >
        <Select
          placeholder="Выберите склад"
          allowClear
          loading={warehouses.length === 0}
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
        />
      </Form.Item>

      {isEdit && (
        <Form.Item name="isActive" label="Активен" valuePropName="checked">
          <Switch />
        </Form.Item>
      )}

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="bg-blue-500"
        >
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </Form.Item>
    </Form>
  );
};
