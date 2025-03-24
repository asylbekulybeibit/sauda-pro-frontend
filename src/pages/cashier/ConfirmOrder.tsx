import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  Spin,
  Divider,
  Result,
  Menu,
  message,
  Input,
  Form,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  UserOutlined,
  CarOutlined,
  TagOutlined,
  FieldTimeOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { createService } from '@/services/cashierApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Интерфейс для данных заказа
interface OrderData {
  service: {
    id: string;
    name: string;
    price: number;
    category: string;
    duration?: number;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    discountPercent?: number;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year?: number;
    licensePlate: string;
    color?: string;
    vin?: string;
  };
  shopId: string;
  createdAt: string;
}

/**
 * Страница подтверждения заказа (финальный шаг)
 */
const ConfirmOrder: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);

  // Форма для комментария к заказу
  const [form] = Form.useForm();

  // Загрузка данных заказа из localStorage
  useEffect(() => {
    try {
      const storedOrderData = localStorage.getItem('newOrder');
      if (storedOrderData) {
        setOrderData(JSON.parse(storedOrderData));
      } else {
        setError('Не удалось загрузить данные заказа');
      }
    } catch (err) {
      console.error('Ошибка при загрузке данных заказа:', err);
      setError('Ошибка при обработке данных заказа');
    } finally {
      setLoading(false);
    }
  }, []);

  // Обработчик возврата к выбору автомобиля
  const handleBack = () => {
    navigate(`/cashier/${shopId}/select-vehicle`);
  };

  // Обработчик создания заказа
  const handleCreateOrder = async (values: { comment?: string }) => {
    if (!orderData) {
      message.error('Отсутствуют данные заказа');
      return;
    }

    try {
      setCreating(true);

      // Создаем услугу через API
      const response = await createService({
        shopId: orderData.shopId,
        clientId: orderData.client.id,
        vehicleId: orderData.vehicle.id,
        serviceTypeId: orderData.service.id,
        comment: values.comment || '',
      });

      setServiceId(response.id);

      // Очищаем данные из localStorage
      localStorage.removeItem('selectedService');
      localStorage.removeItem('selectedClient');
      localStorage.removeItem('selectedVehicle');
      localStorage.removeItem('newOrder');

      setSuccess(true);
      message.success('Заказ успешно создан');
    } catch (err) {
      console.error('Ошибка при создании заказа:', err);
      message.error('Не удалось создать заказ');
    } finally {
      setCreating(false);
    }
  };

  // Обработчик перехода к активным услугам
  const handleViewActiveServices = () => {
    navigate(`/cashier/${shopId}/active-services`);
  };

  // Обработчик начала новой услуги
  const handleStartNewService = () => {
    navigate(`/cashier/${shopId}/select-service`);
  };

  // Обработчик перехода к созданной услуге
  const handleViewCreatedService = () => {
    if (serviceId) {
      navigate(`/cashier/${shopId}/service/${serviceId}`);
    }
  };

  // Рендер содержимого страницы в зависимости от состояния
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" tip="Загрузка данных заказа..." />
        </div>
      );
    }

    if (error) {
      return (
        <Result
          status="error"
          title="Ошибка"
          subTitle={error}
          extra={[
            <Button
              key="back"
              onClick={() => navigate(`/cashier/${shopId}/select-service`)}
            >
              Вернуться к выбору услуги
            </Button>,
          ]}
        />
      );
    }

    if (success) {
      return (
        <Result
          status="success"
          title="Заказ успешно создан!"
          subTitle={`Услуга "${orderData?.service.name}" для клиента ${orderData?.client.lastName} ${orderData?.client.firstName} успешно создана.`}
          extra={[
            <Button
              key="view"
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleViewCreatedService}
            >
              Просмотреть услугу
            </Button>,
            <Button key="active" onClick={handleViewActiveServices}>
              Активные услуги
            </Button>,
            <Button key="new" onClick={handleStartNewService}>
              Начать новую услугу
            </Button>,
          ]}
        />
      );
    }

    if (!orderData) {
      return (
        <Result
          status="warning"
          title="Отсутствуют данные заказа"
          extra={[
            <Button
              key="back"
              onClick={() => navigate(`/cashier/${shopId}/select-service`)}
            >
              Вернуться к выбору услуги
            </Button>,
          ]}
        />
      );
    }

    return (
      <Form form={form} onFinish={handleCreateOrder} layout="vertical">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mr-4"
            >
              Назад
            </Button>
            <Title level={4} className="m-0">
              Подтверждение заказа
            </Title>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            htmlType="submit"
            loading={creating}
          >
            {creating ? 'Создание заказа...' : 'Создать заказ'}
          </Button>
        </div>

        <Card className="mb-6">
          <Title level={5} className="flex items-center mb-4">
            <TagOutlined className="mr-2" /> Услуга
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={24} md={12}>
              <Text strong>Наименование: </Text>
              <Text>{orderData.service.name}</Text>
            </Col>
            <Col span={24} md={12}>
              <Text strong>Категория: </Text>
              <Text>{orderData.service.category}</Text>
            </Col>
            <Col span={24} md={12}>
              <Text strong>Стоимость: </Text>
              <Text className="text-lg">{orderData.service.price} ₽</Text>
            </Col>
            {orderData.service.duration && (
              <Col span={24} md={12}>
                <Text strong>Примерное время: </Text>
                <Text>{orderData.service.duration} мин.</Text>
              </Col>
            )}
          </Row>
        </Card>

        <Card className="mb-6">
          <Title level={5} className="flex items-center mb-4">
            <UserOutlined className="mr-2" /> Клиент
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={24} md={12}>
              <Text strong>Имя: </Text>
              <Text>
                {orderData.client.lastName} {orderData.client.firstName}
              </Text>
            </Col>
            <Col span={24} md={12}>
              <Text strong>Телефон: </Text>
              <Text>{orderData.client.phone}</Text>
            </Col>
            {orderData.client.email && (
              <Col span={24} md={12}>
                <Text strong>Email: </Text>
                <Text>{orderData.client.email}</Text>
              </Col>
            )}
            {orderData.client.discountPercent &&
              orderData.client.discountPercent > 0 && (
                <Col span={24} md={12}>
                  <Text strong>Скидка: </Text>
                  <Text>{orderData.client.discountPercent}%</Text>
                </Col>
              )}
          </Row>
        </Card>

        <Card className="mb-6">
          <Title level={5} className="flex items-center mb-4">
            <CarOutlined className="mr-2" /> Автомобиль
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={24} md={12}>
              <Text strong>Марка и модель: </Text>
              <Text>
                {orderData.vehicle.brand} {orderData.vehicle.model}
              </Text>
            </Col>
            {orderData.vehicle.year && (
              <Col span={24} md={12}>
                <Text strong>Год выпуска: </Text>
                <Text>{orderData.vehicle.year}</Text>
              </Col>
            )}
            <Col span={24} md={12}>
              <Text strong>Гос. номер: </Text>
              <Text>{orderData.vehicle.licensePlate}</Text>
            </Col>
            {orderData.vehicle.color && (
              <Col span={24} md={12}>
                <Text strong>Цвет: </Text>
                <Text>{orderData.vehicle.color}</Text>
              </Col>
            )}
            {orderData.vehicle.vin && (
              <Col span={24} md={12}>
                <Text strong>VIN: </Text>
                <Text>{orderData.vehicle.vin}</Text>
              </Col>
            )}
          </Row>
        </Card>

        <Card className="mb-6">
          <Title level={5} className="flex items-center mb-4">
            <FieldTimeOutlined className="mr-2" /> Информация о заказе
          </Title>
          <Row gutter={[16, 16]}>
            <Col span={24} md={12}>
              <Text strong>Дата создания: </Text>
              <Text>{new Date().toLocaleString()}</Text>
            </Col>
            <Col span={24} md={12}>
              <Text strong>Статус: </Text>
              <Text>Новый</Text>
            </Col>
            <Col span={24}>
              <Form.Item
                name="comment"
                label={
                  <span className="flex items-center">
                    <CommentOutlined className="mr-2" /> Комментарий к заказу
                  </span>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="Введите комментарий или дополнительную информацию по заказу"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        <div className="flex justify-between items-center mb-6">
          <div>
            <Text strong>Итоговая стоимость:</Text>
          </div>
          <div className="text-right">
            <Text className="text-xl font-bold">
              {orderData.client.discountPercent &&
              orderData.client.discountPercent > 0
                ? orderData.service.price *
                  (1 - orderData.client.discountPercent / 100)
                : orderData.service.price}{' '}
              ₽
            </Text>
            {orderData.client.discountPercent &&
              orderData.client.discountPercent > 0 && (
                <div className="text-green-600">
                  <Text>Скидка {orderData.client.discountPercent}%:</Text>{' '}
                  <Text>
                    -
                    {(
                      (orderData.service.price *
                        orderData.client.discountPercent) /
                      100
                    ).toFixed(2)}{' '}
                    ₽
                  </Text>
                </div>
              )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="default"
            size="large"
            onClick={handleBack}
            className="mr-4"
          >
            Вернуться назад
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            htmlType="submit"
            loading={creating}
          >
            {creating ? 'Создание заказа...' : 'Создать заказ'}
          </Button>
        </div>
      </Form>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Верхнее навигационное меню */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <Menu
          mode="horizontal"
          selectedKeys={['start']}
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
            onClick={() => navigate(`/cashier/${shopId}/active-services`)}
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
      <div className="flex-1 overflow-auto p-4">{renderContent()}</div>

      {/* Нижняя плавающая кнопка для мобильных устройств */}
      {!loading && !error && !success && orderData && (
        <div className="sticky bottom-0 bg-white shadow-lg p-4 border-t border-gray-200 md:hidden">
          <Button
            type="primary"
            size="large"
            block
            icon={<CheckOutlined />}
            onClick={() => form.submit()}
            loading={creating}
          >
            {creating ? 'Создание заказа...' : 'Создать заказ'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConfirmOrder;
