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
  Modal,
  Input,
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
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import relativeTime from 'dayjs/plugin/relativeTime';

import { getActiveServices, cancelService } from '@/services/cashierApi';

// Инициализация плагинов dayjs
dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Перечисление статусов услуги
enum ServiceStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

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
    discountPercent?: number;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  startTime: string;
  originalPrice: number;
  finalPrice?: number;
  discountPercent?: number;
  status: string;
  serviceStaff: Array<{
    id: string;
    staff: {
      id: string;
      firstName: string;
      lastName: string;
      position: string;
    };
  }>;
}

const ActiveServices: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);

  // Состояния для модального окна отмены услуги
  const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [serviceToCancel, setServiceToCancel] = useState<Service | null>(null);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  const loadActiveServices = async () => {
    if (!shopId) {
      message.error('ID магазина не определен');
      return;
    }

    try {
      setLoading(true);
      const data = await getActiveServices(shopId);
      console.log('Loaded active services:', data);
      setServices(data);
    } catch (error) {
      console.error('Error loading active services:', error);
      message.error('Не удалось загрузить активные услуги');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveServices();
    // Обновляем данные каждые 30 секунд
    const intervalId = setInterval(loadActiveServices, 30000);
    return () => clearInterval(intervalId);
  }, [shopId]);

  const handleCompleteService = (service: Service) => {
    // Сохраняем информацию о выбранной услуге в localStorage для использования на странице завершения
    localStorage.setItem('serviceToComplete', JSON.stringify(service));
    // Перенаправляем на страницу подтверждения завершения услуги
    navigate(`/cashier/${shopId}/service/complete/${service.id}`);
  };

  // Показ модального окна для отмены услуги
  const showCancelModal = (service: Service) => {
    setServiceToCancel(service);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  // Обработка отмены услуги
  const handleCancelService = async () => {
    if (!serviceToCancel || !shopId) return;

    try {
      setCancelLoading(true);

      // Вызываем API для отмены услуги
      await cancelService(shopId, serviceToCancel.id, cancelReason);

      message.success('Услуга успешно отменена');

      // Обновляем список услуг после отмены
      await loadActiveServices();

      // Закрываем модальное окно
      setCancelModalVisible(false);
      setServiceToCancel(null);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling service:', error);
      message.error('Не удалось отменить услугу');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDuration = (startTime: string) => {
    const start = dayjs(startTime);
    const now = dayjs();
    const hours = now.diff(start, 'hour');
    const minutes = now.diff(start, 'minute') % 60;

    return `${hours} ч ${minutes} мин`;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Верхнее навигационное меню */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <Menu
          mode="horizontal"
          selectedKeys={['active']}
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
          <Title level={4}>Активные услуги</Title>
          <Button
            type="primary"
            onClick={() => navigate(`/cashier/${shopId}/select-service`)}
          >
            Новая услуга
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : services.length > 0 ? (
          <Row gutter={[16, 16]}>
            {services.map((service) => (
              <Col xs={24} lg={12} xl={8} key={service.id}>
                <Card
                  className="h-full shadow hover:shadow-lg transition-shadow"
                  hoverable
                >
                  <div className="mb-3 flex justify-between items-start">
                    <div>
                      <Title level={5} className="mb-1">
                        {service.serviceType.name}
                      </Title>
                      <Tag color="processing">В работе</Tag>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      {/* Показываем оригинальную цену в зачеркнутом виде, если есть скидка */}
                      {(service.discountPercent ||
                        service.originalPrice !==
                          (service.finalPrice || service.originalPrice)) && (
                        <div className="mb-1">
                          <Text delete className="text-gray-500">
                            {service.originalPrice} ₸
                          </Text>
                        </div>
                      )}

                      {/* Показываем процент скидки в желтом теге, если есть скидка */}
                      {service.discountPercent ||
                      service.originalPrice !==
                        (service.finalPrice || service.originalPrice) ? (
                        <div className="mb-1">
                          <Tag color="warning">
                            Скидка{' '}
                            {service.discountPercent !== undefined
                              ? service.discountPercent
                              : Math.round(
                                  (1 -
                                    (service.finalPrice ||
                                      service.originalPrice) /
                                      service.originalPrice) *
                                    100
                                )}
                            %
                          </Tag>
                        </div>
                      ) : null}

                      {/* Показываем финальную цену в зеленом теге */}
                      <div>
                        <Tag color="success" className="text-base font-medium">
                          {service.finalPrice || service.originalPrice} ₸
                        </Tag>
                      </div>
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
                          <ClockCircleOutlined /> Начало
                        </>
                      }
                    >
                      {dayjs(service.startTime).format('DD.MM.YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <>
                          <ClockCircleOutlined /> Длительность
                        </>
                      }
                    >
                      {formatDuration(service.startTime)}
                    </Descriptions.Item>
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

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleCompleteService(service)}
                      className="flex-1"
                    >
                      Завершить
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => showCancelModal(service)}
                      className="flex-1"
                    >
                      Отменить
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="Нет активных услуг"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>

      {/* Модальное окно для подтверждения отмены услуги */}
      <Modal
        title={
          <div className="flex items-center text-red-500">
            <ExclamationCircleOutlined className="text-xl mr-2" />
            Отмена услуги
          </div>
        }
        open={cancelModalVisible}
        onOk={handleCancelService}
        onCancel={() => setCancelModalVisible(false)}
        okText="Отменить услугу"
        cancelText="Отмена"
        confirmLoading={cancelLoading}
        okButtonProps={{ danger: true }}
      >
        <Paragraph className="mb-4">
          Вы действительно хотите отменить услугу?
          {serviceToCancel && (
            <div className="font-medium mt-1">
              {serviceToCancel.serviceType.name} для клиента{' '}
              {serviceToCancel.client.lastName}{' '}
              {serviceToCancel.client.firstName}
            </div>
          )}
        </Paragraph>

        <div className="mb-2">
          <Text strong>Укажите причину отмены услуги:</Text>
        </div>
        <TextArea
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Например: по просьбе клиента, услуга не может быть выполнена и т.д."
        />
      </Modal>
    </div>
  );
};

export default ActiveServices;
