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

  useEffect(() => {
    console.log('[SupplierForm] Component mounted with props:', {
      shopId,
      initialData,
      visible,
      isEdit,
    });
    return () => {
      console.log('[SupplierForm] Component unmounting');
    };
  }, [shopId, initialData, visible, isEdit]);

  // Обработка данных формы при изменении видимости или initialData
  useEffect(() => {
    console.log('[SupplierForm] Visibility or initialData changed:', {
      visible,
      initialData,
    });

    if (visible) {
      if (initialData) {
        console.log(
          '[SupplierForm] Setting form values for edit:',
          initialData
        );
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
        console.log('[SupplierForm] Resetting form for new supplier');
        // Если это создание нового поставщика, очищаем форму
        form.resetFields();
      }
    }
  }, [visible, initialData, form]);

  const handleCancel = () => {
    console.log('[SupplierForm] Cancelling form');
    onClose();
  };

  const handleSubmit = async (values: any) => {
    console.log('[SupplierForm] Submitting form with values:', values);
    setLoading(true);
    try {
      if (initialData) {
        console.log('[SupplierForm] Updating supplier:', {
          id: initialData.id,
          values,
          shopId,
        });
        await updateSupplier(initialData.id, { ...values, shopId }, shopId);
        message.success('Поставщик успешно обновлен');
      } else {
        console.log('[SupplierForm] Creating new supplier:', {
          values,
          shopId,
        });
        await createSupplier({ ...values, shopId });
        message.success('Поставщик успешно создан');
      }
      console.log('[SupplierForm] Operation successful');
      onSuccess();
    } catch (error) {
      console.error('[SupplierForm] Operation failed:', error);
      const apiError = ApiErrorHandler.handle(error);
      message.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  console.log('[SupplierForm] Rendering form:', {
    isEdit,
    visible,
    loading,
  });

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
