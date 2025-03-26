import { useState, useEffect } from 'react';
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
  DatePicker,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getEmployeesByWarehouse,
  createEmployee,
  createEmployeeForWarehouse,
  updateEmployee,
  removeEmployee,
} from '@/services/managerApi';
import {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '@/types/employee';
import { formatDate } from '@/utils/format';

interface EmployeesListProps {
  shopId: string;
  warehouseId?: string | null;
}

export function EmployeesList({ shopId, warehouseId }: EmployeesListProps) {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();

  // Загрузка списка сотрудников - используем warehouseId из пропсов
  const {
    data: employees,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['employees', shopId, warehouseId],
    queryFn: async () => {
      console.log(
        `[EmployeesList] Запрос данных о сотрудниках-мастерах. shopId=${shopId}, warehouseId=${warehouseId}`
      );

      if (!warehouseId) {
        console.error('[EmployeesList] Ошибка: warehouseId не определен');
        return [];
      }

      try {
        const result = await getEmployeesByWarehouse(shopId, warehouseId);
        console.log(
          `[EmployeesList] Получены данные о сотрудниках-мастерах:`,
          result
        );
        return result;
      } catch (error) {
        console.error(`[EmployeesList] Ошибка при получении данных:`, error);
        throw error;
      }
    },
    enabled: !!shopId && !!warehouseId,
  });

  // Для отладки
  useEffect(() => {
    console.log(`[EmployeesList] Компонент обновлен с данными:`, employees);
    console.log(`[EmployeesList] warehouseId из props:`, warehouseId);
    console.log(`[EmployeesList] shopId:`, shopId);
    console.log(`[EmployeesList] isLoading:`, isLoading);
    console.log(`[EmployeesList] error:`, error);
  }, [employees, warehouseId, shopId, isLoading, error]);

  // Мутация для создания нового сотрудника
  const createMutation = useMutation({
    mutationFn: (employeeData: CreateEmployeeDto) => {
      if (!warehouseId) {
        throw new Error('warehouseId не определен');
      }
      // Используем метод создания сотрудника для конкретного склада
      return createEmployeeForWarehouse(shopId, warehouseId, employeeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees', shopId, warehouseId],
      });
      setIsModalVisible(false);
      form.resetFields();
      message.success('Сотрудник успешно добавлен на текущий склад');
    },
    onError: (error: any) => {
      console.error('[EmployeesList] Ошибка при создании сотрудника:', error);
      message.error(
        error.response?.data?.message || 'Ошибка при добавлении сотрудника'
      );
    },
  });

  // Мутация для обновления сотрудника
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDto }) =>
      updateEmployee(shopId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees', shopId, warehouseId],
      });
      setIsModalVisible(false);
      setCurrentEmployee(null);
      form.resetFields();
      message.success('Данные сотрудника обновлены');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          'Ошибка при обновлении данных сотрудника'
      );
    },
  });

  // Мутация для удаления сотрудника
  const removeMutation = useMutation({
    mutationFn: (id: string) => removeEmployee(shopId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['employees', shopId, warehouseId],
      });
      message.success('Сотрудник удален');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при удалении сотрудника'
      );
    },
  });

  // Обработчик открытия модального окна для добавления нового сотрудника
  const handleAddEmployee = () => {
    setIsEditMode(false);
    setCurrentEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Обработчик открытия модального окна для редактирования сотрудника
  const handleEditEmployee = (employee: Employee) => {
    setIsEditMode(true);
    setCurrentEmployee(employee);
    form.setFieldsValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone,
      position: employee.position,
      hireDate: employee.hireDate ? dayjs(employee.hireDate) : undefined,
    });
    setIsModalVisible(true);
  };

  // Обработчик подтверждения формы
  const handleFormSubmit = (values: any) => {
    const formattedValues = {
      ...values,
      hireDate: values.hireDate
        ? values.hireDate.format('YYYY-MM-DD')
        : undefined,
    };

    if (isEditMode && currentEmployee) {
      updateMutation.mutate({
        id: currentEmployee.id,
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
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Дата найма',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (date: string) => (date ? formatDate(date) : 'Не указана'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Employee) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditEmployee(record)}
            type="text"
          />
          <Popconfirm
            title="Вы уверены, что хотите удалить этого сотрудника?"
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
        <h2 className="text-xl font-semibold">Сотрудники-мастера</h2>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleAddEmployee}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Добавить сотрудника
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={employees || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          isEditMode
            ? 'Редактирование сотрудника'
            : 'Добавление нового сотрудника'
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
            label="Должность"
            name="position"
            rules={[
              { required: true, message: 'Пожалуйста, введите должность' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Дата найма" name="hireDate">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
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
