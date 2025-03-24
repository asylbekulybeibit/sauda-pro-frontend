import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  Spin,
  Empty,
  Tabs,
  Typography,
  Tag,
  Dropdown,
  Menu,
  Space,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ShiftSummary from '@/components/cashier/shifts/ShiftSummary';
import { ShiftStatus } from '@/types/cash-register';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Типы данных для транзакций и возвратов
interface Transaction {
  id: string;
  type: 'sale' | 'refund';
  amount: number;
  paymentMethod: string;
  time: string;
  receiptNumber: string;
  cashierName: string;
}

/**
 * Страница деталей смены
 */
const ShiftDetails: React.FC = () => {
  const { shopId, shiftId } = useParams<{ shopId: string; shiftId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Данные смены
  const [shiftData, setShiftData] = useState({
    id: shiftId || 'shift-not-found',
    registerName: 'Основная касса',
    openedAt: '2023-07-15T08:30:00Z',
    closedAt: '2023-07-15T18:45:00Z',
    cashierName: 'Иванов Иван',
    status: 'closed' as ShiftStatus,
    sales: 45600.75,
    returns: 1200.25,
    cashPayments: 15000,
    cardPayments: 30600.75,
    totalSales: 45600.75 - 1200.25,
  });

  // Загрузка данных смены и транзакций
  useEffect(() => {
    const fetchShiftData = async () => {
      try {
        setLoading(true);
        // Здесь будет вызов API для получения данных о смене
        // Пока используем заглушку с таймаутом
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Тестовые данные транзакций
        const mockTransactions: Transaction[] = [
          {
            id: 'tr-001',
            type: 'sale',
            amount: 1250.0,
            paymentMethod: 'Наличные',
            time: '2023-07-15T09:15:30Z',
            receiptNumber: '00001-1',
            cashierName: 'Иванов Иван',
          },
          {
            id: 'tr-002',
            type: 'sale',
            amount: 3400.5,
            paymentMethod: 'Карта',
            time: '2023-07-15T10:22:15Z',
            receiptNumber: '00002-1',
            cashierName: 'Иванов Иван',
          },
          {
            id: 'tr-003',
            type: 'sale',
            amount: 800.0,
            paymentMethod: 'Наличные',
            time: '2023-07-15T11:05:42Z',
            receiptNumber: '00003-1',
            cashierName: 'Иванов Иван',
          },
          {
            id: 'tr-004',
            type: 'refund',
            amount: 1200.25,
            paymentMethod: 'Карта',
            time: '2023-07-15T13:30:10Z',
            receiptNumber: '00004-1',
            cashierName: 'Иванов Иван',
          },
          {
            id: 'tr-005',
            type: 'sale',
            amount: 5300.0,
            paymentMethod: 'Карта',
            time: '2023-07-15T14:45:33Z',
            receiptNumber: '00005-1',
            cashierName: 'Иванов Иван',
          },
        ];

        setTransactions(mockTransactions);
      } catch (error) {
        message.error('Не удалось загрузить данные о смене');
      } finally {
        setLoading(false);
      }
    };

    if (shiftId) {
      fetchShiftData();
    }
  }, [shiftId, shopId]);

  // Колонки таблицы транзакций
  const transactionColumns: ColumnsType<Transaction> = [
    {
      title: '№ чека',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      render: (text, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/cashier/${shopId}/receipt/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Время',
      dataIndex: 'time',
      key: 'time',
      render: (time) => dayjs(time).format('HH:mm:ss'),
      width: 120,
      sorter: (a, b) => dayjs(a.time).unix() - dayjs(b.time).unix(),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) =>
        type === 'sale' ? (
          <Tag color="green">Продажа</Tag>
        ) : (
          <Tag color="red">Возврат</Tag>
        ),
      filters: [
        { text: 'Продажа', value: 'sale' },
        { text: 'Возврат', value: 'refund' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount, record) => (
        <Text type={record.type === 'refund' ? 'danger' : undefined} strong>
          {amount.toFixed(2)} ₽
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      filters: [
        { text: 'Наличные', value: 'Наличные' },
        { text: 'Карта', value: 'Карта' },
      ],
      onFilter: (value, record) => record.paymentMethod === value,
    },
    {
      title: 'Кассир',
      dataIndex: 'cashierName',
      key: 'cashierName',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/cashier/${shopId}/receipt/${record.id}`)}
            title="Просмотреть чек"
          />
          <Button
            type="text"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => message.info(`Печать чека №${record.receiptNumber}`)}
            title="Распечатать чек"
          />
        </Space>
      ),
    },
  ];

  // Функция для печати отчета по смене
  const printShiftReport = () => {
    message.info('Печать отчета по смене');
  };

  // Функция для экспорта данных смены
  const exportShiftData = () => {
    message.info('Экспорт данных смены');
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link to={`/cashier/${shopId}/shift-history`}>
            <Button icon={<ArrowLeftOutlined />} className="mr-4">
              К истории смен
            </Button>
          </Link>
          <Title level={4} className="m-0">
            Детали смены
          </Title>
        </div>

        <Space>
          <Button icon={<PrinterOutlined />} onClick={printShiftReport}>
            Печать отчета
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportShiftData}>
            Экспорт
          </Button>
        </Space>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Card className="mb-4 shadow-sm">
            <ShiftSummary shift={shiftData} />
          </Card>

          <Card className="shadow-sm">
            <Tabs defaultActiveKey="1">
              <TabPane tab="Транзакции" key="1">
                {transactions.length > 0 ? (
                  <Table
                    columns={transactionColumns}
                    dataSource={transactions}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                ) : (
                  <Empty
                    description="Нет транзакций в смене"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </TabPane>
              <TabPane tab="Товары" key="2">
                <Empty
                  description="Статистика по товарам будет доступна в следующих версиях"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </TabPane>
              <TabPane tab="Отмены" key="3">
                <Empty
                  description="Отмененные транзакции будут доступны в следующих версиях"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </TabPane>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
};

export default ShiftDetails;
