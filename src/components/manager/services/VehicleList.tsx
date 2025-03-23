import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  InputNumber,
  message,
  Select,
  Tag,
  Checkbox,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CarOutlined,
} from '@ant-design/icons';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  removeVehicle,
} from '@/services/servicesApi';
import { getActiveClients } from '@/services/managerApi';
import { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '@/types/vehicle';
import { Client } from '@/types/client';
import { formatDate } from '@/utils/format';

interface VehicleListProps {
  shopId: string;
}

// Варианты типов кузова
const bodyTypes = [
  'Седан',
  'Хэтчбек',
  'Универсал',
  'Внедорожник',
  'Кроссовер',
  'Минивэн',
  'Пикап',
  'Купе',
  'Кабриолет',
];

export function VehicleList({ shopId }: VehicleListProps) {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();

  // Состояние для отслеживания статуса чекбокса "Без гос. номера"
  const isWithoutLicensePlate = Form.useWatch('isWithoutLicensePlate', form);

  // Загрузка списка автомобилей
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles', shopId],
    queryFn: () => getVehicles(shopId),
    enabled: !!shopId,
  });

  // Загрузка списка активных клиентов для выбора владельца
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['activeClients', shopId],
    queryFn: () => getActiveClients(shopId),
    enabled: !!shopId,
  });

  // Мутация для создания нового автомобиля
  const createMutation = useMutation({
    mutationFn: (vehicleData: CreateVehicleDto) =>
      createVehicle(shopId, vehicleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', shopId] });
      setIsModalVisible(false);
      form.resetFields();
      message.success('Автомобиль успешно добавлен');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при добавлении автомобиля'
      );
    },
  });

  // Мутация для обновления автомобиля
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehicleDto }) =>
      updateVehicle(shopId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', shopId] });
      setIsModalVisible(false);
      setCurrentVehicle(null);
      form.resetFields();
      message.success('Данные автомобиля обновлены');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          'Ошибка при обновлении данных автомобиля'
      );
    },
  });

  // Мутация для удаления автомобиля
  const removeMutation = useMutation({
    mutationFn: (id: string) => removeVehicle(shopId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', shopId] });
      message.success('Автомобиль удален');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Ошибка при удалении автомобиля'
      );
    },
  });

  // Обработчик открытия модального окна для добавления нового автомобиля
  const handleAddVehicle = () => {
    setIsEditMode(false);
    setCurrentVehicle(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Обработчик открытия модального окна для редактирования автомобиля
  const handleEditVehicle = (vehicle: Vehicle) => {
    setIsEditMode(true);
    setCurrentVehicle(vehicle);

    // Определяем, является ли номер "Б/Н" (без номера)
    const isWithoutLicensePlate = vehicle.licensePlate === 'Б/Н';

    form.setFieldsValue({
      clientId: vehicle.clientId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      bodyType: vehicle.bodyType,
      engineVolume: vehicle.engineVolume,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin,
      isWithoutLicensePlate: isWithoutLicensePlate,
    });

    setIsModalVisible(true);
  };

  // Обработчик подтверждения формы
  const handleFormSubmit = (values: any) => {
    // Обрабатываем случай "Без гос. номера"
    if (
      values.isWithoutLicensePlate &&
      (!values.licensePlate || values.licensePlate === '')
    ) {
      values.licensePlate = 'Б/Н';
    }

    const formattedValues = {
      ...values,
      // Обработка пустого значения clientId
      clientId: values.clientId || null,
      // Учитываем, что model может быть пустым
      model: values.model || null,
      // Учитываем, что engineVolume может быть пустым или нужно преобразовать в число
      engineVolume: values.engineVolume
        ? typeof values.engineVolume === 'number'
          ? values.engineVolume
          : parseFloat(String(values.engineVolume))
        : null,
    };

    if (isEditMode && currentVehicle) {
      updateMutation.mutate({
        id: currentVehicle.id,
        data: formattedValues,
      });
    } else {
      createMutation.mutate(formattedValues);
    }
  };

  // Получение информации о клиенте по id
  const getClientInfo = (clientId?: string) => {
    if (!clientId) return { name: 'Без владельца', discount: 0, phone: '' };
    if (!clients) return { name: '-', discount: 0, phone: '' };
    const client = clients.find((c: Client) => c.id === clientId);
    return {
      name: client ? `${client.lastName} ${client.firstName}` : '-',
      discount: client?.discountPercent || 0,
      phone: client?.phone || '',
    };
  };

  // Колонки для таблицы
  const columns = [
    {
      title: 'Владелец',
      dataIndex: 'clientId',
      key: 'clientId',
      render: (clientId?: string) => {
        const clientInfo = getClientInfo(clientId);
        return (
          <div>
            <div>{clientInfo.name}</div>
            {clientInfo.discount > 0 && (
              <Tag color="green">Скидка: {clientInfo.discount}%</Tag>
            )}
            {clientInfo.phone && (
              <div className="text-xs text-gray-500">{clientInfo.phone}</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Марка',
      dataIndex: 'make',
      key: 'make',
    },
    {
      title: 'Модель',
      dataIndex: 'model',
      key: 'model',
      render: (model: string) => model || '-',
    },
    {
      title: 'Год',
      dataIndex: 'year',
      key: 'year',
      render: (year: number) => year || '-',
    },
    {
      title: 'Тип кузова',
      dataIndex: 'bodyType',
      key: 'bodyType',
    },
    {
      title: 'Объем двигателя',
      dataIndex: 'engineVolume',
      key: 'engineVolume',
      render: (volume: number) => (volume ? `${volume} л` : '-'),
    },
    {
      title: 'Гос. номер',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (licensePlate: string) => {
        if (licensePlate === 'Б/Н') {
          return <Tag color="orange">Без номера</Tag>;
        }
        return licensePlate;
      },
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
      render: (_: any, record: Vehicle) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditVehicle(record)}
            type="text"
          />
          <Popconfirm
            title="Вы уверены, что хотите удалить этот автомобиль?"
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
          onClick={handleAddVehicle}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Добавить автомобиль
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={vehicles || []}
        rowKey="id"
        loading={isLoadingVehicles}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={
          isEditMode
            ? 'Редактирование автомобиля'
            : 'Добавление нового автомобиля'
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ isWithoutLicensePlate: false }}
        >
          <Form.Item label="Владелец" name="clientId">
            <Select
              placeholder="Выберите клиента"
              loading={isLoadingClients}
              optionFilterProp="children"
              showSearch
              allowClear
              filterOption={(input, option: any) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
              options={[
                { value: '', label: 'Без владельца' },
                ...(clients?.map((client: Client) => ({
                  value: client.id,
                  label: `${client.lastName} ${client.firstName} (${
                    client.phone
                  })${
                    client.discountPercent > 0
                      ? ` - Скидка: ${client.discountPercent}%`
                      : ''
                  }`,
                })) || []),
              ]}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Марка"
              name="make"
              rules={[{ required: true, message: 'Введите марку автомобиля' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item label="Модель" name="model">
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Год выпуска" name="year">
              <InputNumber
                min={1900}
                max={new Date().getFullYear()}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="Тип кузова"
              name="bodyType"
              rules={[{ required: true, message: 'Выберите тип кузова' }]}
            >
              <Select
                placeholder="Выберите тип кузова"
                options={bodyTypes.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Объем двигателя (л)" name="engineVolume">
              <InputNumber
                min={0.1}
                max={10}
                step={0.1}
                precision={1}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <div>
              <Form.Item
                label="Гос. номер"
                name="licensePlate"
                rules={[
                  { required: true, message: 'Введите гос. номер автомобиля' },
                ]}
                className="mb-0"
              >
                <Input disabled={isWithoutLicensePlate} />
              </Form.Item>

              <Form.Item
                name="isWithoutLicensePlate"
                valuePropName="checked"
                className="mt-1"
              >
                <Checkbox
                  onChange={(e) => {
                    if (e.target.checked) {
                      form.setFieldsValue({ licensePlate: 'Б/Н' });
                    } else {
                      form.setFieldsValue({ licensePlate: '' });
                    }
                  }}
                >
                  Без гос. номера
                </Checkbox>
              </Form.Item>
            </div>
          </div>

          <Form.Item label="VIN-номер" name="vin">
            <Input />
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
