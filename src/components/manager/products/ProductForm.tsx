import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct } from '@/services/managerApi';
import { Modal, Form, Input, InputNumber, Select, Button, Space } from 'antd';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onClose: () => void;
  shopId: string;
}

const { TextArea } = Input;
const { Option } = Select;

export function ProductForm({
  product,
  categories,
  onClose,
  shopId,
}: ProductFormProps) {
  console.log('ProductForm render - Initial categories:', categories);
  console.log(
    'ProductForm render - Raw categories data:',
    JSON.stringify(categories, null, 2)
  );

  // Фильтруем только активные категории
  const validCategories = (categories || []).filter((category) => {
    const isValid = Boolean(
      category && category.name && category.id && category.isActive !== false
    );

    console.log('Category validation:', {
      id: category.id,
      name: category.name,
      isValid,
    });

    return isValid;
  });

  console.log('Final valid categories:', validCategories);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Установка начальных значений формы при изменении product
  useEffect(() => {
    if (product && form) {
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        sellingPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        quantity: product.quantity,
        minQuantity: product.minQuantity,
        barcode: product.barcodes && product.barcodes[0],
        categoryId: product.categoryId,
        sku: product.sku,
      });
    }
  }, [product, form]);

  const createMutation = useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      sellingPrice: parseFloat(values.sellingPrice) || 0,
      purchasePrice: parseFloat(values.purchasePrice) || 0,
      quantity: parseInt(values.quantity) || 0,
      minQuantity: parseInt(values.minQuantity) || 0,
      categoryId: values.categoryId || undefined,
      shopId,
      barcodes: values.barcode ? [String(values.barcode)] : [],
      barcode: values.barcode ? String(values.barcode) : undefined,
      isActive: true,
    };

    console.log('Submitting payload:', payload);

    if (product) {
      await updateMutation.mutateAsync({
        id: product.id,
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  return (
    <Modal
      title={product ? 'Редактировать товар' : 'Создать товар'}
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
          name: product?.name || '',
          description: product?.description || '',
          sellingPrice: product?.sellingPrice || '',
          purchasePrice: product?.purchasePrice || '',
          quantity: product?.quantity || 0,
          minQuantity: product?.minQuantity || 0,
          barcode: (product?.barcodes && product.barcodes[0]) || '',
          categoryId: product?.categoryId || '',
          sku: product?.sku || '',
        }}
      >
        {/* Название товара */}
        <Form.Item
          name="name"
          label="Название товара"
          rules={[{ required: true, message: 'Введите название товара' }]}
        >
          <Input placeholder="Введите название товара" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          {/* Артикул */}
          <Form.Item name="sku" label="Артикул">
            <Input placeholder="Артикул товара" />
          </Form.Item>

          {/* Категория */}
          <Form.Item name="categoryId" label="Категория">
            <Select placeholder="Выберите категорию">
              <Option value="">Без категории</Option>
              {validCategories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Цена продажи */}
          <Form.Item
            name="sellingPrice"
            label="Цена продажи"
            rules={[{ required: true, message: 'Введите цену продажи' }]}
          >
            <InputNumber
              placeholder="0.00"
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              addonAfter="₸"
            />
          </Form.Item>

          {/* Закупочная цена */}
          <Form.Item
            name="purchasePrice"
            label="Закупочная цена"
            rules={[{ required: true, message: 'Введите закупочную цену' }]}
          >
            <InputNumber
              placeholder="0.00"
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              addonAfter="₸"
            />
          </Form.Item>

          {/* Количество */}
          <Form.Item
            name="quantity"
            label="Количество"
            rules={[{ required: true, message: 'Введите количество' }]}
          >
            <InputNumber placeholder="0" min={0} style={{ width: '100%' }} />
          </Form.Item>

          {/* Минимальное количество */}
          <Form.Item
            name="minQuantity"
            label="Минимальное количество"
            rules={[
              { required: true, message: 'Введите минимальное количество' },
            ]}
          >
            <InputNumber placeholder="0" min={0} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        {/* Штрихкод */}
        <Form.Item name="barcode" label="Штрихкод">
          <Input placeholder="Введите штрихкод товара" />
        </Form.Item>

        {/* Описание */}
        <Form.Item name="description" label="Описание">
          <TextArea placeholder="Введите описание товара" rows={3} />
        </Form.Item>

        {/* Кнопки действий */}
        <Form.Item>
          <div className="flex justify-end mt-4">
            <Space>
              <Button onClick={onClose}>Отмена</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
              >
                {product ? 'Сохранить' : 'Создать'}
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
