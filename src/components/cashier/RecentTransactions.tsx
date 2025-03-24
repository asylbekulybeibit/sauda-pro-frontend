import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Tooltip,
  Spin,
  Empty,
} from 'antd';
import { EyeOutlined, PrinterOutlined, RightOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;

// Интерфейс для транзакции
interface Transaction {
  id: string;
  receiptNumber: string;
  type: 'sale' | 'refund';
  amount: number;
  paymentMethod: string;
  time: string;
  cashierName: string;
}

interface RecentTransactionsProps {
  shopId: string;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ shopId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Загрузка последних транзакций
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // Здесь будет вызов API для получения последних транзакций
        // Пока используем заглушку с таймаутом
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Тестовые данные транзакций
        const mockTransactions: Transaction[] = [
          {
            id: 'receipt-1',
            receiptNumber: '00001-1',
            type: 'sale',
            amount: 1250.0,
            paymentMethod: 'Наличные',
            time: dayjs().subtract(5, 'minute').toISOString(),
            cashierName: 'Иванов Иван',
          },
          {
            id: 'receipt-2',
            receiptNumber: '00002-1',
            type: 'sale',
            amount: 3150.5,
            paymentMethod: 'Карта',
            time: dayjs().subtract(15, 'minute').toISOString(),
            cashierName: 'Петрова Анна',
          },
          {
            id: 'receipt-3',
            receiptNumber: '00003-1',
            type: 'refund',
            amount: -550.0,
            paymentMethod: 'Наличные',
            time: dayjs().subtract(45, 'minute').toISOString(),
            cashierName: 'Иванов Иван',
          },
          {
            id: 'receipt-4',
            receiptNumber: '00004-1',
            type: 'sale',
            amount: 2100.0,
            paymentMethod: 'Карта',
            time: dayjs().subtract(1, 'hour').toISOString(),
            cashierName: 'Петрова Анна',
          },
          {
            id: 'receipt-5',
            receiptNumber: '00005-1',
            type: 'sale',
            amount: 4300.0,
            paymentMethod: 'Наличные',
            time: dayjs().subtract(1.5, 'hour').toISOString(),
            cashierName: 'Иванов Иван',
          },
        ];

        setTransactions(mockTransactions);
      } catch (error) {
        console.error('Ошибка при загрузке транзакций:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Колонки таблицы транзакций
  const columns: ColumnsType<Transaction> = [
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
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'sale' ? 'green' : 'orange'}>
          {type === 'sale' ? 'Продажа' : 'Возврат'}
        </Tag>
      ),
    },
    {
      title: 'Время',
      dataIndex: 'time',
      key: 'time',
      render: (time) => dayjs(time).format('HH:mm'),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount) => (
        <span style={{ color: amount < 0 ? '#f5222d' : '#52c41a' }}>
          {amount.toFixed(2)} ₽
        </span>
      ),
    },
    {
      title: 'Способ оплаты',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Кассир',
      dataIndex: 'cashierName',
      key: 'cashierName',
      responsive: ['md'],
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Просмотреть чек">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                navigate(`/cashier/${shopId}/receipt/${record.id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Распечатать чек">
            <Button
              type="text"
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => console.log(`Печать чека ${record.receiptNumber}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card className="shadow-sm">
      <div className="mb-4 flex justify-between items-center">
        <Title level={5} className="m-0">
          Последние транзакции
        </Title>
        <Button
          type="link"
          onClick={() => navigate(`/cashier/${shopId}/shifts`)}
          icon={<RightOutlined />}
        >
          Все транзакции
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : transactions.length === 0 ? (
        <Empty
          description="Нет транзакций"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      )}
    </Card>
  );
};

export default RecentTransactions;
