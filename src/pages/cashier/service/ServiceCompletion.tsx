import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Spin,
  Descriptions,
  message,
  Tag,
  Divider,
  Avatar,
  Menu,
  InputNumber,
  Form,
  Space,
  Modal,
  Empty,
} from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  CarOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  PieChartOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  MoneyCollectOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  WalletOutlined,
  BankOutlined,
  ShakeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  completeService,
  getCashRegisters,
  getCurrentShift,
} from '@/services/cashierApi';
import {
  CashRegister,
  PaymentMethodType,
  RegisterPaymentMethod,
} from '@/types/cash-register';

// Инициализация плагинов dayjs
dayjs.extend(relativeTime);
dayjs.locale('ru');

const { Title, Text, Paragraph } = Typography;

interface PaymentOption {
  key: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

// Интерфейс для типа услуги
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
  initialPrice: number;
  finalPrice?: number;
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

/**
 * Функция для получения иконки метода оплаты по его типу
 */
const getPaymentMethodIcon = (type?: PaymentMethodType | string) => {
  switch (type) {
    case PaymentMethodType.CASH:
      return <DollarOutlined style={{ fontSize: 36 }} />;
    case PaymentMethodType.CARD:
      return <CreditCardOutlined style={{ fontSize: 36 }} />;
    case PaymentMethodType.QR:
      return <QrcodeOutlined style={{ fontSize: 36 }} />;
    default:
      return <BankOutlined style={{ fontSize: 36 }} />;
  }
};

/**
 * Функция для получения цвета метода оплаты по его типу
 */
const getPaymentMethodColor = (type?: PaymentMethodType | string) => {
  switch (type) {
    case PaymentMethodType.CASH:
      return 'green';
    case PaymentMethodType.CARD:
      return 'blue';
    case PaymentMethodType.QR:
      return 'purple';
    default:
      return 'cyan';
  }
};

/**
 * Страница подтверждения завершения услуги
 */
const ServiceCompletion: React.FC = () => {
  const { shopId, serviceId } = useParams<{
    shopId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cashierName, setCashierName] = useState<string>('Текущий кассир');
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(
    null
  );
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(
    null
  );
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] =
    useState<boolean>(true);
  const [cashReceived, setCashReceived] = useState<number | null>(null);
  const [isCashPayment, setIsCashPayment] = useState<boolean>(false);

