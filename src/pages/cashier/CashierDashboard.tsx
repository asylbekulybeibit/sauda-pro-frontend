import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Typography,
  Space,
  Alert,
  Spin,
  Divider,
  Tag,
  Avatar,
  message,
} from 'antd';
import {
  DollarOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
  UserOutlined,
  SyncOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  HistoryOutlined,
  LogoutOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import RecentTransactions from '@/components/cashier/RecentTransactions';
import { ShiftStatus } from '@/types/shifts';

const { Title, Text } = Typography;

/**
 * Дашборд кассира
 */
const CashierDashboard: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<{
    id: string;
    registerName: string;
    openedAt: string;
    cashierName: string;
    sales: number;
    returns: number;
    cashPayments: number;
    cardPayments: number;
    totalSales: number;
    status: ShiftStatus;
  } | null>(null);

  // Загрузка данных о текущей смене
  useEffect(() => {
    const fetchActiveShift = async () => {
      try {
        setLoading(true);
        // Здесь будет вызов API для получения активной смены
        // Пока используем заглушку с таймаутом
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Тестовые данные активной смены
        const mockShift = {
          id: 'shift-123',
          registerName: 'Касса №1',
          openedAt: dayjs().subtract(3, 'hour').toISOString(),
          cashierName: 'Иванов Иван',
          sales: 5,
          returns: 1,
          cashPayments: 3500.5,
          cardPayments: 7250.0,
          totalSales: 10750.5,
          status: ShiftStatus.OPEN,
        };

        setActiveShift(mockShift);
      } catch (error) {
        message.error('Не удалось загрузить данные о текущей смене');
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchActiveShift();
    }
  }, [shopId]);

  // Функция расчета продолжительности смены
  const getShiftDuration = () => {
    if (!activeShift) return '';
    const startTime = dayjs(activeShift.openedAt);
    const now = dayjs();
    const hours = now.diff(startTime, 'hour');
    const minutes = now.diff(startTime, 'minute') % 60;

    return `${hours} ч ${minutes} мин`;
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <Title level={4}>Панель кассира</Title>
        {shopId && (
          <Text type="secondary">
            <ShopOutlined className="mr-2" />
            {`Магазин №${shopId}`}
          </Text>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {activeShift ? (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16} xl={18}>
                <Card className="mb-4 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <Title level={5} className="m-0">
                        <Space>
                          Текущая смена
                          <Tag color="green">Открыта</Tag>
                        </Space>
                      </Title>
                      <Text type="secondary">
                        {activeShift.registerName} | Открыта{' '}
                        {dayjs(activeShift.openedAt).format('DD.MM.YYYY HH:mm')}
                      </Text>
                    </div>
                    <Avatar size="large" icon={<UserOutlined />} />
                  </div>

                  <Row gutter={16} className="mb-4">
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Продажи"
                        value={activeShift.totalSales}
                        precision={2}
                        suffix="₽"
                        valueStyle={{ color: '#52c41a' }}
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Транзакции"
                        value={activeShift.sales}
                        prefix={<ShoppingOutlined />}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Наличные"
                        value={activeShift.cashPayments}
                        precision={2}
                        suffix="₽"
                        prefix={<DollarOutlined />}
                      />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Statistic
                        title="Карта"
                        value={activeShift.cardPayments}
                        precision={2}
                        suffix="₽"
                        prefix={<CreditCardOutlined />}
                      />
                    </Col>
                  </Row>

                  <div className="flex justify-between items-center">
                    <div>
                      <Text type="secondary">
                        <ClockCircleOutlined className="mr-2" />
                        {`Длительность: ${getShiftDuration()}`}
                      </Text>
                    </div>
                    <Space>
                      <Button
                        icon={<HistoryOutlined />}
                        onClick={() =>
                          navigate(`/cashier/${shopId}/shift/${activeShift.id}`)
                        }
                      >
                        Детали
                      </Button>
                      <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={() =>
                          navigate(
                            `/cashier/${shopId}/close-shift/${activeShift.id}`
                          )
                        }
                      >
                        Закрыть смену
                      </Button>
                    </Space>
                  </div>
                </Card>

                <RecentTransactions shopId={shopId || ''} />
              </Col>

              <Col xs={24} lg={8} xl={6}>
                <Card className="shadow-sm mb-4" title="Быстрые действия">
                  <Space direction="vertical" className="w-full">
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<ShoppingOutlined />}
                      onClick={() => navigate(`/cashier/${shopId}/service`)}
                    >
                      Новая услуга
                    </Button>
                    <Button
                      block
                      size="large"
                      icon={<TeamOutlined />}
                      onClick={() =>
                        navigate(`/cashier/${shopId}/service/active`)
                      }
                    >
                      Активные услуги
                    </Button>
                    <Button
                      block
                      size="large"
                      icon={<HistoryOutlined />}
                      onClick={() =>
                        navigate(`/cashier/${shopId}/service/completed`)
                      }
                    >
                      Завершенные услуги
                    </Button>
                    <Divider />
                    <Button
                      block
                      icon={<KeyOutlined />}
                      onClick={() => navigate(`/cashier/${shopId}/shifts`)}
                    >
                      История смен
                    </Button>
                  </Space>
                </Card>

                <Card className="shadow-sm" title="Статистика за сегодня">
                  <Statistic
                    title="Продажи"
                    value={15700.5}
                    precision={2}
                    suffix="₽"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<DollarOutlined />}
                    className="mb-4"
                  />
                  <Statistic
                    title="Клиентов"
                    value={12}
                    prefix={<UserOutlined />}
                    className="mb-4"
                  />
                  <Statistic
                    title="Средний чек"
                    value={1308.38}
                    precision={2}
                    suffix="₽"
                    prefix={<ShoppingOutlined />}
                  />

                  <Divider />

                  <Button
                    type="link"
                    icon={<SyncOutlined />}
                    block
                    onClick={() => message.info('Обновление статистики...')}
                  >
                    Обновить статистику
                  </Button>
                </Card>
              </Col>
            </Row>
          ) : (
            <Alert
              message="Нет активной смены"
              description={
                <div>
                  <p>
                    В настоящее время нет открытой смены на этом кассовом
                    аппарате.
                  </p>
                  <Button
                    type="primary"
                    onClick={() => navigate(`/cashier/${shopId}`)}
                    className="mt-4"
                  >
                    Открыть смену
                  </Button>
                </div>
              }
              type="info"
              showIcon
            />
          )}
        </>
      )}
    </div>
  );
};

export default CashierDashboard;
