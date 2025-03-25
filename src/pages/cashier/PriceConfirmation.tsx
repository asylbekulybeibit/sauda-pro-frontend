import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Spin,
  Menu,
  message,
  InputNumber,
  Form,
  Row,
  Col,
  Tag,
  Divider,
  Modal,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PieChartOutlined,
  ArrowLeftOutlined,
  PercentageOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { createService } from '@/services/cashierApi';

const { Title, Text } = Typography;

/**
 * Страница проверки и редактирования цены перед созданием услуги
 */
const PriceConfirmation: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [originalPrice, setOriginalPrice] = useState<number>(0);

  // Загрузка данных заказа из localStorage
  useEffect(() => {
    const storedOrderData = localStorage.getItem('newOrder');
    if (storedOrderData) {
      try {
        const parsedOrderData = JSON.parse(storedOrderData);
        setOrderData(parsedOrderData);

        // Установка начальной цены услуги
        if (parsedOrderData.service && parsedOrderData.service.price) {
          const initialPrice = Number(parsedOrderData.service.price);
          console.log(
            '[PriceConfirmation] Setting initial price:',
            initialPrice,
            'type:',
            typeof initialPrice
          );
          setPrice(initialPrice);
          setOriginalPrice(initialPrice);
          form.setFieldsValue({ price: initialPrice });
        } else {
          // Если цена не задана в услуге, устанавливаем 0
          console.log(
            '[PriceConfirmation] No price found in service, setting default 0'
          );
          setPrice(0);
          setOriginalPrice(0);
          form.setFieldsValue({ price: 0 });
        }

        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке данных заказа:', error);
        message.error('Не удалось загрузить данные заказа');
        navigate(`/cashier/${shopId}/select-service`);
      }
    } else {
      message.error('Не найдены данные заказа');
      navigate(`/cashier/${shopId}/select-service`);
    }
  }, [shopId, navigate, form]);

  // Обработчик возврата к выбору мастеров
  const handleBack = () => {
    navigate(`/cashier/${shopId}/select-technician`);
  };

  // Применить скидку клиента
  const applyDiscount = () => {
    if (orderData && orderData.client && orderData.client.discountPercent) {
      const discountPercent = Number(orderData.client.discountPercent);
      console.log(
        '[PriceConfirmation] Applying discount:',
        discountPercent,
        '%, originalPrice:',
        originalPrice
      );

      // Убедимся, что originalPrice - число
      const numericOriginalPrice = Number(originalPrice);
      const discountedPrice =
        numericOriginalPrice * (1 - discountPercent / 100);

      console.log(
        '[PriceConfirmation] Calculated discounted price:',
        discountedPrice
      );
      setPrice(discountedPrice);
      form.setFieldsValue({ price: discountedPrice });
      setDiscountApplied(true);
      message.success(`Скидка ${discountPercent}% успешно применена`);
    } else {
      message.info('У клиента нет скидки или клиент не выбран');
    }
  };

  // Обработчик изменения цены вручную
  const handlePriceChange = (value: number | null) => {
    if (value !== null) {
      console.log(
        '[PriceConfirmation] Price changed to:',
        value,
        'type:',
        typeof value
      );
      const numericValue = Number(value);
      setPrice(numericValue);
      if (numericValue !== originalPrice) {
        setDiscountApplied(false);
      }
    } else {
      console.log(
        '[PriceConfirmation] Received null value for price, setting default 0'
      );
      setPrice(0);
    }
  };

  // Функция для проверки валидности UUID
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Создание услуги и переход к активным услугам
  const handleStartService = async () => {
    if (!orderData) {
      message.error('Не найдены данные заказа');
      return;
    }

    if (!shopId) {
      message.error('Не указан идентификатор магазина');
      return;
    }

    try {
      setSubmitting(true);

      // Проверяем наличие всех необходимых данных
      const { service, client, vehicle, technicians } = orderData;

      if (!service || !service.id) {
        throw new Error('Не выбрана услуга');
      }

      if (!vehicle || !vehicle.id) {
        throw new Error('Не выбран автомобиль');
      }

      // Извлекаем и валидируем идентификаторы выбранных технических специалистов
      let technicianIds: string[] = [];

      if (Array.isArray(technicians) && technicians.length > 0) {
        // Фильтруем только валидные UUID
        technicianIds = technicians
          .map((tech: any) => tech.id)
          .filter((id: string) => typeof id === 'string' && isValidUUID(id));

        console.log('[PriceConfirmation] Valid technician IDs:', technicianIds);
      }

      // Рассчитываем процент скидки, если цена изменилась
      let discountPercent = 0;
      if (price < originalPrice) {
        discountPercent = Math.round((1 - price / originalPrice) * 100);
        console.log(
          `[PriceConfirmation] Calculated discount: ${discountPercent}%`
        );
      }

      console.log('[PriceConfirmation] shopId from URL:', shopId);

      // Проверяем типы переменных перед созданием объекта
      console.log('[PriceConfirmation] Variable types check:', {
        originalPrice: `${originalPrice} (${typeof originalPrice})`,
        price: `${price} (${typeof price})`,
        discountPercent: `${discountPercent} (${typeof discountPercent})`,
      });

      // Подготавливаем данные для создания услуги
      const serviceData = {
        shopId: shopId, // Явно передаем ID магазина из URL
        clientId: client?.id || '',
        vehicleId: vehicle.id,
        serviceTypeId: service.id,
        originalPrice: Number(originalPrice), // Явно преобразуем в число
        finalPrice: Number(price), // Явно преобразуем в число
        discountPercent: Number(discountPercent), // Явно преобразуем в число
        staffIds: technicianIds, // Передаем массив ID технических специалистов
        comment: orderData.comment || '',
      };

      console.log(
        '[PriceConfirmation] Отправляем запрос на создание услуги:',
        serviceData
      );

      // Вызываем API для создания услуги
      const result = await createService(serviceData);

      // Показываем сообщение об успешном создании
      Modal.success({
        title: 'Услуга успешно создана',
        content: (
          <div>
            <p>
              Услуга "{service.name}" успешно добавлена в список активных услуг.
            </p>
            <p>Номер заказа: {result.id}</p>
          </div>
        ),
        onOk: () => {
          // Очищаем данные о создаваемой услуге
          localStorage.removeItem('newOrder');
          // Переходим к списку активных услуг
          navigate(`/cashier/${shopId}/service/active`);
        },
      });
    } catch (error) {
      console.error('Ошибка при создании услуги:', error);
      message.error(
        'Не удалось создать услугу. Пожалуйста, проверьте данные и попробуйте снова.'
      );
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex-1 overflow-auto p-4">
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
              Проверьте цену
            </Title>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            onClick={handleStartService}
            loading={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            Начать услугу
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Загрузка данных..." />
          </div>
        ) : (
          <>
            {/* Информация о заказе */}
            <Card className="mb-4 bg-blue-50">
              <Title level={5}>Информация о заказе</Title>

              <Row gutter={[16, 8]}>
                <Col xs={24} md={12}>
                  <p>
                    <strong>Услуга:</strong> {orderData?.service?.name}
                  </p>
                  {orderData?.service?.duration && (
                    <p>
                      <strong>Приблизительное время:</strong>{' '}
                      {orderData.service.duration} мин.
                    </p>
                  )}
                </Col>

                <Col xs={24} md={12}>
                  {orderData?.client && (
                    <p>
                      <strong>Клиент:</strong> {orderData.client.firstName}{' '}
                      {orderData.client.lastName}
                      {orderData.client.discountPercent > 0 && (
                        <Tag color="green" className="ml-2">
                          Скидка {orderData.client.discountPercent}%
                        </Tag>
                      )}
                    </p>
                  )}

                  {orderData?.vehicle && (
                    <p>
                      <strong>Автомобиль:</strong> {orderData.vehicle.brand}{' '}
                      {orderData.vehicle.model}{' '}
                      <span className="text-gray-600">
                        {orderData.vehicle.licensePlate}
                      </span>
                    </p>
                  )}
                </Col>
              </Row>

              {orderData?.technicians && orderData.technicians.length > 0 && (
                <>
                  <Divider className="my-3" />
                  <p>
                    <strong>Выбранные мастера:</strong>{' '}
                    {orderData.technicians
                      .map((tech: any) => `${tech.lastName} ${tech.firstName}`)
                      .join(', ')}
                  </p>
                </>
              )}
            </Card>

            {/* Форма с ценой */}
            <Card className="mb-4">
              <Form form={form} layout="vertical" initialValues={{ price }}>
                <Row gutter={16} align="middle">
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      name="price"
                      label={
                        <span className="text-lg font-medium">
                          💰 Цена услуги
                        </span>
                      }
                      rules={[
                        {
                          required: true,
                          message: 'Пожалуйста, укажите цену',
                        },
                        {
                          type: 'number',
                          min: 1,
                          message: 'Цена должна быть больше нуля',
                        },
                      ]}
                    >
                      <InputNumber
                        className="w-full"
                        size="large"
                        addonAfter="₸"
                        step={100}
                        min={1}
                        onChange={handlePriceChange}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12} md={8}>
                    <Button
                      type="primary"
                      icon={<PercentageOutlined />}
                      onClick={applyDiscount}
                      disabled={
                        !orderData?.client ||
                        !orderData?.client?.discountPercent ||
                        discountApplied
                      }
                      className="mt-8"
                    >
                      Применить скидку
                    </Button>
                  </Col>
                </Row>

                {discountApplied && (
                  <div className="mt-2">
                    <Tag color="green">
                      Скидка {orderData?.client?.discountPercent}% применена
                    </Tag>
                    <Text className="ml-2 text-gray-500">
                      Изначальная цена: <Text delete>{originalPrice} ₸</Text>
                    </Text>
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded mt-4">
                  <p className="text-blue-700 mb-0">
                    <strong>Совет:</strong> Вы можете изменить цену вручную или
                    применить скидку клиента (если она доступна). После проверки
                    цены нажмите "Начать услугу".
                  </p>
                </div>
              </Form>
            </Card>

            <Card className="text-center py-6">
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={handleStartService}
                loading={submitting}
                className="bg-green-600 hover:bg-green-700 h-12 px-8 text-lg"
              >
                Начать услугу
              </Button>
              <p className="text-gray-500 mt-3">
                После нажатия "Начать услугу" заказ будет создан и отобразится в
                разделе "Активные услуги"
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceConfirmation;
