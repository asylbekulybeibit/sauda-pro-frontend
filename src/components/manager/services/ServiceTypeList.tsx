import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Popconfirm,
  InputNumber,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  getServiceTypes,
  createServiceType,
  updateServiceType,
  removeServiceType,
} from '@/services/servicesApi';
import {
  ServiceType,
  CreateServiceTypeDto,
  UpdateServiceTypeDto,
} from '@/types/serviceType';
import { formatDate, formatPrice } from '@/utils/format';

interface ServiceTypeListProps {
  shopId: string;
}

export function ServiceTypeList({ shopId }: ServiceTypeListProps) {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentServiceType, setCurrentServiceType] =
    useState<ServiceType | null>(null);
  const [form] = Form.useForm();

  // Загрузка списка типов услуг
  const { data: serviceTypes, isLoading } = useQuery({
    queryKey: ['serviceTypes', shopId],
    queryFn: () => getServiceTypes(shopId),
    enabled: !!shopId,
  });

  // Мутация для создания нового типа услуг
  const createMutation = useMutation({
    mutationFn: (serviceTypeData: CreateServiceTypeDto) =>
      createServiceType(shopId, serviceTypeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceTypes', shopId] });
      setIsModalVisible(false);
      form.resetFields();
      message.success('Тип услуги успешно добавлен');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при добавлении типа услуги'
      );
    },
  });

  // Мутация для обновления типа услуг
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceTypeDto }) =>
      updateServiceType(shopId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceTypes', shopId] });
      setIsModalVisible(false);
      setCurrentServiceType(null);
      form.resetFields();
      message.success('Тип услуги обновлен');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при обновлении типа услуги'
      );
    },
  });

  // Мутация для удаления типа услуг
  const removeMutation = useMutation({
    mutationFn: (id: string) => removeServiceType(shopId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceTypes', shopId] });
      message.success('Тип услуги удален');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при удалении типа услуги'
      );
    },
  });

  // Обработчик открытия модального окна для добавления нового типа услуг
  const handleAddServiceType = () => {
    setIsEditMode(false);
    setCurrentServiceType(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Обработчик открытия модального окна для редактирования типа услуг
  const handleEditServiceType = (serviceType: ServiceType) => {
    setIsEditMode(true);
    setCurrentServiceType(serviceType);
    form.setFieldsValue({
      name: serviceType.name,
      description: serviceType.description,
      price: serviceType.price,
    });
    setIsModalVisible(true);
  };

  // Обработчик подтверждения формы
  const handleFormSubmit = (values: any) => {
    // Обработка значения цены
    const formattedValues = {
      ...values,
      // Проверяем, что price - это число
      price:
        typeof values.price === 'number'
          ? values.price
          : parseFloat(String(values.price).replace(/[^0-9.]/g, '')),
    };

    if (isEditMode && currentServiceType) {
      updateMutation.mutate({
        id: currentServiceType.id,
        data: formattedValues,
      });
    } else {
      createMutation.mutate(formattedValues);
    }
  };

  // Колонки для таблицы
  const columns = [
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) =>
        isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Активен
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Неактивен
          </Tag>
        ),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: ServiceType) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditServiceType(record)}
            type="text"
          />
          <Popconfirm
            title="Вы уверены, что хотите удалить этот тип услуги?"
            onConfirm={() => removeMutation.mutate(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button icon={<DeleteOutlined />} type="text" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddServiceType}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Добавить тип услуги
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={serviceTypes || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          isEditMode
            ? 'Редактирование типа услуги'
            : 'Добавление нового типа услуги'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            label="Название"
            name="name"
            rules={[
              { required: true, message: 'Пожалуйста, введите название' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Цена"
            name="price"
            rules={[{ required: true, message: 'Пожалуйста, введите цену' }]}
          >
            <InputNumber
              min={0}
              step={100}
              formatter={(value) => `${value} ₸`}
              parser={(value) => {
                if (!value) return 0;
                return parseFloat(value.replace(/[^0-9.]/g, '')) as any;
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setIsModalVisible(false)}>Отмена</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isEditMode ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
