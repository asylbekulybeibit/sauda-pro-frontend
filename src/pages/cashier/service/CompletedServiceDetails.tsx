import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Spin,
  message,
  Descriptions,
  Divider,
  Tag,
  Row,
  Col,
  Menu,
  Result,
  Modal,
  Statistic,
  Timeline,
  Space,
  Tooltip,
} from 'antd';
import {
  PrinterOutlined,
  WhatsAppOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  CarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PieChartOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  WalletOutlined,
  BankOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import duration from 'dayjs/plugin/duration';
import { formatCurrency } from '@/utils/formatters';

dayjs.locale('ru');
dayjs.extend(duration);

const { Title, Text, Paragraph } = Typography;

// Интерфейс для метода оплаты
interface PaymentMethodInfo {
  key: string;
  title: string;
  icon: React.ReactNode;
  color: string;
}

/**
 * Страница деталей завершенной услуги с возможностью печати и отправки чека
 */
const CompletedServiceDetails: React.FC = () => {
  const { shopId, serviceId } = useParams<{
    shopId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [printLoading, setPrintLoading] = useState<boolean>(false);
  const [sendLoading, setSendLoading] = useState<boolean>(false);
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [successModalVisible, setSuccessModalVisible] =
    useState<boolean>(false);
  const [modalType, setModalType] = useState<'print' | 'send' | 'email'>(
    'print'
  );

  // Список методов оплаты и их отображение
  const paymentMethods: Record<string, PaymentMethodInfo> = {
    cash: {
      key: 'cash',
      title: 'Наличные',
      icon: <DollarOutlined />,
      color: 'green',
    },
    card: {
      key: 'card',
      title: 'Банковская карта',
      icon: <CreditCardOutlined />,
      color: 'blue',
    },
    qr: {
      key: 'qr',
      title: 'QR-код / Kaspi Pay',
      icon: <QrcodeOutlined />,
      color: 'purple',
    },
    bank: {
      key: 'bank',
      title: 'Банковский перевод',
      icon: <BankOutlined />,
      color: 'cyan',
    },
    wallet: {
      key: 'wallet',
      title: 'Электронный кошелек',
      icon: <WalletOutlined />,
      color: 'orange',
    },
    credit: {
      key: 'credit',
      title: 'Кредит / Рассрочка',
      icon: <DollarOutlined />,
      color: 'red',
    },
  };

  // Загружаем информацию о услуге из localStorage или API
  useEffect(() => {
    try {
      // Пытаемся получить данные из localStorage
      const serviceData = localStorage.getItem('completedService');
      if (serviceData) {
        const parsedService = JSON.parse(serviceData);
        setService(parsedService);
        setLoading(false);
      } else {
        // В реальном приложении здесь должен быть API запрос для получения данных
        // Например: const serviceData = await getCompletedServiceDetails(shopId, serviceId);
        message.error('Информация о завершенной услуге не найдена');
        navigate(`/cashier/${shopId}/completed-services`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading completed service data:', error);
      message.error('Ошибка при загрузке данных завершенной услуги');
      navigate(`/cashier/${shopId}/completed-services`);
    }
  }, [shopId, serviceId, navigate]);

  // Вычисляем продолжительность услуги
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'Н/Д';

    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const diff = end.diff(start, 'minute');

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return `${hours > 0 ? `${hours} ч. ` : ''}${minutes} мин.`;
  };

  // Обработчик печати чека
  const handlePrintReceipt = () => {
    // Имитация печати чека на POS-принтере
    setPrintLoading(true);
    setTimeout(() => {
      setPrintLoading(false);
      setModalType('print');
      setSuccessModalVisible(true);
    }, 2000);
  };

  // Обработчик отправки чека по WhatsApp
  const handleSendReceiptWhatsApp = () => {
    // Имитация отправки PDF чека через WhatsApp
    setSendLoading(true);
    setTimeout(() => {
      setSendLoading(false);
      setModalType('send');
      setSuccessModalVisible(true);
    }, 2000);
  };

  // Обработчик отправки чека по Email
  const handleSendReceiptEmail = () => {
    // Имитация отправки PDF чека на email
    setEmailLoading(true);
    setTimeout(() => {
      setEmailLoading(false);
      setModalType('email');
      setSuccessModalVisible(true);
    }, 2000);
  };

  // Обработчик возврата к списку завершенных услуг
  const handleGoToCompleted = () => {
    navigate(`/cashier/${shopId}/completed-services`);
  };

  // Обработчик перехода к активным услугам
  const handleGoToActive = () => {
    navigate(`/cashier/${shopId}/service/active`);
  };

  // Получаем иконку и цвет метода оплаты
  const getPaymentMethodInfo = (paymentMethodId: string) => {
    const methodKey =
      Object.keys(paymentMethods).find(
        (key) =>
          key === paymentMethodId.toLowerCase() ||
          paymentMethods[key].title
            .toLowerCase()
            .includes(paymentMethodId.toLowerCase())
      ) || 'cash';

    return paymentMethods[methodKey];
  };

  return (
    <div className="flex flex-col">
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
      <div className="p-3">
        <div className="mb-3 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleGoToCompleted}
            className="mr-3"
          >
            К завершенным услугам
          </Button>
          <Title level={4} className="m-0">
            Чек и информация об услуге
          </Title>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : service ? (
          <>
            {/* Номер чека и информация о дате */}
            <Card className="mb-3 shadow-sm">
              <Row gutter={16} align="middle">
                <Col xs={24} sm={12}>
                  <Title level={4} className="m-0">
                    Чек №
                    {service.receipt?.receiptNumber ||
                      `REC-${Date.now().toString().slice(-6)}`}
                  </Title>
                  <Text type="secondary">
                    <CalendarOutlined className="mr-1" />
                    {dayjs(service.endTime || new Date()).format(
                      'DD MMMM YYYY, HH:mm'
                    )}
                  </Text>
                </Col>
                <Col xs={24} sm={12} className="text-right">
                  <Space wrap>
                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      loading={printLoading}
                      onClick={handlePrintReceipt}
                      className="mr-2"
                    >
                      Печать чека
                    </Button>
                    <Button
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      loading={sendLoading}
                      onClick={handleSendReceiptWhatsApp}
                      className="mr-2 bg-green-600 hover:bg-green-700"
                    >
                      WhatsApp
                    </Button>
                    <Button
                      type="primary"
                      icon={<MailOutlined />}
                      loading={emailLoading}
                      onClick={handleSendReceiptEmail}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Email
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Информация об услуге */}
            <Card className="mb-3 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Title level={4} className="mb-1">
                    {service.serviceType.name}
                  </Title>
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Услуга завершена
                  </Tag>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {service.finalPrice || service.initialPrice} ₸
                  </div>
                  {service.finalPrice &&
                    service.finalPrice < service.initialPrice && (
                      <div className="text-sm">
                        <span className="line-through text-gray-500">
                          {service.initialPrice} ₸
                        </span>{' '}
                        <Tag color="green">
                          -
                          {Math.round(
                            (1 - service.finalPrice / service.initialPrice) *
                              100
                          )}
                          %
                        </Tag>
                      </div>
                    )}
                </div>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    title="Клиент"
                    bordered={false}
                    className="bg-gray-50"
                  >
                    <div className="flex items-center mb-2">
                      <UserOutlined className="mr-2 text-blue-500" />
                      <Text strong>
                        {service.client.lastName} {service.client.firstName}
                      </Text>
                    </div>
                    <div className="flex items-center">
                      <PhoneOutlined className="mr-2 text-blue-500" />
                      <Text>{service.client.phone}</Text>
                    </div>
                    {service.client.discountPercent > 0 && (
                      <div className="mt-2">
                        <Tag color="volcano">
                          Скидка клиента: {service.client.discountPercent}%
                        </Tag>
                      </div>
                    )}
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    title="Автомобиль"
                    bordered={false}
                    className="bg-gray-50"
                  >
                    <div className="flex items-center mb-2">
                      <CarOutlined className="mr-2 text-blue-500" />
                      <Text strong>
                        {service.vehicle.make} {service.vehicle.model}
                      </Text>
                    </div>
                    <div className="flex items-center">
                      <Text type="secondary" className="mr-2">
                        Гос. номер:
                      </Text>
                      <Text>{service.vehicle.licensePlate}</Text>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card
                    size="small"
                    title="Время"
                    bordered={false}
                    className="bg-gray-50"
                  >
                    <div className="flex items-center mb-2">
                      <ClockCircleOutlined className="mr-2 text-blue-500" />
                      <Text>
                        Начало: {dayjs(service.startTime).format('HH:mm')}
                      </Text>
                    </div>
                    <div className="flex items-center mb-2">
                      <ClockCircleOutlined className="mr-2 text-blue-500" />
                      <Text>
                        Завершение: {dayjs(service.endTime).format('HH:mm')}
                      </Text>
                    </div>
                    <div className="flex items-center">
                      <Text type="secondary" className="mr-2">
                        Длительность:
                      </Text>
                      <Text>
                        {calculateDuration(service.startTime, service.endTime)}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>

              <Divider className="my-3" />

              <div>
                <Title level={5} className="mb-2">
                  Мастера, выполнившие услугу:
                </Title>
                <div className="flex flex-wrap gap-2">
                  {service.serviceStaff && service.serviceStaff.length > 0 ? (
                    service.serviceStaff.map((staffItem: any) => (
                      <Tag
                        key={staffItem.id}
                        icon={<ToolOutlined />}
                        className="py-1 px-2 text-base"
                      >
                        {staffItem.staff.lastName} {staffItem.staff.firstName}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">Не указаны</Text>
                  )}
                </div>
              </div>
            </Card>

            {/* Финансовая информация */}
            <Card className="mb-3" title="Детали оплаты">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={16}>
                  <div className="mb-4">
                    <Title level={5} className="mb-2">
                      Стоимость услуги
                    </Title>
                    <Row gutter={[8, 8]} className="mb-2">
                      <Col span={16}>
                        <Text>{service.serviceType.name}</Text>
                      </Col>
                      <Col span={8} className="text-right">
                        <Text>{service.initialPrice} ₸</Text>
                      </Col>
                    </Row>

                    {service.finalPrice !== service.initialPrice && (
                      <>
                        <Divider className="my-2" />
                        <Row gutter={[8, 8]}>
                          <Col span={16}>
                            <Text strong>Начальная стоимость</Text>
                          </Col>
                          <Col span={8} className="text-right">
                            <Text strong>{service.initialPrice} ₸</Text>
                          </Col>
                        </Row>

                        <Row gutter={[8, 8]}>
                          <Col span={16}>
                            <Text type="danger">
                              Скидка (
                              {Math.round(
                                (1 -
                                  service.finalPrice / service.initialPrice) *
                                  100
                              )}
                              %)
                            </Text>
                          </Col>
                          <Col span={8} className="text-right">
                            <Text type="danger">
                              -{service.initialPrice - service.finalPrice} ₸
                            </Text>
                          </Col>
                        </Row>
                      </>
                    )}

                    <Divider className="my-2" />
                    <Row gutter={[8, 8]}>
                      <Col span={16}>
                        <Text strong className="text-lg">
                          Итоговая сумма
                        </Text>
                      </Col>
                      <Col span={8} className="text-right">
                        <Text strong className="text-lg text-success">
                          {service.finalPrice || service.initialPrice} ₸
                        </Text>
                      </Col>
                    </Row>

                    {/* Если оплата наличными и есть информация о полученной сумме */}
                    {service.paymentMethod === 'cash' &&
                      service.cashReceived && (
                        <>
                          <Divider className="my-2" />
                          <Row gutter={[8, 8]}>
                            <Col span={16}>
                              <Text>Получено от клиента</Text>
                            </Col>
                            <Col span={8} className="text-right">
                              <Text>{service.cashReceived} ₸</Text>
                            </Col>
                          </Row>
                          <Row gutter={[8, 8]}>
                            <Col span={16}>
                              <Text>Сдача</Text>
                            </Col>
                            <Col span={8} className="text-right">
                              <Text>
                                {service.cashReceived -
                                  (service.finalPrice ||
                                    service.initialPrice)}{' '}
                                ₸
                              </Text>
                            </Col>
                          </Row>
                        </>
                      )}
                  </div>
                </Col>

                <Col xs={24} md={8}>
                  <Card
                    className="h-full"
                    style={{
                      borderTop: `5px solid ${
                        getPaymentMethodInfo(
                          service.receipt?.paymentMethod ||
                            service.paymentMethod ||
                            'cash'
                        ).color === 'green'
                          ? '#52c41a'
                          : getPaymentMethodInfo(
                              service.receipt?.paymentMethod ||
                                service.paymentMethod ||
                                'cash'
                            ).color === 'blue'
                          ? '#1890ff'
                          : getPaymentMethodInfo(
                              service.receipt?.paymentMethod ||
                                service.paymentMethod ||
                                'cash'
                            ).color === 'purple'
                          ? '#722ed1'
                          : getPaymentMethodInfo(
                              service.receipt?.paymentMethod ||
                                service.paymentMethod ||
                                'cash'
                            ).color === 'cyan'
                          ? '#13c2c2'
                          : getPaymentMethodInfo(
                              service.receipt?.paymentMethod ||
                                service.paymentMethod ||
                                'cash'
                            ).color === 'orange'
                          ? '#fa8c16'
                          : '#f5222d'
                      }`,
                    }}
                  >
                    <div className="text-center">
                      <div className="mb-3">
                        {React.cloneElement(
                          getPaymentMethodInfo(
                            service.receipt?.paymentMethod ||
                              service.paymentMethod ||
                              'cash'
                          ).icon as React.ReactElement,
                          { style: { fontSize: 40 } }
                        )}
                      </div>
                      <Title level={4} className="m-0">
                        {
                          getPaymentMethodInfo(
                            service.receipt?.paymentMethod ||
                              service.paymentMethod ||
                              'cash'
                          ).title
                        }
                      </Title>
                      <div className="mt-3">
                        <Statistic
                          value={service.finalPrice || service.initialPrice}
                          suffix="₸"
                          precision={2}
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Действия с чеком */}
            <Card title="Варианты отправки чека" className="mb-3">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card
                    className="text-center hover:shadow-md transition-shadow h-full cursor-pointer"
                    onClick={handlePrintReceipt}
                  >
                    <PrinterOutlined
                      style={{ fontSize: 36, color: '#1890ff' }}
                    />
                    <Title level={5} className="mt-3 mb-1">
                      Печать чека
                    </Title>
                    <Text type="secondary">
                      Распечатайте чек для клиента на POS-принтере
                    </Text>
                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      block
                      className="mt-3"
                      loading={printLoading}
                      onClick={handlePrintReceipt}
                    >
                      Печать
                    </Button>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card
                    className="text-center hover:shadow-md transition-shadow h-full cursor-pointer"
                    onClick={handleSendReceiptWhatsApp}
                  >
                    <WhatsAppOutlined
                      style={{ fontSize: 36, color: '#25D366' }}
                    />
                    <Title level={5} className="mt-3 mb-1">
                      WhatsApp
                    </Title>
                    <Text type="secondary">
                      Отправить цифровой чек через WhatsApp
                    </Text>
                    <Button
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      block
                      className="mt-3 bg-green-600 hover:bg-green-700"
                      loading={sendLoading}
                      onClick={handleSendReceiptWhatsApp}
                    >
                      Отправить
                    </Button>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card
                    className="text-center hover:shadow-md transition-shadow h-full cursor-pointer"
                    onClick={handleSendReceiptEmail}
                  >
                    <MailOutlined style={{ fontSize: 36, color: '#1890ff' }} />
                    <Title level={5} className="mt-3 mb-1">
                      Email
                    </Title>
                    <Text type="secondary">
                      Отправить PDF-чек на электронную почту
                    </Text>
                    <Button
                      type="primary"
                      icon={<MailOutlined />}
                      block
                      className="mt-3 bg-blue-500 hover:bg-blue-600"
                      loading={emailLoading}
                      onClick={handleSendReceiptEmail}
                    >
                      Отправить
                    </Button>
                  </Card>
                </Col>
              </Row>
            </Card>

            <div className="flex justify-center mt-4">
              <Button
                type="primary"
                size="large"
                onClick={handleGoToActive}
                className="px-8"
              >
                Вернуться к активным услугам
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Text type="danger">Данные о завершенной услуге не найдены</Text>
          </div>
        )}
      </div>

      <Modal
        open={successModalVisible}
        footer={null}
        onCancel={() => setSuccessModalVisible(false)}
        width={400}
      >
        <Result
          status="success"
          title={
            modalType === 'print'
              ? 'Чек успешно отправлен на печать'
              : modalType === 'send'
              ? 'Чек успешно отправлен клиенту'
              : 'Чек успешно отправлен на email'
          }
          subTitle={
            modalType === 'print'
              ? 'Проверьте POS-принтер, чтобы получить распечатанный чек.'
              : modalType === 'send'
              ? `Чек был отправлен на телефон клиента ${
                  service?.client?.phone || ''
                } через WhatsApp.`
              : `Чек был отправлен на email ${
                  service?.client?.email || 'клиента'
                }`
          }
          extra={[
            <Button
              key="close"
              type="primary"
              onClick={() => setSuccessModalVisible(false)}
            >
              Закрыть
            </Button>,
          ]}
        />
      </Modal>
    </div>
  );
};

export default CompletedServiceDetails;
