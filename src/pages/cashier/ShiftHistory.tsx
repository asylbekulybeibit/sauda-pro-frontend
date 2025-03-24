import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Input,
  Card,
  Typography,
  Spin,
  message,
  Tooltip,
  Collapse,
  Divider,
  Statistic,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  CarOutlined,
  UserOutlined,
  ToolOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRoleStore } from '@/store/roleStore';
import { Shift, ShiftStatus } from '@/types/cash-register';
import { getShiftHistory, getShiftOperations } from '@/services/cashierApi';
import { handleApiError } from '@/utils/errorHandling';
import { formatCurrency, formatDate } from '@/utils/formatters';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

// Interface for service operation
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

// Interface for shift with operations
interface ShiftWithOperations extends Shift {
  operations?: ServiceOperation[];
  totalOperations?: number;
}

/**
 * Преобразование статуса смены в наглядный компонент
 */
const ShiftStatusTag: React.FC<{ status: ShiftStatus }> = ({ status }) => {
  switch (status) {
    case 'open':
      return <Tag color="green">Открыта</Tag>;
    case 'closed':
      return <Tag color="default">Закрыта</Tag>;
    case 'paused':
      return <Tag color="orange">Приостановлена</Tag>;
    default:
      return <Tag>Неизвестно</Tag>;
  }
};

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
 * Страница истории смен
 */
