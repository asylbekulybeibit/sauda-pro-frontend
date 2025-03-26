import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, InputNumber, message } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Category } from '@/types/category';
import {
  createWarehouseService,
  updateWarehouseService,
} from '@/services/servicesApi';
import { getBarcodes, getWarehouses } from '@/services/managerApi';

// Определяем интерфейс для warehouse
interface Warehouse {
  id: string;
  name: string;
  isMain?: boolean;
  [key: string]: any;
}

interface ServiceFormProps {
  service?: any; // Use proper type if available
  categories: Category[];
  shopId: string;
  onClose: () => void;
}

export function ServiceForm({
  service,
  categories,
  shopId,
  onClose,
}: ServiceFormProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch service barcodes
  const { data: barcodes, isLoading: isLoadingBarcodes } = useQuery({
    queryKey: ['serviceBarcodes', shopId],
    queryFn: () => getBarcodes(shopId, true), // Assuming getBarcodes has a parameter for services
    enabled: !!shopId,
  });

  // Fetch warehouses for the shop
  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses', shopId],
    queryFn: () => getWarehouses(shopId),
    enabled: !!shopId,
  });

  // Set default warehouseId when warehouses are loaded (use the main warehouse)
  useEffect(() => {
    if (warehouses && warehouses.length > 0) {
      // Find main warehouse or use the first one
      const mainWarehouse =
        warehouses.find((w: Warehouse) => w.isMain) || warehouses[0];
      form.setFieldsValue({
        warehouseId: service?.warehouseId || mainWarehouse.id,
      });
    }
  }, [warehouses, form, service]);

  const createMutation = useMutation({
    mutationFn: createWarehouseService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseServices'] });
      message.success('Услуга успешно создана');
      onClose();
    },
    onError: (error: any) => {
      message.error(`Ошибка при создании услуги: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateWarehouseService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseServices'] });
      message.success('Услуга успешно обновлена');
      onClose();
    },
    onError: (error: any) => {
      message.error(`Ошибка при обновлении услуги: ${error.message}`);
    },
  });

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      if (service) {
        // Update existing service
        await updateMutation.mutateAsync({
          id: service.id,
          ...values,
        });
      } else {
        // Create new service
        await createMutation.mutateAsync({
          ...values,
          shopId,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={service ? 'Редактировать услугу' : 'Создать услугу'}
      open={true}
      onCancel={onClose}
      footer={null}
      width={650}
      maskClosable={false}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          barcodeId: service?.barcodeId || '',
          price: service?.price || 0,
          warehouseId: service?.warehouseId || '',
        }}
      >
        {/* Barcode selection */}
        <Form.Item
          name="barcodeId"
          label="Услуга"
          rules={[{ required: true, message: 'Выберите услугу' }]}
        >
          <Select
            placeholder="Выберите услугу"
            loading={isLoadingBarcodes}
            showSearch
            optionFilterProp="label"
          >
            {barcodes?.map((barcode: any) => (
              <Select.Option
                key={barcode.id}
                value={barcode.id}
                label={`${barcode.productName} ${barcode.code}`}
              >
                {barcode.productName} ({barcode.code})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Warehouse selection */}
        <Form.Item
          name="warehouseId"
          label="Склад"
          rules={[{ required: true, message: 'Выберите склад' }]}
        >
          <Select
            placeholder="Выберите склад"
            loading={isLoadingWarehouses}
            disabled={isLoadingWarehouses}
          >
            {warehouses?.map((warehouse: Warehouse) => (
              <Select.Option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} {warehouse.isMain ? '(Основной)' : ''}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Price */}
        <Form.Item
          name="price"
          label="Цена"
          rules={[{ required: true, message: 'Введите цену услуги' }]}
        >
          <InputNumber
            placeholder="Цена услуги"
            min={0}
            step={0.01}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {/* Form actions */}
        <div className="flex justify-end space-x-4 mt-4">
          <Button onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            {service ? 'Обновить' : 'Создать'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
