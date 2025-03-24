import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  Input,
  Spin,
  message,
  Typography,
  Alert,
  Modal,
  Divider,
  Table,
  Tag,
  Statistic,
  Result,
  Space,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  CarOutlined,
  UserOutlined,
  ToolOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import ShiftSummary from '@/components/cashier/shifts/ShiftSummary';
import { useRoleStore } from '@/store/roleStore';
import { ShiftStatus } from '@/types/cash-register';
import {
  getShiftOperations,
  getShiftDetails,
  getCurrentShift,
  closeShift,
} from '@/services/cashierApi';
import { sendShiftCloseNotification } from '@/utils/notificationUtils';
import { handleApiError, showErrorMessage } from '@/utils/errorHandling';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

// Интерфейс операции
interface ServiceOperation {
  id: string;
  type: 'service' | 'product' | 'refund';
  amount: number;
  time: string;
  serviceType: string;
  clientName: string;
  vehicleInfo?: string;
  technicianName?: string;
  paymentMethod: string;
  shiftId: string;
}

/**
 * Компонент для отображения типа операции
 */
const OperationTypeTag: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'service':
      return (
        <Tag color="blue" icon={<ToolOutlined />}>
          Услуга
        </Tag>
      );
    case 'product':
      return (
        <Tag color="green" icon={<DollarOutlined />}>
          Продажа
        </Tag>
      );
    case 'refund':
      return <Tag color="red">Возврат</Tag>;
    default:
      return <Tag>Неизвестно</Tag>;
  }
};

/**
 * Страница закрытия смены
 */
