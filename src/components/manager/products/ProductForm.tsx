import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct } from '@/services/managerApi';
import { Modal, Form, Input, InputNumber, Select, Button, Space } from 'antd';
import { message } from 'antd';

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

  // Add a loading state for the form
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Initialize form values from product data
  useEffect(() => {
    if (product) {
      console.log('INIT: Initializing form with product:', product.id);
      console.log('INIT: Product data:', JSON.stringify(product, null, 2));
      console.log(
        'INIT: Barcodes from product:',
        JSON.stringify(product.barcodes)
      );
      console.log(
        'INIT: Barcodes type:',
        Array.isArray(product.barcodes) ? 'array' : typeof product.barcodes
      );

      const initialValues = {
        ...product,
        categoryId: product.categoryId,
        barcode:
          Array.isArray(product?.barcodes) && product?.barcodes.length > 0
            ? product.barcodes[0]
            : '',
      };

      console.log(
        'INIT: Initial values to set:',
        JSON.stringify(initialValues, null, 2)
      );
      console.log('INIT: Barcode value being set:', initialValues.barcode);

      form.setFieldsValue(initialValues);
      console.log('INIT: Form values set successfully');
    }
  }, [product, form]);

  const handleSubmit = async (values: any) => {
    console.log('SUBMIT: Starting form submission with raw values:', values);
    setIsSubmitting(true); // Set loading state

    try {
      // Ensure barcode is properly handled as a string
      const barcodeStr = values.barcode ? String(values.barcode).trim() : '';

      const payload = {
        ...values,
        sellingPrice: parseFloat(values.sellingPrice) || 0,
        purchasePrice: parseFloat(values.purchasePrice) || 0,
        quantity: parseInt(values.quantity) || 0,
        minQuantity: parseInt(values.minQuantity) || 0,
        categoryId: values.categoryId || undefined,
        shopId,
        barcodes: barcodeStr ? [barcodeStr] : [],
        isActive: true,
      };

      // Remove potentially problematic fields
      delete payload.barcode;

      console.log('SUBMIT: Final payload:', JSON.stringify(payload, null, 2));

      if (product) {
        console.log('SUBMIT: Updating product ID:', product.id);
        await updateProduct(product.id, payload);
        console.log('SUBMIT: Product updated successfully');
      } else {
        console.log('SUBMIT: Creating new product');
        await createProduct(payload);
        console.log('SUBMIT: Product created successfully');
      }

      message.success(`Товар успешно ${product ? 'обновлен' : 'создан'}`);
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      onClose();
    } catch (error: any) {
      console.error('SUBMIT: Error:', error);
      message.error(
        `Не удалось ${product ? 'обновить' : 'создать'} товар: ${error.message}`
      );
    } finally {
      setIsSubmitting(false); // Reset loading state
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
          barcode:
            Array.isArray(product?.barcodes) && product?.barcodes.length > 0
              ? product.barcodes[0]
              : '',
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
        <Form.Item
          name="barcode"
          label="Штрихкод"
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                // Trim and check if the value is not just spaces
                if (String(value).trim().length === 0) {
                  return Promise.reject('Штрихкод не может быть пустым');
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder="Введите штрихкод товара"
            allowClear
            maxLength={30}
          />
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
                style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                loading={isSubmitting}
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
