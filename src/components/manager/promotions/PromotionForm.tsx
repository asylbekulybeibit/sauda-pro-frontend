import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Promotion } from '@/types/promotion';
import { getProducts } from '@/services/managerApi';
import { createPromotion, updatePromotion } from '@/services/managerApi';
import { Product } from '@/types/product';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  message,
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
        discount: promotion.discount,
        dateRange: [
          promotion.startDate ? dayjs(promotion.startDate) : null,
          promotion.endDate ? dayjs(promotion.endDate) : null,
        ],
        productIds: promotion.products?.map((p) => p.id.toString()) || [],
      });
    }
  }, [promotion, form]);

  const createMutation = useMutation({
    mutationFn: createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      message.success('Акция успешно создана');
      onClose();
    },
    onError: (error) => {
      message.error('Ошибка при создании акции');
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
    onError: (error) => {
      message.error('Ошибка при обновлении акции');
      console.error(error);
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name,
        description: values.description,
        discount: values.discount,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        productIds: values.productIds,
        shopId: shopId!,
      };

      if (promotion) {
        await updateMutation.mutateAsync({
          id: promotion.id.toString(),
          data: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error('Ошибка валидации формы:', error);
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
          onClick={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
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
          discount: 0,
          dateRange: [dayjs(), dayjs().add(7, 'day')],
          productIds: [],
        }}
      >
        <div className="grid grid-cols-2 gap-4">
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
            name="discount"
            label="Скидка (%)"
            rules={[{ required: true, message: 'Укажите размер скидки' }]}
          >
            <InputNumber
              min={0}
              max={100}
              step={1}
              precision={2}
              style={{ width: '100%' }}
              placeholder="Например: 10"
            />
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
