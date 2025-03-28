import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Modal,
  Switch,
  Select,
  message,
  Button,
  Space,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBarcode,
  updateBarcode,
  getCategories,
} from '@/services/managerApi';
import { generateBarcode } from '@/utils/barcode';
import { Category } from '@/types/category';
import { ReloadOutlined } from '@ant-design/icons';

interface BarcodeFormProps {
  visible: boolean;
  onClose: () => void;
  barcode?: any;
  shopId: string;
}

export function BarcodeForm({
  visible,
  onClose,
  barcode,
  shopId,
}: BarcodeFormProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!barcode;

  // Загрузка категорий
  const { data: categories } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId),
    enabled: !!shopId,
  });

  // Мутации для создания/обновления штрихкода
  const createMutation = useMutation({
    mutationFn: createBarcode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      message.success('Штрихкод успешно создан');
      handleClose();
    },
    onError: (error) => {
      message.error('Ошибка при создании штрихкода');
      console.error('Error creating barcode:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateBarcode(barcode.id, { ...data, shopId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      message.success('Штрихкод успешно обновлен');
      handleClose();
    },
    onError: (error) => {
      message.error('Ошибка при обновлении штрихкода');
      console.error('Error updating barcode:', error);
    },
  });

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        form.setFieldsValue({
          code: barcode.code,
          productName: barcode.productName,
          description: barcode.description,
          categoryId: barcode.categoryId,
          isService: barcode.isService,
        });
      } else {
        form.setFieldsValue({
          code: generateBarcode(),
          isService: false,
        });
      }
    }
  }, [visible, form, barcode, isEdit]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        shopId,
      };

      if (isEdit) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Редактировать штрихкод' : 'Создать штрихкод'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleClose}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      okText={isEdit ? 'Сохранить' : 'Создать'}
      cancelText="Отмена"
      width={600}
      okButtonProps={{ className: '!bg-blue-500 hover:!bg-blue-600' }}
    >
      <Form form={form} layout="vertical" initialValues={{ isService: false }}>
        <Form.Item
          name="code"
          label="Штрихкод"
          rules={[{ required: true, message: 'Введите штрихкод' }]}
        >
          <Input
            disabled={isEdit}
            suffix={
              !isEdit && (
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={(e) => {
                    e.preventDefault();
                    const newBarcode = generateBarcode();
                    form.setFieldsValue({ code: newBarcode });
                  }}
                  className="!bg-blue-500 hover:!bg-blue-600"
                >
                  Генерировать
                </Button>
              )
            }
          />
        </Form.Item>

        <Form.Item
          name="productName"
          label="Название"
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="categoryId" label="Категория">
          <Select
            allowClear
            placeholder="Выберите категорию"
            options={categories?.map((category: Category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        </Form.Item>

        <Form.Item name="isService" label="Это услуга" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
