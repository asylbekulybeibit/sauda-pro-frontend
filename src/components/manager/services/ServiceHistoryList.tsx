import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Modal,
  Space,
  Tag,
  Tooltip,
  Typography,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Spin,
  Alert,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  StopOutlined,
  UserOutlined,
  CarOutlined,
  ToolOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  getServiceHistory,
  getVehicles,
  getServiceTypes,
} from '@/services/servicesApi';
import { getActiveClients, getActiveEmployees } from '@/services/managerApi';
import { formatDate, formatCurrency } from '@/utils/format';
import { ServiceHistory } from '@/types/serviceHistory';
import { Client } from '@/types/client';
import { Vehicle } from '@/types/vehicle';
import { ServiceType } from '@/types/serviceType';
import { Employee } from '@/types/employee';

const { Panel } = Collapse;
const { Text } = Typography;

interface ServiceHistoryListProps {
  shopId: string;
}

// Карта статусов услуг
const statusMap = {
  pending: {
    text: 'Ожидает',
    color: 'default',
    icon: <ClockCircleOutlined />,
  },
  active: {
    text: 'В процессе',
    color: 'processing',
    icon: <SyncOutlined spin />,
  },
  completed: {
    text: 'Завершена',
    color: 'success',
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    text: 'Отменена',
    color: 'error',
    icon: <StopOutlined />,
  },
};

