import React, { useState } from 'react';
import { Form, Select, InputNumber, Button, message } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBarcodes, createServiceProduct } from '@/services/managerApi';
import { useRoleStore } from '@/store/roleStore';

interface AddServiceFormProps {
  warehouseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddServiceForm: React.FC<AddServiceFormProps> = ({
  warehouseId,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { currentRole } = useRoleStore();
  const shopId = currentRole?.type === 'shop' ? currentRole.shop.id : undefined;

  // Получаем список услуг из баркодов
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services', shopId],
    queryFn: async () => {
      if (!shopId) return [];
      const services = await getBarcodes(shopId, true);
      return services.filter((service) => service.isActive);
    },
    enabled: !!shopId,
  });

  const handleSubmit = async (values: any) => {
    if (!shopId) {
      message.error('Не удалось определить магазин');
      return;
    }

    setLoading(true);
    try {
      await createServiceProduct({
        barcodeId: values.serviceId,
        warehouseId,
        sellingPrice: values.sellingPrice,
        purchasePrice: 0, // Всегда 0 для услуг
      });

      message.success('Услуга успешно добавлена на склад');
      queryClient.invalidateQueries({ queryKey: ['products', warehouseId] });
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding service:', error);
      message.error('Не удалось добавить услугу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="max-w-lg"
    >
      <Form.Item
        name="serviceId"
        label="Выберите услугу"
        rules={[{ required: true, message: 'Выберите услугу' }]}
      >
        <Select
          loading={isLoadingServices}
          placeholder="Выберите услугу из списка"
          showSearch
          optionFilterProp="children"
        >
          {services?.map((service) => (
            <Select.Option key={service.id} value={service.id}>
              {service.productName}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="sellingPrice"
        label="Цена продажи"
        rules={[{ required: true, message: 'Укажите цену продажи' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          style={{ width: '100%' }}
          placeholder="Введите цену продажи"
        />
      </Form.Item>

      <Form.Item className="mb-0 flex justify-end space-x-2">
        <Button onClick={onCancel}>Отмена</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Добавить услугу
        </Button>
      </Form.Item>
    </Form>
  );
};
