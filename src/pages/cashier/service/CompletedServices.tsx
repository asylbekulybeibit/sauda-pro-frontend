import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Spin,
  Empty,
  message,
  Descriptions,
  Menu,
  Tooltip,
  Badge,
} from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  CarOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  PieChartOutlined,
  PrinterOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import relativeTime from 'dayjs/plugin/relativeTime';

import { getCompletedServices } from '@/services/cashierApi';

// Инициализация плагинов dayjs
dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Title, Text } = Typography;

interface Service {
  id: string;
  serviceType: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  startTime: string;
  endTime: string;
  initialPrice: number;
  finalPrice: number;
  status: string;
  receipt?: {
    id: string;
    number: string;
    paymentMethod: string;
    createdAt: string;
  };
  serviceStaff: Array<{
    id: string;
    staff: {
      id: string;
      firstName: string;
      lastName: string;
      position: string;
    };
    completedWork?: string; // дата завершения работы сотрудником
  }>;
}

const CompletedServices: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  const loadCompletedServices = async () => {
    if (!shopId) {
      message.error('ID магазина не определен');
      return;
    }

    try {
      setLoading(true);
      const data = await getCompletedServices(shopId);
      console.log('Loaded completed services:', data);
      setServices(data);
    } catch (error) {
      console.error('Error loading completed services:', error);
      message.error('Не удалось загрузить завершенные услуги');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompletedServices();
  }, [shopId]);

  // Функция форматирования длительности услуги
  const formatDuration = (startTime: string, endTime: string) => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const hours = end.diff(start, 'hour');
    const minutes = end.diff(start, 'minute') % 60;

    return `${hours} ч ${minutes} мин`;
  };

  // Обработчик печати чека
  const handlePrintReceipt = (service: Service) => {
    message.info(
      `Отправка на печать чека для услуги ${service.serviceType.name}`
    );
    // Здесь будет код для отправки на печать
    console.log('Printing receipt for service:', service);
  };

  // Обработчик отправки чека по WhatsApp
  const handleSendReceiptWhatsApp = (service: Service) => {
    if (!service.client.phone) {
      message.warning('У клиента не указан номер телефона');
      return;
    }

    message.info(
      `Подготовка PDF и отправка чека на WhatsApp для ${service.client.phone}`
    );
    // Здесь будет код для генерации PDF и отправки на WhatsApp
    console.log('Sending receipt via WhatsApp for service:', service);
  };

  // Обработчик перехода к деталям услуги
  const handleViewServiceDetails = (service: Service) => {
    // Сохраняем данные услуги в localStorage для использования на странице деталей
    localStorage.setItem('completedService', JSON.stringify(service));
    // Переходим на страницу деталей
    navigate(`/cashier/${shopId}/service/receipt/${service.id}`);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Верхнее навигационное меню */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <Menu
          mode="horizontal"
          selectedKeys={['completed']}
          className="flex justify-around"
        >
          <Menu.Item
            key="start"
            icon={<PlayCircleOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/select-service`)}
          >
            Начать услугу
          </Menu.Item>
          <Menu.Item
            key="active"
            icon={<DollarOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/service/active`)}
          >
            Активные
          </Menu.Item>
          <Menu.Item
            key="completed"
            icon={<CheckCircleOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/completed-services`)}
          >
            Завершённые
          </Menu.Item>
          <Menu.Item
            key="prices"
            icon={<PieChartOutlined />}
            className="flex-1 justify-center"
            onClick={() => navigate(`/cashier/${shopId}/service-prices`)}
          >
            Цены
          </Menu.Item>
        </Menu>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6 flex justify-between items-center">
          <Title level={4}>Завершённые услуги</Title>
          <Badge count={services.length} overflowCount={99}>
            <span className="mr-2">Всего услуг:</span>
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : services.length > 0 ? (
          <Row gutter={[16, 16]}>
            {services.map((service) => (
              <Col xs={24} lg={12} key={service.id}>
                <Card
                  className="h-full shadow hover:shadow-lg transition-shadow"
                  hoverable
                  onClick={() => handleViewServiceDetails(service)}
                >
                  <div className="mb-3 flex justify-between items-start">
                    <div>
                      <Title level={5} className="mb-1">
                        {service.serviceType.name}
                      </Title>
                      <Tag color="success">Завершена</Tag>
                    </div>
                    <div className="text-right">
                      <Tag color="green" icon={<DollarOutlined />}>
                        {service.finalPrice} ₸
                      </Tag>
                      {service.finalPrice < service.initialPrice && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="line-through">
                            {service.initialPrice} ₸
                          </span>{' '}
                          <span className="text-green-600">
                            -
                            {Math.round(
                              (1 - service.finalPrice / service.initialPrice) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Descriptions size="small" column={1} className="mb-3">
                    <Descriptions.Item
                      label={
                        <>
                          <UserOutlined /> Клиент
                        </>
                      }
                    >
                      {service.client.lastName} {service.client.firstName}
                      {service.client.phone && (
                        <Text type="secondary" className="ml-2">
                          {service.client.phone}
                        </Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <>
                          <CarOutlined /> Автомобиль
                        </>
                      }
                    >
                      {service.vehicle.make} {service.vehicle.model},{' '}
                      {service.vehicle.licensePlate}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <>
                          <ClockCircleOutlined /> Дата
                        </>
                      }
                    >
                      {dayjs(service.endTime).format('DD.MM.YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <>
                          <ClockCircleOutlined /> Длительность
                        </>
                      }
                    >
                      {formatDuration(service.startTime, service.endTime)}
                    </Descriptions.Item>
                    {service.receipt && (
                      <Descriptions.Item label="Оплата">
                        <Tag color="blue">
                          {service.receipt.paymentMethod === 'cash' &&
                            'Наличные'}
                          {service.receipt.paymentMethod === 'card' && 'Карта'}
                          {service.receipt.paymentMethod === 'qr' && 'QR-код'}
                        </Tag>
                        <Text type="secondary" className="ml-2">
                          Чек: {service.receipt.number}
                        </Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  {service.serviceStaff && service.serviceStaff.length > 0 && (
                    <div className="mb-3">
                      <Text strong className="flex items-center mb-1">
                        <TeamOutlined className="mr-1" /> Мастера:
                      </Text>
                      <div className="flex flex-wrap gap-1">
                        {service.serviceStaff.map((staffItem) => (
                          <Tag key={staffItem.id} icon={<ToolOutlined />}>
                            {staffItem.staff.lastName}{' '}
                            {staffItem.staff.firstName}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2 justify-between">
                    <div className="flex gap-2">
                      <Tooltip title="Распечатать чек на POS-принтере">
                        <Button
                          type="primary"
                          icon={<PrinterOutlined />}
                          onClick={(e) => {
                            e.stopPropagation(); // Предотвращаем всплытие события клика
                            handlePrintReceipt(service);
                          }}
                        >
                          Печать
                        </Button>
                      </Tooltip>
                      <Tooltip title="Отправить PDF чека по WhatsApp">
                        <Button
                          type="default"
                          icon={<WhatsAppOutlined />}
                          onClick={(e) => {
                            e.stopPropagation(); // Предотвращаем всплытие события клика
                            handleSendReceiptWhatsApp(service);
                          }}
                          disabled={!service.client.phone}
                        >
                          Отправить
                        </Button>
                      </Tooltip>
                    </div>
                    <Button
                      type="link"
                      onClick={(e) => {
                        e.stopPropagation(); // Предотвращаем всплытие события клика
                        handleViewServiceDetails(service);
                      }}
                    >
                      Подробнее →
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="Нет завершенных услуг"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  );
};

export default CompletedServices;