const CloseShift: React.FC = () => {
  const { shopId, shiftId } = useParams<{ shopId: string; shiftId?: string }>();
  const { currentRole } = useRoleStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [shiftClosed, setShiftClosed] = useState(false);
  const [noOpenShift, setNoOpenShift] = useState(false);
  const [shopName, setShopName] = useState<string>('');
  const [operations, setOperations] = useState<ServiceOperation[]>([]);
  const [form] = Form.useForm();

  // Состояния для данных смены
  const [shiftData, setShiftData] = useState<any>(null);

  // Загрузка информации о магазине из roleStore
  useEffect(() => {
    if (currentRole?.type === 'shop') {
      setShopName(currentRole.shop.name);
    } else if (shopId) {
      // В реальном приложении здесь будет API-запрос для получения информации о магазине
      setShopName(`Магазин №${shopId}`);
    }
  }, [currentRole, shopId]);

  // Загрузка операций смены
  const loadShiftOperations = async (id: string) => {
    try {
      setOperationsLoading(true);
      const operationsData = await getShiftOperations(shopId || '', id);
      setOperations(operationsData);
      console.log(
        `Загружено ${operationsData.length} операций для смены ${id}`
      );
    } catch (error) {
      console.error('Ошибка при загрузке операций смены:', error);
      showErrorMessage(error, 'Не удалось загрузить операции смены');
    } finally {
      setOperationsLoading(false);
    }
  };

  // Запрос данных о текущей смене
  useEffect(() => {
    const fetchShiftData = async () => {
      try {
        setLoading(true);

        let shift;

        // Если указан конкретный ID смены, загружаем его
        if (shiftId) {
          shift = await getShiftDetails(shopId || '', shiftId);
        } else {
          // Иначе получаем текущую открытую смену
          shift = await getCurrentShift(shopId || '');

          if (!shift) {
            setNoOpenShift(true);
            return;
          }
        }

        // Проверяем, закрыта ли смена
        setShiftClosed(shift.status === 'closed');

        // Обновляем состояние с данными о смене
        setShiftData(shift);

        // Загружаем операции для найденной смены
        if (shift && shift.id) {
          await loadShiftOperations(shift.id);

          // Устанавливаем начальное значение суммы наличных для формы
          form.setFieldsValue({
            cashAmount: shift.cashPayments || 0,
          });
        }
      } catch (error) {
        message.error('Не удалось загрузить данные о смене');
        console.error('Ошибка при загрузке данных о смене:', error);
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchShiftData();
    }
  }, [shopId, shiftId, form]);

  // Обработчик закрытия смены
  const handleCloseShift = async (values: any) => {
    Modal.confirm({
      title: 'Закрытие смены',
      content:
        'Вы уверены, что хотите закрыть текущую смену? Это действие нельзя отменить.',
      okText: 'Закрыть смену',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setClosing(true);

          // Проверка наличия shopId
          if (!shopId) {
            throw new Error('ID магазина не определен');
          }

          // Данные для закрытия смены (упрощенная версия)
          const closeData = {
            comment: values.comment || '',
          };

          // Закрываем смену через API
          await closeShift(shopId, shiftData.id, closeData);

          // Получаем имя кассира из текущей роли или из данных смены
          let cashierName = shiftData.cashierName;
          if (currentRole?.type === 'shop') {
            cashierName = currentRole.shop.name;
          }

          // Отправляем уведомление о закрытии смены
          try {
            sendShiftCloseNotification(
              shopId,
              shiftData.registerName,
              cashierName
            ).then((success) => {
              if (success) {
                console.log(
                  '✅ Уведомление о закрытии смены успешно отправлено'
                );
              } else {
                console.warn(
                  '⚠️ Не удалось отправить уведомление о закрытии смены'
                );
              }
            });
          } catch (notificationError) {
            console.error(
              'Ошибка при отправке уведомления о закрытии смены:',
              notificationError
            );
          }

          message.success('Смена успешно закрыта');
          setShiftClosed(true);

          // Обновляем список операций после закрытия
          loadShiftOperations(shiftData.id);
        } catch (error) {
          console.error('Ошибка при закрытии смены:', error);
          showErrorMessage(error, 'Не удалось закрыть смену');
        } finally {
          setClosing(false);
        }
      },
    });
  };

  // Колонки таблицы операций
  const operationColumns: ColumnsType<ServiceOperation> = [
    {
      title: 'Дата и время',
      dataIndex: 'time',
      key: 'time',
      render: (time) => formatDate(time, { showTime: true }),
      width: 150,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <OperationTypeTag type={type} />,
      width: 100,
    },
    {
      title: 'Услуга/Товар',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.vehicleInfo && (
            <div className="text-xs text-gray-500">
              <CarOutlined className="mr-1" /> {record.vehicleInfo}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Клиент / Мастер',
      dataIndex: 'clientName',
      key: 'clientName',
      render: (text, record) => (
        <div>
          <div>
            <UserOutlined className="mr-1" /> {text}
          </div>
          {record.technicianName && (
            <div className="text-xs text-gray-500">
              <ToolOutlined className="mr-1" /> {record.technicianName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span
          className={
            record.type === 'refund' ? 'text-red-500' : 'text-green-500'
          }
        >
          {record.type === 'refund' ? '-' : ''}
          {formatCurrency(amount)}
        </span>
      ),
      width: 120,
      align: 'right',
    },
    {
      title: 'Оплата',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
    },
  ];

  // Отображение результата после закрытия смены
  const renderClosedShiftResult = () => (
    <Result
      status="success"
      title="Смена успешно закрыта"
      subTitle={`Смена на кассе "${shiftData?.registerName}" была успешно закрыта. Отчет о закрытии смены отправлен менеджеру.`}
      extra={[
        <Button
          type="primary"
          key="return-to-main"
          onClick={() => navigate(`/cashier/${shopId}`)}
        >
          Вернуться к выбору кассы
        </Button>,
        <Button
          key="view-shift-history"
          onClick={() => navigate(`/cashier/${shopId}/shift-history`)}
        >
          История смен
        </Button>,
      ]}
    >
      <div className="mt-6 bg-gray-50 p-6 rounded-lg">
        <Title level={5}>Итоги смены</Title>
        <div className="mt-4">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Общая выручка"
                value={shiftData?.totalSales || 0}
                precision={2}
                suffix="₽"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Наличными"
                value={shiftData?.cashPayments || 0}
                precision={2}
                suffix="₽"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Безналичный расчет"
                value={shiftData?.cardPayments || 0}
                precision={2}
                suffix="₽"
              />
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Statistic title="Всего операций" value={operations.length} />
            </Col>
            <Col span={12}>
              <Statistic
                title="Сумма возвратов"
                value={shiftData?.returns || 0}
                precision={2}
                suffix="₽"
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
          </Row>
        </div>
      </div>
    </Result>
  );

  // Отображение сообщения, когда нет открытой смены
  const renderNoOpenShift = () => (
    <Result
      status="warning"
      title="Нет открытой смены"
      subTitle="У вас нет активной смены. Для начала работы необходимо выбрать кассу и открыть смену."
      extra={[
        <Button
          type="primary"
          key="open-shift"
          onClick={() => navigate(`/cashier/${shopId}`)}
        >
          Выбрать кассу
        </Button>,
        <Button
          key="view-shift-history"
          onClick={() => navigate(`/cashier/${shopId}/shift-history`)}
        >
          История смен
        </Button>,
      ]}
    />
  );

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            Назад
          </Button>
          <div>
            <Title level={4} className="m-0">
              {shiftId ? `Закрытие смены #${shiftId}` : 'Закрытие смены'}
            </Title>
            {shopName && <Text type="secondary">{shopName}</Text>}
          </div>
        </div>

        {shiftData && shiftData.id && (
          <Button
            type="default"
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/cashier/${shopId}/shift/${shiftData.id}`)}
          >
            Транзакции за смену
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : noOpenShift ? (
        renderNoOpenShift()
      ) : shiftClosed ? (
        renderClosedShiftResult()
      ) : shiftData ? (
        <>
          <Card className="mb-4 shadow-sm">
            <Alert
              message="Информация о смене"
              description={
                <div>
                  <p>
                    <strong>Касса:</strong> {shiftData.registerName}
                  </p>
                  <p>
                    <strong>Кассир:</strong> {shiftData.cashierName}
                  </p>
                  <p>
                    <strong>Время открытия:</strong>{' '}
                    {formatDate(shiftData.openedAt, { showTime: true })}
                  </p>
                  <p>
                    <strong>Магазин:</strong> {shopName}
                  </p>
                </div>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              className="mb-4"
            />

            <ShiftSummary shift={shiftData} />
          </Card>

          <Card className="mb-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <Title level={5} className="m-0">
                Операции за смену
              </Title>
              <Text type="secondary">
                Всего операций: <strong>{operations.length}</strong>
              </Text>
            </div>

            {operationsLoading ? (
              <div className="py-10 flex justify-center">
                <Spin size="default" />
              </div>
            ) : operations.length > 0 ? (
              <Table
                columns={operationColumns}
                dataSource={operations}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty
                description="Нет операций за эту смену"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleCloseShift}
            initialValues={{ comment: '' }}
          >
            <Card className="mb-4 shadow-sm">
              <Title level={5}>Комментарий к закрытию смены</Title>
              <Text type="secondary" className="mb-4 block">
                Вы можете оставить комментарий к закрытию смены (необязательно)
              </Text>

              <Form.Item name="comment" label="Комментарий">
                <Input.TextArea
                  rows={4}
                  placeholder="Введите комментарий к закрытию смены при необходимости"
                  disabled={shiftData.status === 'closed'}
                />
              </Form.Item>
            </Card>

            <Text type="secondary" className="block mt-2">
              <InfoCircleOutlined className="mr-1" />
              После закрытия смены будет отправлено автоматическое уведомление
              менеджеру.
            </Text>

            <div className="flex justify-center">
              <Button
                type="primary"
                danger
                size="large"
                icon={<CheckCircleOutlined />}
                htmlType="submit"
                loading={closing}
                disabled={shiftData.status === 'closed'}
                className="min-w-[200px]"
              >
                {shiftData.status === 'closed'
                  ? 'Смена закрыта'
                  : 'Закрыть смену'}
              </Button>
            </div>
          </Form>
        </>
      ) : (
        <Result
          status="error"
          title="Ошибка загрузки данных"
          subTitle="Не удалось загрузить информацию о смене. Пожалуйста, попробуйте позже."
          extra={[
            <Button
              type="primary"
              key="back"
              onClick={() => navigate(`/cashier/${shopId}`)}
            >
              Вернуться к выбору кассы
            </Button>,
          ]}
        />
      )}
    </div>
  );
};

export default CloseShift;
