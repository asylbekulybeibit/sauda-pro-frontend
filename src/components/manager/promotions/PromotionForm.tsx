import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Promotion, PromotionType, PromotionTarget } from '@/types/promotion';
import { getProducts } from '@/services/managerApi';
import { createPromotion, updatePromotion } from '@/services/managerApi';
import { Product } from '@/types/product';
import { api } from '@/services/api';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  message,
  Radio,
} from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface PromotionFormProps {
  promotion?: Promotion;
  onClose: () => void;
}

export function PromotionForm({ promotion, onClose }: PromotionFormProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const [form] = Form.useForm();
  const [promotionType, setPromotionType] = useState<PromotionType>(
    PromotionType.PERCENTAGE
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', shopId],
    queryFn: () => getProducts(shopId!),
    enabled: !!shopId,
  });

  useEffect(() => {
    if (promotion) {
      form.setFieldsValue({
        name: promotion.name,
        description: promotion.description,
        value: promotion.value,
        type: promotion.type,
        target: promotion.target,
        dateRange: [
          promotion.startDate ? dayjs(promotion.startDate) : null,
          promotion.endDate ? dayjs(promotion.endDate) : null,
        ],
        productIds: promotion.products?.map((p) => p.id.toString()) || [],
      });
      setPromotionType(promotion.type);
    }
  }, [promotion, form]);

  const createMutation = useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      message.success('Акция успешно создана');
      onClose();
    },
    onError: (error: any) => {
      message.error(
        'Ошибка при создании акции: ' + (error.message || 'Неизвестная ошибка')
      );
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Promotion> }) =>
      updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      message.success('Акция успешно обновлена');
      onClose();
    },
    onError: (error: any) => {
      message.error(
        'Ошибка при обновлении акции: ' +
          (error.message || 'Неизвестная ошибка')
      );
      console.error(error);
    },
  });

  const handleTypeChange = (type: PromotionType) => {
    setPromotionType(type);
  };

  const handleSubmit = (values) => {
    console.log('Form values:', values);
    setIsSubmitting(true);

    // Calculate discount value
    let discountValue = 0;
    if (values.type === 'percentage') {
      discountValue = parseFloat(values.value);
    }
    console.log('Calculated discount:', discountValue);

    // Prepare payload
    const payload = {
      ...values,
      shopId,
      discount: discountValue.toFixed(2), // Ensure discount is a string with 2 decimal places
      startDate: values.dateRange[0].format(),
      endDate: values.dateRange[1].format(),
      productIds: [],
      categoryIds: [],
    };

    // Add product or category IDs based on target
    if (values.target === 'product' && values.productIds) {
      payload.productIds = values.productIds;
    } else if (values.target === 'category' && values.categoryIds) {
      payload.categoryIds = values.categoryIds;
    }

    console.log('Sending payload:', payload);

    if (promotion) {
      // Update existing promotion
      api
        .put(`/manager/promotions/${promotion.id}`, payload)
        .then(() => {
          message.success('Акция успешно обновлена');
          queryClient.invalidateQueries(['promotions', shopId]);
          onClose();
        })
        .catch((error) => {
          console.error('Error updating promotion:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
          }
          message.error('Ошибка при обновлении акции');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      // Create new promotion using the new endpoint
      api
        .post('/manager/promotions/create-with-discount', payload)
        .then(() => {
          message.success('Акция успешно создана');
          queryClient.invalidateQueries(['promotions', shopId]);
          onClose();
        })
        .catch((error) => {
          console.error('Error creating promotion:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status code:', error.response.status);
          }
          message.error('Ошибка при создании акции');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  const productOptions =
    products?.map((product) => ({
      label: `${product.name} (${product.sku})`,
      value: product.id.toString(),
    })) || [];

  return (
    <Modal
      title={promotion ? 'Редактировать акцию' : 'Создать акцию'}
      open={true}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => form.submit()}
          loading={isSubmitting}
          className="bg-blue-500"
        >
          {promotion ? 'Сохранить' : 'Создать'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          description: '',
          type: PromotionType.PERCENTAGE,
          target: PromotionTarget.PRODUCT,
          value: 0,
          dateRange: [dayjs(), dayjs().add(7, 'day')],
          productIds: [],
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Название"
          rules={[
            { required: true, message: 'Пожалуйста, введите название акции' },
          ]}
        >
          <Input placeholder="Название акции" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Тип скидки"
          rules={[{ required: true, message: 'Выберите тип скидки' }]}
        >
          <Radio.Group onChange={(e) => handleTypeChange(e.target.value)}>
            <Radio.Button value={PromotionType.PERCENTAGE}>
              Процент (%)
            </Radio.Button>
            <Radio.Button value={PromotionType.FIXED}>
              Фиксированная сумма
            </Radio.Button>
            <Radio.Button value={PromotionType.SPECIAL_PRICE}>
              Специальная цена
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="value"
            label={
              promotionType === PromotionType.PERCENTAGE
                ? 'Скидка (%)'
                : promotionType === PromotionType.FIXED
                ? 'Сумма скидки'
                : 'Специальная цена'
            }
            rules={[{ required: true, message: 'Укажите значение скидки' }]}
          >
            <InputNumber
              min={0}
              max={promotionType === PromotionType.PERCENTAGE ? 100 : undefined}
              step={promotionType === PromotionType.PERCENTAGE ? 1 : 10}
              precision={2}
              style={{ width: '100%' }}
              placeholder={
                promotionType === PromotionType.PERCENTAGE
                  ? 'Например: 10'
                  : 'Введите сумму'
              }
              onChange={(value) => {
                const numValue =
                  value === null || value === undefined ? 0 : Number(value);
                form.setFieldsValue({ value: numValue });
              }}
              onReset={() => form.setFieldsValue({ value: 0 })}
            />
          </Form.Item>

          <Form.Item
            name="target"
            label="Применить к"
            rules={[
              { required: true, message: 'Выберите к чему применить скидку' },
            ]}
          >
            <Select>
              <Option value={PromotionTarget.PRODUCT}>Товарам</Option>
              <Option value={PromotionTarget.CATEGORY}>Категориям</Option>
              <Option value={PromotionTarget.CART}>Корзине</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="dateRange"
          label="Период действия"
          rules={[
            { required: true, message: 'Выберите период действия акции' },
          ]}
        >
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            format="DD.MM.YYYY"
          />
        </Form.Item>

        <Form.Item name="description" label="Описание">
          <TextArea rows={3} placeholder="Дополнительная информация об акции" />
        </Form.Item>

        <Form.Item
          name="productIds"
          label="Товары"
          rules={[{ required: true, message: 'Выберите хотя бы один товар' }]}
        >
          <Select
            mode="multiple"
            placeholder="Выберите товары для акции"
            optionFilterProp="label"
            loading={isLoadingProducts}
            showSearch
            style={{ width: '100%' }}
            options={productOptions}
            filterOption={(input, option) =>
              (option?.label || '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
