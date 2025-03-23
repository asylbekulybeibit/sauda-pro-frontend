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
  UserAddOutlined,
} from '@ant-design/icons';
import {
  getClients,
  createClient,
  updateClient,
  removeClient,
} from '@/services/managerApi';
import { Client, CreateClientDto, UpdateClientDto } from '@/types/client';
import { formatDate } from '@/utils/format';

interface ClientsListProps {
  shopId: string;
}

export function ClientsList({ shopId }: ClientsListProps) {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [form] = Form.useForm();

  // Загрузка списка клиентов
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', shopId],
    queryFn: () => getClients(shopId),
    enabled: !!shopId,
  });

  // Мутация для создания нового клиента
  const createMutation = useMutation({
    mutationFn: (clientData: CreateClientDto) =>
      createClient(shopId, clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', shopId] });
      setIsModalVisible(false);
      form.resetFields();
      message.success('Клиент успешно добавлен');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при добавлении клиента'
      );
    },
  });

  // Мутация для обновления клиента
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      updateClient(shopId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', shopId] });
      setIsModalVisible(false);
      setCurrentClient(null);
      form.resetFields();
      message.success('Данные клиента обновлены');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при обновлении данных клиента'
      );
    },
  });

  // Мутация для удаления клиента
  const removeMutation = useMutation({
    mutationFn: (id: string) => removeClient(shopId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', shopId] });
      message.success('Клиент удален');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при удалении клиента'
      );
    },
  });

  // Обработчик открытия модального окна для добавления нового клиента
  const handleAddClient = () => {
    setIsEditMode(false);
    setCurrentClient(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Обработчик открытия модального окна для редактирования клиента
  const handleEditClient = (client: Client) => {
    setIsEditMode(true);
    setCurrentClient(client);
    form.setFieldsValue({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email,
      discountPercent: client.discountPercent,
      notes: client.notes,
    });
    setIsModalVisible(true);
  };

  // Обработчик подтверждения формы
  const handleFormSubmit = (values: any) => {
    const formattedValues = {
      ...values,
    };

    if (isEditMode && currentClient) {
      updateMutation.mutate({
        id: currentClient.id,
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
      title: 'Имя',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Фамилия',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: 'Скидка (%)',
      dataIndex: 'discountPercent',
      key: 'discountPercent',
      render: (discount: number) => (discount > 0 ? `${discount}%` : '-'),
    },
    {
      title: 'Примечания',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || '-',
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Client) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditClient(record)}
            type="text"
          />
          <Popconfirm
            title="Вы уверены, что хотите удалить этого клиента?"
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Список клиентов</h2>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleAddClient}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Добавить клиента
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={clients || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          isEditMode ? 'Редактирование клиента' : 'Добавление нового клиента'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            label="Имя"
            name="firstName"
            rules={[{ required: true, message: 'Пожалуйста, введите имя' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Фамилия"
            name="lastName"
            rules={[{ required: true, message: 'Пожалуйста, введите фамилию' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
            rules={[{ required: true, message: 'Пожалуйста, введите телефон' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                type: 'email',
                message: 'Пожалуйста, введите корректный email',
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Скидка (%)"
            name="discountPercent"
            initialValue={0}
            rules={[
              {
                type: 'number',
                min: 0,
                max: 100,
                message: 'Скидка должна быть от 0 до 100%',
              },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              step={1}
              formatter={(value) => `${value}%`}
              parser={(value) => {
                const parsed = parseInt(value?.replace('%', '') || '0');
                return parsed >= 0 && parsed <= 100 ? (parsed as any) : 0;
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Примечания" name="notes">
            <Input.TextArea rows={3} />
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
