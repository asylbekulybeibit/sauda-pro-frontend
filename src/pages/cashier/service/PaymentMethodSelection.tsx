import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Spin,
  message,
  Card,
  Row,
  Col,
  Menu,
  Modal,
  Divider,
} from 'antd';
import {
  CreditCardOutlined,
  DollarOutlined,
  QrcodeOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  PieChartOutlined,
  WalletOutlined,
  BankOutlined,
  ShakeOutlined,
} from '@ant-design/icons';
import { completeService } from '@/services/cashierApi';

const { Title, Text } = Typography;

// Типы методов оплаты
type PaymentMethod = 'cash' | 'card' | 'qr' | 'bank' | 'wallet' | 'credit';

interface PaymentOption {
  key: PaymentMethod;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

/**
 * Страница выбора метода оплаты
 */
const PaymentMethodSelection: React.FC = () => {
  const { shopId, serviceId } = useParams<{
    shopId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Доступные методы оплаты
  const paymentMethods: PaymentOption[] = [
    {
      key: 'cash',
      title: 'Наличные',
      icon: <DollarOutlined style={{ fontSize: 36 }} />,
      description: 'Оплата наличными деньгами',
      color: 'green',
    },
    {
      key: 'card',
      title: 'Банковская карта',
      icon: <CreditCardOutlined style={{ fontSize: 36 }} />,
      description: 'Оплата банковской картой через терминал',
      color: 'blue',
    },
    {
      key: 'qr',
      title: 'QR-код / Kaspi Pay',
      icon: <QrcodeOutlined style={{ fontSize: 36 }} />,
      description: 'Оплата через сканирование QR-кода',
      color: 'purple',
    },
    {
      key: 'bank',
      title: 'Банковский перевод',
      icon: <BankOutlined style={{ fontSize: 36 }} />,
      description: 'Оплата через банковский перевод по реквизитам',
      color: 'cyan',
    },
    {
      key: 'wallet',
      title: 'Электронный кошелек',
      icon: <WalletOutlined style={{ fontSize: 36 }} />,
      description: 'Оплата через электронные кошельки',
      color: 'orange',
    },
    {
      key: 'credit',
      title: 'Кредит / Рассрочка',
      icon: <ShakeOutlined style={{ fontSize: 36 }} />,
      description: 'Оформление покупки в кредит или рассрочку',
      color: 'gold',
    },
  ];

  // Загружаем информацию о услуге из localStorage
  useEffect(() => {
    try {
      const serviceData = localStorage.getItem('serviceToComplete');
      if (serviceData) {
        const parsedService = JSON.parse(serviceData);
        setService(parsedService);
      } else {
        message.error('Информация об услуге не найдена');
        navigate(`/cashier/${shopId}/service/active`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading service data:', error);
      message.error('Ошибка при загрузке данных услуги');
      navigate(`/cashier/${shopId}/service/active`);
    }
  }, [shopId, serviceId, navigate]);

  // Обработчик выбора метода оплаты
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  // Обработчик возврата на предыдущую страницу
  const handleBack = () => {
    navigate(`/cashier/${shopId}/service/complete/${serviceId}`);
  };

  // Обработчик подтверждения оплаты
  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      message.warning('Пожалуйста, выберите способ оплаты');
      return;
    }

    // Показываем модальное окно подтверждения
    setConfirmModalVisible(true);
  };

  // Обработчик подтверждения в модальном окне
  const handleModalConfirm = async () => {
    if (!service || !shopId || !serviceId || !selectedMethod) return;

    setSubmitting(true);
    try {
      await completeService(shopId, {
        serviceId: serviceId,
        finalPrice: service.finalPrice || service.initialPrice,
        paymentMethod: selectedMethod,
      });

      // Сохраняем полные данные об услуге включая метод оплаты для страницы деталей
      localStorage.setItem(
        'completedService',
        JSON.stringify({
          ...service,
          finalPrice: service.finalPrice || service.initialPrice,
          paymentMethod: selectedMethod,
        })
      );

      message.success('Услуга успешно завершена');

      // Переходим на страницу деталей завершенной услуги
      navigate(`/cashier/${shopId}/service/receipt/${serviceId}`);
    } catch (error) {
      console.error('Error completing service:', error);
      message.error('Не удалось завершить услугу');
      setConfirmModalVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Обработчик отмены в модальном окне
  const handleModalCancel = () => {
    setConfirmModalVisible(false);
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
        <div className="mb-6 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            className="mr-4"
          >
            Назад
          </Button>
          <Title level={4} className="m-0">
            Выбор метода оплаты
          </Title>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : service ? (
          <>
            <Card className="mb-4 shadow-sm bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <Title level={5} className="mb-0">
                    {service.serviceType.name}
                  </Title>
                  <Text type="secondary">Услуга готова к оплате</Text>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {service.finalPrice || service.initialPrice} ₸
                  </div>
                  {service.finalPrice &&
                    service.finalPrice < service.initialPrice && (
                      <div className="text-xs text-gray-500">
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
            </Card>

            <Title level={5} className="mt-4 mb-3">
              Выберите способ оплаты:
            </Title>

            <Row gutter={[16, 16]}>
              {paymentMethods.map((method) => (
                <Col xs={12} sm={8} md={8} lg={8} xl={8} key={method.key}>
                  <Card
                    hoverable
                    className={`h-full text-center transition-all ${
                      selectedMethod === method.key
                        ? `border-${method.color}-500 shadow-md bg-${method.color}-50`
                        : ''
                    }`}
                    onClick={() => handleSelectPaymentMethod(method.key)}
                  >
                    <div className={`text-${method.color}-500 mb-3`}>
                      {method.icon}
                    </div>
                    <Title level={5} className="mb-1">
                      {method.title}
                    </Title>
                    <Text type="secondary" className="block">
                      {method.description}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>

            <Divider />

            <div className="flex justify-center mt-4 mb-6">
              <Button
                type="primary"
                size="large"
                disabled={!selectedMethod}
                onClick={handleConfirmPayment}
                icon={<CheckCircleOutlined />}
                className="px-8"
              >
                Подтвердить оплату
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <Text type="danger">Услуга не найдена</Text>
          </div>
        )}
      </div>

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
              {paymentMethods.find((m) => m.key === selectedMethod)?.title}
            </strong>
          </p>
        )}
      </Modal>
    </div>
  );
};

export default PaymentMethodSelection;