const ShiftHistory: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const { currentRole } = useRoleStore();
  const [shifts, setShifts] = useState<ShiftWithOperations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string>('');
  const [cashierId, setCashierId] = useState<string>(''); // ID текущего кассира
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [operationsLoading, setOperationsLoading] = useState<
    Record<string, boolean>
  >({});

  const navigate = useNavigate();

  // Загрузка информации о магазине и кассире из roleStore
  useEffect(() => {
    if (currentRole?.type === 'shop') {
      setShopName(currentRole.shop.name);
      // Получаем ID текущего кассира из роли
      if (currentRole.id) {
        setCashierId(currentRole.id);
      }
    } else if (shopId) {
      setShopName(`Магазин №${shopId}`);
      // В реальном приложении здесь нужен запрос для получения данных о текущем кассире
      setCashierId('current-cashier'); // Временный ID
    }
  }, [currentRole, shopId]);

  // Загрузка операций для конкретной смены
  const loadOperationsForShift = async (shiftId: string) => {
    // Если уже загружены операции для этой смены или идет загрузка, не делаем повторный запрос
    const shift = shifts.find((s) => s.id === shiftId);
    if (shift?.operations || operationsLoading[shiftId]) {
      return;
    }

    setOperationsLoading((prev) => ({ ...prev, [shiftId]: true }));

    try {
      // Получаем операции для смены через API
      const operations = await getShiftOperations(shopId || '', shiftId);

      // Обновляем данные смены с операциями
      setShifts((prevShifts) =>
        prevShifts.map((shift) =>
          shift.id === shiftId
            ? {
                ...shift,
                operations,
                totalOperations: operations.length,
              }
            : shift
        )
      );
    } catch (error) {
      console.error(
        `Ошибка при загрузке операций для смены ${shiftId}:`,
        error
      );
      message.error(`Не удалось загрузить операции для смены`);
    } finally {
      setOperationsLoading((prev) => ({ ...prev, [shiftId]: false }));
    }
  };

  // Обработчик разворачивания/сворачивания смены
  const handleShiftExpand = (shiftId: string) => {
    if (expandedShiftId === shiftId) {
      setExpandedShiftId(null);
    } else {
      setExpandedShiftId(shiftId);
      loadOperationsForShift(shiftId);
    }
  };

  // Загрузка данных о сменах
  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      try {
        // Используем API для получения истории смен текущего кассира
        const shiftsData = await getShiftHistory(shopId || '');

        // Фильтруем смены - показываем только смены текущего кассира
        const currentCashierShifts = shiftsData.filter(
          (shift) => shift.cashierId === cashierId
        );

        setShifts(currentCashierShifts);
        console.log(
          'Fetched shift history:',
          currentCashierShifts.length,
          'shifts for current cashier'
        );
      } catch (error) {
        console.error('Ошибка при загрузке истории смен:', error);
        message.error('Не удалось загрузить историю смен');
      } finally {
        setLoading(false);
      }
    };

    if (shopId && cashierId) {
      fetchShifts();
    }
  }, [shopId, cashierId]);

  // Возможность обновить данные
  const handleRetry = () => {
    message.info('Обновление данных...');
    // Повторно вызываем загрузку данных
    const fetchShifts = async () => {
      setLoading(true);
      try {
        const shiftsData = await getShiftHistory(shopId || '');
        // Фильтруем смены - показываем только смены текущего кассира
        const currentCashierShifts = shiftsData.filter(
          (shift) => shift.cashierId === cashierId
        );
        setShifts(currentCashierShifts);
        setExpandedShiftId(null); // Сбрасываем развернутую смену
        message.success('Данные успешно обновлены');
      } catch (error) {
        handleApiError(error, 'Не удалось загрузить историю смен');
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
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
      title: 'Услуга',
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

  // Фильтрация данных
  const filteredShifts = shifts.filter((shift) => {
    // Фильтр по поисковому запросу
    const searchMatch =
      !searchText ||
      shift.registerName.toLowerCase().includes(searchText.toLowerCase()) ||
      shift.cashierName.toLowerCase().includes(searchText.toLowerCase()) ||
      shift.id.includes(searchText);

    // Фильтр по диапазону дат
    const dateMatch =
      !dateRange ||
      (dayjs(shift.openedAt).isAfter(dateRange[0].startOf('day')) &&
        dayjs(shift.openedAt).isBefore(dateRange[1].endOf('day')));

    return searchMatch && dateMatch;
  });

  // Рендер карточки смены
  const renderShiftCard = (shift: ShiftWithOperations) => {
    const isExpanded = expandedShiftId === shift.id;
    const hasOperations = shift.operations && shift.operations.length > 0;
    const operationsCount = shift.totalOperations || 0;

    return (
      <Card
        key={shift.id}
        className="mb-4 shadow-sm hover:shadow-md transition-shadow"
        bodyStyle={{ padding: isExpanded ? '16px 16px 0 16px' : '16px' }}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center">
              <Title level={5} className="m-0 mr-2">
                {shift.registerName}
              </Title>
              <ShiftStatusTag status={shift.status} />
            </div>
            <Text type="secondary">
              Открыта: {formatDate(shift.openedAt, { showTime: true })}
              {shift.closedAt &&
                ` • Закрыта: ${formatDate(shift.closedAt, { showTime: true })}`}
            </Text>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(shift.totalSales || 0)}
            </div>
            <Button
              type="link"
              onClick={() => handleShiftExpand(shift.id)}
              className="p-0"
            >
              {isExpanded ? 'Свернуть' : 'Подробнее'}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg mt-2 mb-4">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Общая выручка"
                    value={shift.totalSales || 0}
                    precision={2}
                    suffix="₽"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Наличными"
                    value={shift.totalCash || 0}
                    precision={2}
                    suffix="₽"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Безналичный расчет"
                    value={shift.totalNonCash || 0}
                    precision={2}
                    suffix="₽"
                  />
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              <div className="flex justify-between items-center">
                <div>
                  <Text>
                    Всего операций: <strong>{operationsCount}</strong>
                  </Text>
                </div>
                <Link to={`/cashier/${shopId}/shift/${shift.id}`}>
                  <Button type="primary" ghost size="small">
                    Подробный отчет
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mb-4">
              <Title level={5}>Операции за смену</Title>
              {operationsLoading[shift.id] ? (
                <div className="py-10 flex justify-center">
                  <Spin size="default" />
                </div>
              ) : hasOperations ? (
                <Table
                  columns={operationColumns}
                  dataSource={shift.operations}
                  rowKey="id"
                  size="small"
                  pagination={
                    shift.operations && shift.operations.length > 10
                      ? { pageSize: 10 }
                      : false
                  }
                />
              ) : (
                <Empty
                  description="Нет операций за эту смену"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </>
        )}
      </Card>
    );
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center">
        <Link to={`/cashier/${shopId}`}>
          <Button icon={<ArrowLeftOutlined />} className="mr-4">
            Назад
          </Button>
        </Link>
        <div>
          <Title level={4} className="m-0">
            История смен
          </Title>
          {shopName && <Text type="secondary">{shopName}</Text>}
        </div>
      </div>

      <Card className="mb-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Поиск по кассе"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>
          <div className="flex-1 min-w-[300px]">
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Дата начала', 'Дата окончания']}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
            />
          </div>
          <div className="w-[150px]">
            <Select
              placeholder="Тип операции"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setTypeFilter(value)}
            >
              <Option value="service">Услуги</Option>
              <Option value="product">Продажи</Option>
              <Option value="refund">Возвраты</Option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => message.info('Экспорт в Excel не реализован')}
            >
              Экспорт
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRetry}>
              Обновить
            </Button>
          </div>
        </div>
      </Card>

      <div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <Spin size="large" />
          </div>
        ) : filteredShifts.length > 0 ? (
          filteredShifts.map(renderShiftCard)
        ) : (
          <Card className="text-center py-8">
            <Empty
              description={
                <span>
                  Нет данных о сменах
                  <br />
                  <small className="text-gray-500">
                    Возможно, вы еще не открывали смены или примените другие
                    параметры фильтрации
                  </small>
                </span>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShiftHistory;
