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
  defaultIsService?: boolean;
}

export function BarcodeForm({
  visible,
  onClose,
  barcode,
  shopId,
  defaultIsService = false,
}: BarcodeFormProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEdit = !!barcode;

  // Загрузка категорий
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories', shopId],
    queryFn: () => getCategories(shopId),
    enabled: !!shopId,
  });

  // Мутация для создания/обновления штрихкода
  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? updateBarcode(barcode.id, data) : createBarcode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barcodes'] });
      message.success(isEdit ? 'Штрихкод обновлен' : 'Штрихкод успешно создан');
      handleClose();
    },
    onError: (error) => {
      message.error('Ошибка при сохранении штрихкода');
      console.error('Error saving barcode:', error);
    },
  });

  // Генерация нового штрихкода
  const handleGenerateBarcode = () => {
    const newBarcode = generateBarcode();
    form.setFieldsValue({ code: newBarcode });
  };

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        // Если редактирование - заполняем форму данными штрихкода
        form.setFieldsValue(barcode);
      } else {
        // Если создание - очищаем форму и генерируем новый штрихкод
        form.resetFields();
        handleGenerateBarcode();
        form.setFieldsValue({
          isService: defaultIsService,
        });
      }
    }
  }, [visible, barcode, form, isEdit, defaultIsService]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await mutation.mutateAsync({
        ...values,
        shopId,
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Редактирование штрихкода' : 'Создание штрихкода'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleClose}
      confirmLoading={mutation.isPending}
      okText={isEdit ? 'Сохранить' : 'Создать'}
      cancelText="Отмена"
      okButtonProps={{
        className: '!bg-blue-500 hover:!bg-blue-600',
        style: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="code"
          label="Штрихкод"
          rules={[{ required: true, message: 'Введите штрихкод' }]}
        >
          <Input
            readOnly={isEdit}
            suffix={
              !isEdit && (
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                  onClick={handleGenerateBarcode}
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
          <Input.TextArea />
        </Form.Item>

        <Form.Item name="categoryId" label="Категория">
          <Select allowClear placeholder="Выберите категорию">
            {categories?.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="isService" label="Это услуга" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
