import React from 'react';
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
} from 'antd';
import { useDebts } from '@/hooks/useDebts';
import { Debt, DebtType, DebtStatus } from '@/types/debt';
import { formatDate, formatPrice } from '@/utils/format';

const { Title } = Typography;

interface DebtsListProps {
  warehouseId: string;
  onPaymentClick: (debt: Debt) => void;
  onCancelClick: (debt: Debt) => void;
}

export const DebtsList: React.FC<DebtsListProps> = ({
  warehouseId,
  onPaymentClick,
  onCancelClick,
}) => {
  const { debts, isLoadingDebts, statistics, isLoadingStatistics } =
    useDebts(warehouseId);

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

  const columns = [
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
      render: (_: unknown, record: Debt) => record.supplier?.name || '—',
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: 'Оплачено',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: 'Осталось',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: 'Срок',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => (date ? formatDate(date) : '—'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: Debt) => (
        <Space>
          {record.status !== DebtStatus.PAID &&
            record.status !== DebtStatus.CANCELLED && (
              <>
                <Button type="primary" onClick={() => onPaymentClick(record)}>
                  Оплатить
                </Button>
                <Button danger onClick={() => onCancelClick(record)}>
                  Отменить
                </Button>
              </>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {statistics && (
        <Card className="mb-4">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Мы должны"
                value={statistics.totalPayable}
                precision={2}
                prefix="₽"
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Нам должны"
                value={statistics.totalReceivable}
                precision={2}
                prefix="₽"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Активные долги"
                value={statistics.activeDebtsCount}
                suffix={` из ${
                  statistics.activeDebtsCount +
                  statistics.partiallyPaidCount +
                  statistics.paidDebtsCount
                }`}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card>
        <Title level={4}>Список долгов</Title>
        <Table
          dataSource={debts}
          columns={columns}
          rowKey="id"
          loading={isLoadingDebts || isLoadingStatistics}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Всего ${total} записей`,
          }}
        />
      </Card>
    </div>
  );
};
