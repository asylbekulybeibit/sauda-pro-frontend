import React, { FC, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  Alert,
  Spin,
  Empty,
  Input,
  Select,
} from 'antd';
import { useDebts } from '@/hooks/useDebts';
import { Debt, DebtType, DebtStatus } from '@/types/debt';
import { formatDate, formatPrice } from '@/utils/format';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface DebtsListProps {
  warehouseId: string;
  onPaymentClick: (debt: Debt) => void;
  onCancelClick: (debt: Debt) => void;
}

export const DebtsList: FC<DebtsListProps> = ({
  warehouseId,
  onPaymentClick,
  onCancelClick,
}) => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<DebtType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DebtStatus | 'all'>('all');

  const {
    debts = [] as Debt[],
    statistics,
    isLoadingDebts,
    isLoadingStatistics,
    debtsError,
    statisticsError,
    refetchDebts,
    refetchStatistics,
  } = useDebts(warehouseId);

  console.log('[DebtsList] Loading states:', {
    isLoadingDebts,
    isLoadingStatistics,
  });
  console.log('[DebtsList] Errors:', { debtsError, statisticsError });
  console.log('[DebtsList] Data:', { debts, statistics });

  if (debtsError || statisticsError) {
    console.error('[DebtsList] Error loading data:', {
      debtsError,
      statisticsError,
    });
    return (
      <Alert
        message="Ошибка"
        description="Не удалось загрузить данные о долгах"
        type="error"
      />
    );
  }

  if (isLoadingDebts || isLoadingStatistics) {
    console.log('[DebtsList] Still loading data...');
    return <Spin />;
  }

  if (!debts?.length) {
    console.log('[DebtsList] No debts found');
    return <Empty description="Нет долгов" />;
  }

  const filteredDebts = debts.filter((debt) => {
    const matchesSearch = debt.supplier?.name
      ?.toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesType = typeFilter === 'all' || debt.type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' || debt.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  console.log('[DebtsList] Rendering table with debts:', filteredDebts.length);

  // Фильтры статусов без CANCELLED
  const statusOptions = [
    { value: 'all', label: 'Все' },
    { value: DebtStatus.ACTIVE, label: 'Активные' },
    { value: DebtStatus.PARTIALLY_PAID, label: 'Частично оплачены' },
    { value: DebtStatus.PAID, label: 'Оплачены' },
  ];

  const getColumns = (onPaymentClick: (debt: Debt) => void) => [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: DebtType) => (
        <Tag color={type === DebtType.PAYABLE ? 'red' : 'green'}>
          {type === DebtType.PAYABLE ? 'Мы должны' : 'Нам должны'}
        </Tag>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: DebtStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Контрагент',
      key: 'counterparty',
      render: (_: unknown, record: Debt) => (
        <div>
          <div>{record.supplier?.name || '—'}</div>
          {record.purchase && (
            <div className="text-xs text-gray-500">
              Приход №{record.purchase.invoiceNumber || record.purchase.id}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Сумма, KZT',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: 'Оплачено, KZT',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: 'Осталось, KZT',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Debt) => (
        <Space>
          {record.status !== DebtStatus.PAID && (
            <Button
              type="primary"
              onClick={() => onPaymentClick(record)}
              className="bg-blue-600 hover:bg-blue-600"
              style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
            >
              Оплатить
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Statistic
                title="Мы должны"
                value={debts
                  .filter((debt) => debt.type === DebtType.PAYABLE)
                  .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0)}
                precision={0}
                formatter={(value) => formatPrice(value)}
                suffix="KZT"
              />
              <Statistic
                title="Нам должны"
                value={debts
                  .filter((debt) => debt.type === DebtType.RECEIVABLE)
                  .reduce((sum, debt) => sum + Number(debt.remainingAmount), 0)}
                precision={0}
                formatter={(value) => formatPrice(value)}
                suffix="KZT"
              />
              
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="mb-4 flex flex-wrap gap-4">
          <Input.Search
            placeholder="Поиск по поставщику или комментарию"
            onSearch={(value) => setSearchText(value)}
            style={{ width: 300 }}
          />
          <Select
            defaultValue="all"
            style={{ width: 200 }}
            onChange={(value) => setTypeFilter(value as DebtType | 'all')}
          >
            <Option value="all">Все типы</Option>
            <Option value={DebtType.PAYABLE}>Мы должны</Option>
            <Option value={DebtType.RECEIVABLE}>Нам должны</Option>
          </Select>
          <Select
            defaultValue="all"
            style={{ width: 200 }}
            onChange={(value) => setStatusFilter(value as DebtStatus | 'all')}
          >
            {statusOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>

        <Table
          dataSource={debts}
          columns={getColumns(onPaymentClick)}
          loading={isLoadingDebts}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

const getStatusColor = (status: DebtStatus) => {
  switch (status) {
    case DebtStatus.ACTIVE:
      return 'blue';
    case DebtStatus.PARTIALLY_PAID:
      return 'orange';
    case DebtStatus.PAID:
      return 'green';
    case DebtStatus.CANCELLED:
      return 'red';
    default:
      return 'default';
  }
};

const getStatusText = (status: DebtStatus) => {
  switch (status) {
    case DebtStatus.ACTIVE:
      return 'Активен';
    case DebtStatus.PARTIALLY_PAID:
      return 'Частично оплачен';
    case DebtStatus.PAID:
      return 'Оплачен';
    case DebtStatus.CANCELLED:
      return 'Отменен';
    default:
      return status;
  }
};
