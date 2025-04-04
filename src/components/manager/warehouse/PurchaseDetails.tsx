import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Table,
  Space,
  Typography,
  Tag,
  Modal,
  Row,
  Col,
  Divider,
  Descriptions,
  message,
  Spin,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { Purchase } from '@/types/purchase';
import { RegisterPaymentMethod } from '@/types/cash-register';
import { formatDate, formatPrice } from '@/utils/format';
import { addPurchasePayment, getPurchasePayments } from '@/services/managerApi';
import { PurchasePaymentForm } from './PurchasePaymentForm';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

interface PurchaseDetailsProps {
  purchase: Purchase | undefined;
  onClose: () => void;
  onUpdate?: () => void;
  paymentMethods: RegisterPaymentMethod[];
}

export const PurchaseDetails: React.FC<PurchaseDetailsProps> = ({
  purchase,
  onClose,
  onUpdate,
  paymentMethods,
}) => {
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const loadPayments = async () => {
    if (!purchase?.id || !purchase?.warehouseId) return;

    try {
      setIsLoadingPayments(true);
      const data = await getPurchasePayments(purchase.id, purchase.warehouseId);
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      message.error('Не удалось загрузить историю оплат');
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [purchase?.id]);

  if (!purchase) {
    return (
      <Modal
        title="Детали прихода"
        open={true}
        onCancel={onClose}
        width={1000}
        footer={null}
      >
        <div className="flex justify-center items-center p-8">
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  const handlePayment = async (payment: {
    paymentMethodId: string;
    amount: number;
    note?: string;
  }) => {
    try {
      setIsSubmitting(true);
      console.log('[handlePayment] Starting payment process:', {
        purchaseId: purchase.id,
        currentPaidAmount: purchase.paidAmount,
        currentRemainingAmount: purchase.remainingAmount,
        newPaymentAmount: payment.amount,
        payment,
      });

      await addPurchasePayment(purchase.id, payment);

      console.log('[handlePayment] Payment added successfully');

      if (onUpdate) {
        console.log('[handlePayment] Calling onUpdate to refresh data');
        onUpdate();
      }

      await loadPayments();

      setIsPaymentModalVisible(false);
      message.success('Оплата успешно добавлена');
    } catch (error) {
      console.error('[handlePayment] Error adding payment:', error);
      message.error(
        error instanceof Error ? error.message : 'Ошибка при добавлении оплаты'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToExcel = (purchase: Purchase) => {
    try {
      const fileTitle = `Приход_${purchase.invoiceNumber || purchase.id}_${
        new Date().toISOString().split('T')[0]
      }`;

      const itemsData = [
        ['Название', 'Количество', 'Цена', 'Сумма'],
        ...purchase.items.map((item) => [
          item.product?.name || '—',
          item.quantity.toString(),
          formatPrice(item.price || 0),
          formatPrice(item.total || (item.quantity || 0) * (item.price || 0)),
        ]),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Товары');
      XLSX.writeFile(wb, `${fileTitle}.xlsx`);

      message.success('Данные успешно экспортированы в Excel');
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      message.error('Не удалось экспортировать данные в Excel');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: ['product', 'name'],
      render: (name: string) => name || '—',
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      render: (price: number) => formatPrice(price),
    },
    {
      title: 'Сумма',
      dataIndex: 'total',
      render: (total: number, record: any) =>
        formatPrice(total || record.quantity * record.price),
    },
  ];

  const paymentColumns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Метод оплаты',
      dataIndex: ['paymentMethod', 'name'],
      render: (name: string, record: any) =>
        name || record.paymentMethod?.systemType || '—',
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      render: (amount: number) => formatPrice(Math.abs(amount)),
    },
    {
      title: 'Долг до',
      dataIndex: 'remainingBefore',
      render: (_: any, record: any) =>
        formatPrice(record.remainingBefore || purchase.totalAmount),
    },
    {
      title: 'Долг после',
      dataIndex: 'remainingAfter',
      render: (_: any, record: any) =>
        formatPrice(
          record.remainingAfter !== undefined
            ? record.remainingAfter
            : record.remainingBefore - record.amount
        ),
    },
  ];

  return (
    <Modal
      title="Детали прихода"
      open={true}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportToExcel(purchase)}
            >
              Экспорт в Excel
            </Button>
          </Space>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Дата">
              {formatDate(purchase.date)}
            </Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Tag color={purchase.status === 'completed' ? 'green' : 'blue'}>
                {purchase.status === 'completed' ? 'Завершен' : 'Черновик'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Поставщик">
              {purchase.supplier?.name || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Номер накладной">
              {purchase.invoiceNumber || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Склад">
              {purchase.warehouse?.name || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Комментарий">
              {purchase.comment || '—'}
            </Descriptions.Item>
          </Descriptions>

          <Table
            dataSource={purchase.items}
            columns={columns}
            pagination={false}
            summary={(pageData) => {
              const total = pageData.reduce(
                (sum, item) => sum + (item.total || 0),
                0
              );
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong>Итого:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>{formatPrice(total)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />

          <Divider />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Space split={true}>
              <Text>Общая сумма: {formatPrice(purchase.totalAmount)}</Text>
              <Text>Оплачено: {formatPrice(purchase.paidAmount)}</Text>
              <Text strong>
                Осталось оплатить: {formatPrice(purchase.remainingAmount)}
              </Text>
            </Space>

            <Button
              type="primary"
              onClick={() => setIsPaymentModalVisible(true)}
              disabled={purchase.remainingAmount <= 0}
              loading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-600"
            >
              Добавить оплату
            </Button>
          </Space>

          <Divider />

          <div>
            <Title level={5}>История оплат</Title>
            <Table
              dataSource={payments}
              columns={paymentColumns}
              pagination={false}
              loading={isLoadingPayments}
              locale={{
                emptyText: 'Нет оплат',
              }}
            />
          </div>
        </Space>
      </Card>

      <PurchasePaymentForm
        totalAmount={purchase.totalAmount}
        paidAmount={purchase.paidAmount}
        onSubmit={handlePayment}
        paymentMethods={paymentMethods}
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
      />
    </Modal>
  );
};

export default PurchaseDetails;