export function ServiceHistoryList({ shopId }: ServiceHistoryListProps) {
  const [selectedService, setSelectedService] = useState<ServiceHistory | null>(
    null
  );
  const [detailsVisible, setDetailsVisible] = useState(false);

  // Загрузка истории услуг
  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError,
  } = useQuery({
    queryKey: ['services', shopId],
    queryFn: () => getServiceHistory(shopId),
    enabled: !!shopId,
  });

  // Загрузка списка активных клиентов
  const { data: clients } = useQuery({
    queryKey: ['activeClients', shopId],
    queryFn: () => getActiveClients(shopId),
    enabled: !!shopId,
  });

  // Загрузка типов услуг
  const { data: serviceTypes } = useQuery({
    queryKey: ['serviceTypes', shopId],
    queryFn: () => getServiceTypes(shopId),
    enabled: !!shopId,
  });

  // Загрузка автомобилей
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', shopId],
    queryFn: () => getVehicles(shopId),
    enabled: !!shopId,
  });

  // Загрузка сотрудников
  const { data: employees } = useQuery({
    queryKey: ['employees', shopId],
    queryFn: () => getActiveEmployees(shopId),
    enabled: !!shopId,
  });

  // Получение имени клиента по id
  const getClientName = (clientId: string) => {
    if (!clients) return '-';
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? `${client.lastName} ${client.firstName}` : '-';
  };

  // Получение полной информации о клиенте по id
  const getClientInfo = (clientId: string) => {
    if (!clients) return null;
    return clients.find((c: Client) => c.id === clientId) || null;
  };

  // Получение информации об автомобиле по id
  const getVehicleInfo = (vehicleId: string) => {
    if (!vehicles) return '-';
    const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
    return vehicle
      ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`
      : '-';
  };

  // Получение полных данных автомобиля по id
  const getVehicleDetails = (vehicleId: string) => {
    if (!vehicles) return null;
    return vehicles.find((v: Vehicle) => v.id === vehicleId) || null;
  };

  // Получение названия типа услуги по id
  const getServiceTypeName = (serviceTypeId: string) => {
    if (!serviceTypes) return '-';
    const serviceType = serviceTypes.find(
      (st: ServiceType) => st.id === serviceTypeId
    );
    return serviceType ? serviceType.name : '-';
  };

  // Получение полной информации о типе услуги
  const getServiceTypeDetails = (serviceTypeId: string) => {
    if (!serviceTypes) return null;
    return (
      serviceTypes.find((st: ServiceType) => st.id === serviceTypeId) || null
    );
  };

  // Получение информации о сотруднике по id
  const getEmployeeName = (employeeId: string) => {
    if (!employees) return '-';
    const employee = employees.find((e: Employee) => e.id === employeeId);
    return employee
      ? `${employee.lastName} ${employee.firstName} (${employee.position})`
      : '-';
  };

  // Открытие модального окна с подробной информацией
  const showDetails = (record: ServiceHistory) => {
    setSelectedService(record);
    setDetailsVisible(true);
  };

  // Колонки для таблицы
  const columns = [
    {
      title: 'Клиент',
      key: 'client',
      render: (_: unknown, record: ServiceHistory) => (
        <span>
          <UserOutlined className="mr-1" />
          {getClientName(record.clientId)}
        </span>
      ),
    },
    {
      title: 'Автомобиль',
      key: 'vehicle',
      render: (_: unknown, record: ServiceHistory) => (
        <span>
          <CarOutlined className="mr-1" />
          {getVehicleInfo(record.vehicleId)}
        </span>
      ),
    },
    {
      title: 'Услуга',
      key: 'service',
      render: (_: unknown, record: ServiceHistory) => (
        <span>
          <ToolOutlined className="mr-1" />
          {getServiceTypeName(record.serviceTypeId)}
        </span>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusMap) => {
        const { text, color, icon } = statusMap[status] || {};
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'Цена',
      key: 'price',
      render: (_: unknown, record: ServiceHistory) => {
        const originalPrice = record.originalPrice;
        const finalPrice = record.finalPrice;

        if (originalPrice === finalPrice) {
          return <span>{formatCurrency(finalPrice)}</span>;
        }

        return (
          <span>
            <Text delete type="secondary" className="mr-2">
              {formatCurrency(originalPrice)}
            </Text>
            <Text strong>{formatCurrency(finalPrice)}</Text>
            {record.discountPercent > 0 && (
              <Tag color="green" className="ml-1">
                -{record.discountPercent}%
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: 'Начало',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: string) => (
        <span>
          <CalendarOutlined className="mr-1" />
          {date ? formatDate(date) : '-'}
        </span>
      ),
    },
    {
      title: 'Завершение',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (date: string, record: ServiceHistory) => (
        <span>
          <CalendarOutlined className="mr-1" />
          {record.endTime ? formatDate(record.endTime) : '-'}
        </span>
      ),
    },
    {
      title: 'Исполнители',
      key: 'staff',
      render: (_: unknown, record: ServiceHistory) => {
        if (!record.serviceStaff || record.serviceStaff.length === 0) {
          return <Text type="secondary">Не назначены</Text>;
        }

        // Показываем первого сотрудника и общее число сотрудников
        const firstStaff = record.serviceStaff[0];
        const staffName = getEmployeeName(firstStaff.staffId);

        if (record.serviceStaff.length === 1) {
          return (
            <span>
              <TeamOutlined className="mr-1" />
              {staffName}
            </span>
          );
        } else {
          return (
            <Tooltip
              title={record.serviceStaff
                .map((staff) => getEmployeeName(staff.staffId))
                .join(', ')}
            >
              <span>
                <TeamOutlined className="mr-1" />
                {staffName} +{record.serviceStaff.length - 1}
              </span>
            </Tooltip>
          );
        }
      },
    },
    {
      title: 'Детали',
      key: 'actions',
      render: (_: unknown, record: ServiceHistory) => (
        <Button type="link" onClick={() => showDetails(record)}>
          Подробнее
        </Button>
      ),
    },
  ];

  if (isLoadingServices) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (servicesError) {
    return (
      <Alert
        message="Ошибка загрузки данных"
        description="Не удалось загрузить историю услуг. Пожалуйста, попробуйте позже."
        type="error"
        showIcon
      />
    );
  }

  if (!services || services.length === 0) {
    return (
      <Empty
        description="История услуг пуста"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div>
      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {/* Модальное окно с подробной информацией */}
      <Modal
        title="Подробная информация об услуге"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Закрыть
          </Button>,
        ]}
        width={800}
      >
        {selectedService && (
          <div className="space-y-4">
            <Card title="Основная информация">
              <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
                <Descriptions.Item label="Статус">
                  <Tag
                    color={statusMap[selectedService.status].color}
                    icon={statusMap[selectedService.status].icon}
                  >
                    {statusMap[selectedService.status].text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Создана">
                  {formatDate(selectedService.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Обновлена">
                  {formatDate(selectedService.updatedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Collapse defaultActiveKey={['1', '2', '3', '4', '5']}>
              <Panel header="Информация о клиенте" key="1">
                {getClientInfo(selectedService.clientId) ? (
                  <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                    <Descriptions.Item label="ФИО">
                      {getClientName(selectedService.clientId)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Телефон">
                      {getClientInfo(selectedService.clientId)?.phone || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {getClientInfo(selectedService.clientId)?.email || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Скидка">
                      {getClientInfo(selectedService.clientId)?.discountPercent
                        ? `${
                            getClientInfo(selectedService.clientId)
                              ?.discountPercent
                          }%`
                        : '0%'}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Text type="secondary">Информация о клиенте не доступна</Text>
                )}
              </Panel>

              <Panel header="Информация об автомобиле" key="2">
                {getVehicleDetails(selectedService.vehicleId) ? (
                  <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                    <Descriptions.Item label="Марка">
                      {getVehicleDetails(selectedService.vehicleId)?.make ||
                        '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Модель">
                      {getVehicleDetails(selectedService.vehicleId)?.model ||
                        '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Гос. номер">
                      {getVehicleDetails(selectedService.vehicleId)
                        ?.licensePlate || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Тип кузова">
                      {getVehicleDetails(selectedService.vehicleId)?.bodyType ||
                        '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Объем двигателя">
                      {getVehicleDetails(selectedService.vehicleId)
                        ?.engineVolume || '-'}{' '}
                      л
                    </Descriptions.Item>
                    <Descriptions.Item label="Год выпуска">
                      {getVehicleDetails(selectedService.vehicleId)?.year ||
                        '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="VIN">
                      {getVehicleDetails(selectedService.vehicleId)?.vin || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Text type="secondary">
                    Информация об автомобиле не доступна
                  </Text>
                )}
              </Panel>

              <Panel header="Информация об услуге" key="3">
                {getServiceTypeDetails(selectedService.serviceTypeId) ? (
                  <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                    <Descriptions.Item label="Название">
                      {getServiceTypeDetails(selectedService.serviceTypeId)
                        ?.name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Описание">
                      {getServiceTypeDetails(selectedService.serviceTypeId)
                        ?.description || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Стандартная цена">
                      {formatCurrency(
                        getServiceTypeDetails(selectedService.serviceTypeId)
                          ?.price || 0
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Text type="secondary">
                    Информация о типе услуги не доступна
                  </Text>
                )}
              </Panel>

              <Panel header="Финансовая информация" key="4">
                <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                  <Descriptions.Item label="Начальная цена">
                    {formatCurrency(selectedService.originalPrice)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Скидка">
                    {selectedService.discountPercent}%
                  </Descriptions.Item>
                  <Descriptions.Item label="Итоговая цена">
                    <Text strong>
                      {formatCurrency(selectedService.finalPrice)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Panel>

              <Panel header="Временная информация" key="5">
                <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                  <Descriptions.Item label="Дата создания">
                    {formatDate(selectedService.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Начало работы">
                    {selectedService.startTime
                      ? formatDate(selectedService.startTime)
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Завершение работы">
                    {selectedService.endTime
                      ? formatDate(selectedService.endTime)
                      : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Panel>

              {selectedService.notes && (
                <Panel header="Заметки" key="6">
                  <Card>
                    <p>{selectedService.notes}</p>
                  </Card>
                </Panel>
              )}

              <Panel header="Исполнители" key="7">
                {selectedService.serviceStaff &&
                selectedService.serviceStaff.length > 0 ? (
                  <div className="space-y-2">
                    {selectedService.serviceStaff.map((staff) => (
                      <Card key={staff.id} size="small">
                        <div className="flex items-center">
                          <TeamOutlined className="mr-2" />
                          <span>
                            {getEmployeeName(staff.staffId)}
                            {staff.startedWork && (
                              <Tag color="blue" className="ml-2">
                                Начал: {formatDate(staff.startedWork)}
                              </Tag>
                            )}
                            {staff.completedWork && (
                              <Tag color="green" className="ml-2">
                                Закончил: {formatDate(staff.completedWork)}
                              </Tag>
                            )}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary">Исполнители не назначены</Text>
                )}
              </Panel>
            </Collapse>
          </div>
        )}
      </Modal>
    </div>
  );
}