  // Загружаем информацию о доступных кассах и методах оплаты
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!shopId) {
        message.error('ID магазина не определен');
        return;
      }

      try {
        setLoadingPaymentMethods(true);
        console.log('[ServiceCompletion] Загрузка касс для магазина:', shopId);

        // Получаем список всех доступных касс магазина
        const registers = await getCashRegisters(shopId);
        console.log('[ServiceCompletion] Получены кассы:', registers);

        if (!registers || registers.length === 0) {
          console.warn('[ServiceCompletion] Кассы не найдены');
          throw new Error('Не найдены доступные кассы');
        }

        // В качестве текущей кассы выберем первую активную
        const activeRegister = registers.find(
          (register) => register.status === 'active'
        );

        if (!activeRegister) {
          console.warn('[ServiceCompletion] Активные кассы не найдены');
          throw new Error('Активная касса не найдена');
        }

        setCurrentRegister(activeRegister);
        console.log('[ServiceCompletion] Используем кассу:', activeRegister);

        // Проверим наличие методов оплаты у выбранной кассы
        if (
          !activeRegister.paymentMethods ||
          !Array.isArray(activeRegister.paymentMethods) ||
          activeRegister.paymentMethods.length === 0
        ) {
          console.warn('[ServiceCompletion] У кассы нет методов оплаты');
          throw new Error('У кассы нет доступных методов оплаты');
        }

        // Предполагаем, что payment methods в активном регистре имеют тип RegisterPaymentMethod[]
        // а не PaymentMethod[]. Это позволяет избежать конфликта типов.
        const paymentMethodsFromRegister =
          activeRegister.paymentMethods as unknown as RegisterPaymentMethod[];

        // Фильтруем только активные методы оплаты
        const activePaymentMethods = paymentMethodsFromRegister.filter(
          (method) => method.isActive
        );

        console.log(
          '[ServiceCompletion] Активные методы оплаты:',
          activePaymentMethods
        );

        if (activePaymentMethods.length === 0) {
          console.warn(
            '[ServiceCompletion] У кассы нет активных методов оплаты'
          );
          throw new Error('У кассы нет активных методов оплаты');
        }

        // Создаем опции оплаты напрямую из методов оплаты кассы
        const options: PaymentOption[] = activePaymentMethods.map(
          (method: RegisterPaymentMethod) => {
            let title, description, type;

            // Определяем тип метода оплаты
            if (method.systemType === PaymentMethodType.CASH) {
              type = PaymentMethodType.CASH;
              title = method.name || 'Наличные';
              description = method.description || 'Оплата наличными деньгами';
            } else if (method.systemType === PaymentMethodType.CARD) {
              type = PaymentMethodType.CARD;
              title = method.name || 'Банковская карта';
              description =
                method.description || 'Оплата банковской картой через терминал';
            } else if (method.systemType === PaymentMethodType.QR) {
              type = PaymentMethodType.QR;
              title = method.name || 'QR-код / Kaspi Pay';
              description =
                method.description || 'Оплата через сканирование QR-кода';
            } else {
              type = method.systemType || 'other';
              title = method.name || 'Другой метод';
              description = method.description || 'Другой метод оплаты';
            }

            return {
              key: method.id,
              title,
              description,
              icon: getPaymentMethodIcon(type),
              color: getPaymentMethodColor(type),
            };
          }
        );

        console.log(
          '[ServiceCompletion] Подготовленные опции оплаты из данных API:',
          options
        );
        setPaymentOptions(options);
      } catch (error) {
        console.error(
          '[ServiceCompletion] Ошибка при загрузке методов оплаты:',
          error
        );
        message.error(
          'Не удалось загрузить методы оплаты. Возможно, у кассы нет активных методов оплаты.'
        );
        setPaymentOptions([]);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    loadPaymentMethods();
  }, [shopId]);

  // Загружаем информацию о услуге из localStorage
  useEffect(() => {
    try {
      const serviceData = localStorage.getItem('serviceToComplete');
      if (serviceData) {
        const parsedService = JSON.parse(serviceData);
        setService(parsedService);

        // Устанавливаем начальное значение стоимости
        form.setFieldsValue({
          finalPrice: parsedService.initialPrice,
        });
      } else {
        message.error('Информация об услуге не найдена');
        navigate(`/cashier/${shopId}/service/active`);
      }

      // Получаем имя кассира (в реальном приложении можно получить из контекста или API)
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        if (parsedUserInfo.firstName && parsedUserInfo.lastName) {
          setCashierName(
            `${parsedUserInfo.lastName} ${parsedUserInfo.firstName}`
          );
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading service data:', error);
      message.error('Ошибка при загрузке данных услуги');
      navigate(`/cashier/${shopId}/service/active`);
    }
  }, [shopId, serviceId, navigate, form]);

  // Следим за изменением цены и рассчитываем скидку
  useEffect(() => {
    const finalPrice = form.getFieldValue('finalPrice');
    if (service && finalPrice && finalPrice < service.initialPrice) {
      const discount = Math.round(
        (1 - finalPrice / service.initialPrice) * 100
      );
      setDiscountPercentage(discount);
    } else {
      setDiscountPercentage(null);
    }
  }, [form.getFieldValue('finalPrice'), service]);

  // Обработчик отмены
  const handleCancel = () => {
    navigate(`/cashier/${shopId}/service/active`);
  };

  // Обработчик выбора метода оплаты
  const handleSelectPaymentMethod = (methodId: string) => {
    setSelectedMethod(methodId);

    // Проверяем, является ли выбранный метод оплаты наличными
    const selectedPaymentOption = paymentOptions.find(
      (option) => option.key === methodId
    );
    const isCash =
      selectedPaymentOption?.color === 'green' ||
      selectedPaymentOption?.title.toLowerCase().includes('наличные');

    // Исправляем ошибку с типом - убедимся, что передаем boolean
    setIsCashPayment(isCash || false);

    // Если выбран не наличный метод оплаты, сбрасываем значение введенной суммы
    if (!isCash) {
      setCashReceived(null);
    }
  };

  // Обработчик изменения суммы, полученной от клиента
  const handleCashReceivedChange = (value: number | null) => {
    setCashReceived(value);
  };

  // Расчет сдачи
  const calculateChange = (): number => {
    if (!cashReceived || !service) return 0;

    // Безопасное получение finalPrice, преобразование к числу
    let finalPrice = service.finalPrice || service.initialPrice;

    if (typeof finalPrice !== 'number') {
      finalPrice = Number(finalPrice);

      // Если после преобразования получилось NaN, используем initialPrice
      if (isNaN(finalPrice)) {
        finalPrice =
          typeof service.initialPrice === 'number'
            ? service.initialPrice
            : Number(service.initialPrice) || 0;
      }
    }

    // Гарантируем, что не будет отрицательной сдачи
    return Math.max(0, cashReceived - finalPrice);
  };

  // Обработчик подтверждения
  const handleConfirm = () => {
    if (!selectedMethod) {
      message.warning('Пожалуйста, выберите метод оплаты');
      return;
    }

    // Дополнительная проверка для оплаты наличными
    if (isCashPayment) {
      if (!cashReceived) {
        message.warning('Пожалуйста, введите полученную сумму');
        return;
      }

      const finalPrice = service?.finalPrice || service?.initialPrice || 0;
      if (cashReceived < finalPrice) {
        message.warning('Полученная сумма меньше стоимости услуги');
        return;
      }
    }

    form
      .validateFields()
      .then((values) => {
        if (service) {
          // Показываем модальное окно подтверждения
          setConfirmModalVisible(true);
        }
      })
      .catch((error) => {
        console.error('Validation failed:', error);
      });
  };

  // Обработчик подтверждения в модальном окне
  const handleModalConfirm = async () => {
    if (!service || !selectedMethod) return;

    try {
      setSubmitting(true);

      // Получаем тип метода оплаты из выбранного метода
      const selectedPaymentMethod = paymentOptions.find(
        (method) => method.key === selectedMethod
      );

      // Получаем и проверяем finalPrice
      let finalPrice = service.finalPrice || service.initialPrice;

      // Убеждаемся, что finalPrice - положительное число
      if (typeof finalPrice !== 'number') {
        finalPrice = Number(finalPrice);
      }

      // Если после преобразования получилось NaN или отрицательное значение,
      // используем initialPrice
      if (isNaN(finalPrice) || finalPrice < 0) {
        finalPrice = service.initialPrice;
        console.warn(
          '[ServiceCompletion] Исправлено некорректное значение finalPrice на initialPrice:',
          finalPrice
        );
      }

      // Проверяем еще раз, что finalPrice > 0
      if (finalPrice <= 0) {
        throw new Error('Итоговая сумма должна быть больше нуля');
      }

      // Добавляем данные о полученной сумме и сдаче в консольный вывод для отладки
      console.log('[ServiceCompletion] Подтверждение оплаты:', {
        serviceId: service.id,
        finalPrice: finalPrice,
        paymentMethod: selectedMethod,
        cashReceived: isCashPayment ? cashReceived : undefined,
        change: isCashPayment ? calculateChange() : undefined,
      });

      // Вызов API для завершения услуги с проверенным finalPrice
      await completeService(shopId || '', {
        serviceId: service.id,
        finalPrice: finalPrice,
        paymentMethod: selectedMethod,
      });

      message.success('Услуга успешно завершена!');

      // Переход на страницу с деталями завершенной услуги
      navigate(`/cashier/${shopId}/service/receipt/${service.id}`);
    } catch (error) {
      console.error('Error completing service:', error);
      message.error('Не удалось завершить услугу');
    } finally {
      setSubmitting(false);
      setConfirmModalVisible(false);
    }
  };

  // Обработчик отмены в модальном окне
  const handleModalCancel = () => {
    setConfirmModalVisible(false);
  };

  // Форматирование продолжительности услуги
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
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-3 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
            className="mr-3"
          >
            Назад
          </Button>
          <Title level={4} className="m-0">
            Подтверждение завершения услуги
          </Title>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spin size="large" />
          </div>
        ) : service ? (
          <>
            {/* Разместим карточку услуги и методы оплаты рядом на больших экранах */}
            <Row gutter={[12, 12]}>
              {/* Карточка услуги */}
              <Col xs={24} lg={12}>
                <Card
                  className="shadow-sm h-full"
                  bodyStyle={{ padding: '12px' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Title level={5} className="mb-1">
                        {service.serviceType.name}
                      </Title>
                      <Tag color="processing">Завершение</Tag>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end">
                        <Title
                          level={4}
                          className="m-0"
                          style={{ marginRight: '4px' }}
                        >
                          {service.initialPrice}
                        </Title>
                        <Text strong style={{ fontSize: '16px' }}>
                          ₸
                        </Text>
                      </div>
                      {service.client.discountPercent &&
                        service.client.discountPercent > 0 && (
                          <Tag color="orange" className="mt-1">
                            Скидка клиента: {service.client.discountPercent}%
                          </Tag>
                        )}
                    </div>
                  </div>

                  <Descriptions
                    column={{ xs: 1, sm: 2 }}
                    layout="horizontal"
                    size="small"
                  >
                    <Descriptions.Item
                      label={
                        <Space>
                          <UserOutlined /> Клиент
                        </Space>
                      }
                    >
                      {service.client.lastName} {service.client.firstName}
                      <div className="text-gray-500 text-sm">
                        {service.client.phone}
                      </div>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={
                        <Space>
                          <CarOutlined /> Автомобиль
                        </Space>
                      }
                    >
                      {service.vehicle.make} {service.vehicle.model},
                      <div className="text-gray-500 text-sm">
                        {service.vehicle.licensePlate}
                      </div>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={
                        <Space>
                          <ClockCircleOutlined /> Начало
                        </Space>
                      }
                    >
                      {dayjs(service.startTime).format('DD.MM.YYYY HH:mm')}
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={
                        <Space>
                          <ClockCircleOutlined /> Длительность
                        </Space>
                      }
                    >
                      {formatDuration(service.startTime)}
                    </Descriptions.Item>
                  </Descriptions>

                  {service.serviceStaff && service.serviceStaff.length > 0 && (
                    <div className="mt-2">
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

                  <Divider className="my-2" />

                  {currentRegister && (
                    <div className="mt-2">
                      <Text strong className="flex items-center mb-1">
                        <BankOutlined className="mr-1" /> Касса:
                      </Text>
                      <Tag color="blue">{currentRegister.name}</Tag>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Методы оплаты */}
              <Col xs={24} lg={12}>
                <Card
                  className="shadow-sm h-full"
                  bodyStyle={{ padding: '12px' }}
                >
                  <Title level={5}>Выберите метод оплаты</Title>

                  {loadingPaymentMethods ? (
                    <div className="flex justify-center py-4">
                      <Spin size="default" tip="Загрузка методов оплаты..." />
                    </div>
                  ) : paymentOptions.length > 0 ? (
                    <Row gutter={[12, 12]} className="mt-2">
                      {paymentOptions.map((method) => (
                        <Col xs={24} sm={12} key={method.key}>
                          <Card
                            hoverable
                            className={`h-full transition-all ${
                              selectedMethod === method.key
                                ? 'border-2 border-blue-500 shadow-md'
                                : ''
                            }`}
                            onClick={() =>
                              handleSelectPaymentMethod(method.key)
                            }
                            style={{
                              borderTop: `5px solid ${
                                method.color === 'green'
                                  ? '#52c41a'
                                  : method.color === 'blue'
                                  ? '#1890ff'
                                  : method.color === 'purple'
                                  ? '#722ed1'
                                  : method.color === 'cyan'
                                  ? '#13c2c2'
                                  : method.color === 'orange'
                                  ? '#fa8c16'
                                  : '#f5222d'
                              }`,
                            }}
                            bodyStyle={{ padding: '10px' }}
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className="mb-1">
                                {selectedMethod === method.key ? (
                                  <div className="relative">
                                    {React.cloneElement(
                                      method.icon as React.ReactElement,
                                      {
                                        style: { fontSize: 30 },
                                      }
                                    )}
                                    <CheckCircleOutlined
                                      className="absolute -top-2 -right-2 text-blue-500"
                                      style={{ fontSize: 16 }}
                                    />
                                  </div>
                                ) : (
                                  React.cloneElement(
                                    method.icon as React.ReactElement,
                                    {
                                      style: { fontSize: 30 },
                                    }
                                  )
                                )}
                              </div>
                              <div className="font-medium">{method.title}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {method.description}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <Empty description="Нет доступных методов оплаты" />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Итоговая сумма */}
            <Card className="my-3 shadow-sm" bodyStyle={{ padding: '12px' }}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <Title level={4} className="m-0">
                    Итоговая сумма
                  </Title>
                  {service.finalPrice !== service.initialPrice && (
                    <div className="mt-1 flex items-center">
                      <Text delete className="text-gray-500">
                        {service.initialPrice} ₸
                      </Text>
                      {service.initialPrice && service.finalPrice && (
                        <Tag color="green" className="ml-2">
                          -
                          {Math.round(
                            (1 - service.finalPrice / service.initialPrice) *
                              100
                          )}
                          %
                        </Tag>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {isCashPayment ? (
                    <div className="flex items-center justify-end">
                      <InputNumber
                        size="large"
                        min={0}
                        precision={0}
                        addonAfter="₸"
                        placeholder="Введите сумму"
                        value={cashReceived}
                        onChange={handleCashReceivedChange}
                        style={{ width: '160px', marginRight: '10px' }}
                      />
                      <Title
                        level={3}
                        className="m-0 text-success"
                        style={{ color: '#52c41a' }}
                      >
                        {service.finalPrice || service.initialPrice} ₸
                      </Title>
                    </div>
                  ) : (
                    <Title
                      level={3}
                      className="m-0 text-success"
                      style={{ color: '#52c41a' }}
                    >
                      {service.finalPrice || service.initialPrice} ₸
                    </Title>
                  )}
                </div>
              </div>

              {/* Показываем информацию о сдаче, если выбран метод оплаты наличными */}
              {isCashPayment && cashReceived !== null && (
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-end">
                  {cashReceived >=
                  (service.finalPrice || service.initialPrice) ? (
                    <div className="text-right">
                      <Text strong>Сдача: </Text>
                      <Title level={4} type="success" className="m-0 inline">
                        {calculateChange()} ₸
                      </Title>
                    </div>
                  ) : (
                    <div className="text-right">
                      <Text strong>Недостаточно: </Text>
                      <Title level={4} type="danger" className="m-0 inline">
                        {(service.finalPrice || service.initialPrice) -
                          cashReceived}{' '}
                        ₸
                      </Title>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <div className="flex justify-between mt-3">
              <Button size="large" onClick={handleCancel}>
                Отменить
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<MoneyCollectOutlined />}
                onClick={handleConfirm}
                disabled={loadingPaymentMethods || paymentOptions.length === 0}
              >
                Подтвердить оплату
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <Text type="danger">Услуга не найдена</Text>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения */}
      <Modal
        title="Подтвердить оплату?"
        open={confirmModalVisible}
        onCancel={handleModalCancel}
        footer={[
          <Button key="back" onClick={handleModalCancel}>
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleModalConfirm}
            disabled={
              isCashPayment &&
              (cashReceived === null ||
                cashReceived <
                  (service?.finalPrice || service?.initialPrice || 0))
            }
          >
            OK
          </Button>,
        ]}
      >
        <p>
          Вы уверены, что хотите подтвердить завершение услуги и оплату
          {service
            ? ` на сумму ${service.finalPrice || service.initialPrice} ₸`
            : ''}
          ?
        </p>
        {selectedMethod && (
          <p>
            Выбранный способ оплаты:{' '}
            <strong>
              {paymentOptions.find((m) => m.key === selectedMethod)?.title}
            </strong>
          </p>
        )}
        {isCashPayment && cashReceived !== null && service && (
          <>
            <p>
              Получено: <strong>{cashReceived} ₸</strong>
            </p>
            {cashReceived >= (service.finalPrice || service.initialPrice) ? (
              <p>
                Сдача: <strong>{calculateChange()} ₸</strong>
              </p>
            ) : (
              <p style={{ color: 'red' }}>Недостаточно средств для оплаты!</p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default ServiceCompletion;
