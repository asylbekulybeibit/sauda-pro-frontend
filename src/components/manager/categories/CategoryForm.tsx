import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { Category } from '@/types/category';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory } from '@/services/managerApi';

interface CategoryFormProps {
  visible: boolean;
  onClose: () => void;
  category?: Category;
  categories: Category[];
  shopId: string;
}

export function CategoryForm({
  visible,
  onClose,
  category,
  categories,
  shopId,
}: CategoryFormProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEditMode = !!category;

  // Сброс формы при открытии/закрытии модального окна
  useEffect(() => {
    if (visible) {
      // Установка начальных значений для режима редактирования
      form.setFieldsValue({
        name: category?.name || '',
        description: category?.description || '',
        parentId: category?.parentId || undefined,
      });
    } else {
      // Сброс формы при закрытии
      form.resetFields();
    }
  }, [visible, category, form]);

  // Мутация для создания категории
  const createMutation = useMutation({
    mutationFn: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) =>
      createCategory(data),
    onSuccess: () => {
      message.success('Категория успешно создана');
      queryClient.invalidateQueries({ queryKey: ['categories', shopId] });
      onClose();
    },
    onError: () => {
      message.error('Ошибка при создании категории');
    },
  });

  // Мутация для обновления категории
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      message.success('Категория успешно обновлена');
      queryClient.invalidateQueries({ queryKey: ['categories', shopId] });
      onClose();
    },
    onError: () => {
      message.error('Ошибка при обновлении категории');
    },
  });

  // Обработчик отправки формы
  const handleSubmit = async (values: any) => {
    const payload = {
      name: values.name,
      description: values.description || '',
      parentId: values.parentId || undefined,
      shopId,
      isActive: true,
    };

    if (isEditMode && category) {
      await updateMutation.mutateAsync({
        id: category.id,
        data: payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  // Функция для построения иерархического списка категорий
  const buildCategoryOptions = () => {
    // Функция для получения полного пути категории
    const getCategoryPath = (categoryId: string | undefined): string => {
      if (!categoryId) return '';

      const parent = categories.find((c) => c.id === categoryId);
      if (!parent) return '';

      const parentPath = getCategoryPath(parent.parentId);
      return parentPath ? `${parentPath} > ${parent.name}` : parent.name;
    };

    // Фильтрация текущей категории из вариантов родительской категории
    return categories
      .filter((c) => !category || c.id !== category.id)
      .map((c) => ({
        value: c.id,
        label: c.parentId
          ? `${getCategoryPath(c.parentId)} > ${c.name}`
          : c.name,
      }));
  };

  return (
    <Modal
      title={isEditMode ? 'Редактировать категорию' : 'Создать категорию'}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Сохранить"
      cancelText="Отмена"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: '',
          description: '',
          parentId: undefined,
        }}
      >
        <Form.Item
          name="name"
          label="Название"
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите название категории',
            },
          ]}
        >
          <Input placeholder="Введите название категории" />
        </Form.Item>

        <Form.Item name="description" label="Описание">
          <Input.TextArea
            rows={4}
            placeholder="Введите описание категории"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="parentId"
          label="Родительская категория"
          help="Выберите родительскую категорию для создания иерархии"
        >
          <Select
            allowClear
            placeholder="Выберите родительскую категорию"
            options={buildCategoryOptions()}
            optionFilterProp="label"
            showSearch
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
