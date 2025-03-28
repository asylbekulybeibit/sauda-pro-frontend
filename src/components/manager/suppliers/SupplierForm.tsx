import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Switch, message, Modal } from 'antd';
import { Supplier } from '@/types/supplier';
import { createSupplier, updateSupplier } from '@/services/managerApi';
import { ApiErrorHandler } from '@/utils/error-handler';

interface SupplierFormProps {
  shopId: string;
  initialData?: Supplier;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  shopId,
  initialData,
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initialData;

  // Обработка данных формы при изменении видимости или initialData
  useEffect(() => {
    if (visible) {
      if (initialData) {
        // Если есть данные для редактирования, заполняем форму
        form.setFieldsValue({
          name: initialData.name,
          contactPerson: initialData.contactPerson,
          phone: initialData.phone,
          email: initialData.email,
          address: initialData.address,
          notes: initialData.notes,
        });
      } else {
        // Если это создание нового поставщика, очищаем форму
        form.resetFields();
      }
    }
  }, [visible, initialData, form]);

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (initialData) {
        await updateSupplier(initialData.id, { ...values, shopId }, shopId);
        message.success('Поставщик успешно обновлен');
      } else {
        await createSupplier({ ...values, shopId });
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
    <Modal
      title={isEdit ? 'Редактировать поставщика' : 'Добавить поставщика'}
      open={visible}
      onCancel={handleCancel}
      onOk={form.submit}
      okText={isEdit ? 'Сохранить' : 'Добавить'}
      cancelText="Отмена"
      confirmLoading={loading}
      destroyOnClose
      okButtonProps={{
        className: '!bg-blue-500 hover:!bg-blue-600',
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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
        <Form.Item name="phone" label="Телефон">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input type="email" />
        </Form.Item>
        <Form.Item name="address" label="Адрес">
          <Input />
        </Form.Item>
        <Form.Item name="notes" label="Примечания">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
