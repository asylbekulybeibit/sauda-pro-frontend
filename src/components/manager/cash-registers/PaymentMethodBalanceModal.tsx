import { useState } from 'react';
import {
  Modal,
  Button,
  Tabs,
  Table,
  Space,
  Tag,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
} from 'antd';
import { cashRegistersApi } from '@/services/cashRegistersApi';
import {
  RegisterPaymentMethod,
  PaymentMethodTransaction,
  PaymentMethodTransactionType,
} from '@/types/cash-register';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface PaymentMethodBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: RegisterPaymentMethod;
  warehouseId: string;
}

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

export function PaymentMethodBalanceModal({
  isOpen,
  onClose,
  paymentMethod,
  warehouseId,
}: PaymentMethodBalanceModalProps) {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('history');

  // Получение истории транзакций
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['paymentMethodTransactions', paymentMethod.id, dateRange],
    queryFn: () =>
      cashRegistersApi.getPaymentMethodTransactions(
        warehouseId,
        paymentMethod.id,
        dateRange
          ? {
              startDate: dateRange[0]?.toISOString(),
              endDate: dateRange[1]?.toISOString(),
            }
          : undefined
      ),
    enabled: isOpen,
  });

  // Мутация для пополнения баланса
  const depositMutation = useMutation({
    mutationFn: (values: { amount: number; note?: string }) =>
      cashRegistersApi.depositToPaymentMethod(
        warehouseId,
        paymentMethod.id,
        values.amount,
        values.note
      ),
    onSuccess: () => {
      message.success('Баланс успешно пополнен');
      depositForm.resetFields();
      // Обновляем данные о методе оплаты и историю транзакций
      queryClient.invalidateQueries({
        queryKey: ['cash-registers', warehouseId],
      });
      queryClient.invalidateQueries({
        queryKey: ['paymentMethodTransactions', paymentMethod.id],
      });
    },
    onError: (error: any) => {
      message.error(
        `Ошибка при пополнении баланса: ${
          error.response?.data?.message || 'Неизвестная ошибка'
        }`
      );
    },
  });

  // Мутация для изъятия средств
  const withdrawMutation = useMutation({
    mutationFn: (values: { amount: number; note?: string }) =>
      cashRegistersApi.withdrawFromPaymentMethod(
        warehouseId,
        paymentMethod.id,
        values.amount,
        values.note
      ),
    onSuccess: () => {
      message.success('Средства успешно изъяты');
      withdrawForm.resetFields();
      // Обновляем данные о методе оплаты и историю транзакций
      queryClient.invalidateQueries({
        queryKey: ['cash-registers', warehouseId],
      });
      queryClient.invalidateQueries({
        queryKey: ['paymentMethodTransactions', paymentMethod.id],
      });
    },
    onError: (error: any) => {
      message.error(
        `Ошибка при изъятии средств: ${
          error.response?.data?.message || 'Неизвестная ошибка'
        }`
      );
    },
  });

  // Обработчик пополнения баланса
  const handleDeposit = (values: { amount: number; note?: string }) => {
    depositMutation.mutate(values);
  };

  // Обработчик изъятия средств
  const handleWithdraw = (values: { amount: number; note?: string }) => {
    withdrawMutation.mutate(values);
  };

  // Обработчик изменения диапазона дат
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  // Колонки для таблицы истории транзакций
  const columns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Тип операции',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: PaymentMethodTransactionType) => {
        const typeMap: Record<
          PaymentMethodTransactionType,
          { label: string; color: string }
        > = {
          [PaymentMethodTransactionType.SALE]: {
            label: 'Продажа',
            color: 'green',
          },
          [PaymentMethodTransactionType.REFUND]: {
            label: 'Возврат',
            color: 'orange',
          },
          [PaymentMethodTransactionType.DEPOSIT]: {
            label: 'Пополнение',
            color: 'blue',
          },
          [PaymentMethodTransactionType.WITHDRAWAL]: {
            label: 'Изъятие',
            color: 'red',
          },
          [PaymentMethodTransactionType.PURCHASE]: {
            label: 'Закупка',
            color: 'purple',
          },
          [PaymentMethodTransactionType.ADJUSTMENT]: {
            label: 'Корректировка',
            color: 'gray',
          },
        };
        return (
          <Tag color={typeMap[type]?.color || 'default'}>
            {typeMap[type]?.label || type}
          </Tag>
        );
      },
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: Number(amount) >= 0 ? 'green' : 'red' }}>
          {Number(amount) >= 0
            ? `+${Number(amount).toFixed(2)}`
            : Number(amount).toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Баланс до',
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      render: (balance: number) => Number(balance).toFixed(2),
    },
    {
      title: 'Баланс после',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (balance: number) => Number(balance).toFixed(2),
    },
    {
      title: 'Примечание',
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => note || '-',
    },
  ];

  return (
    <Modal
      title={`Баланс метода оплаты: ${paymentMethod.name}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <div className="mb-4">
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Текущий баланс</div>
              <div className="text-2xl font-bold">
                {Number(paymentMethod.currentBalance).toFixed(2)} ₸
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Тип</div>
              <div>
                {paymentMethod.source === 'system' ? (
                  <Tag color="blue">{paymentMethod.systemType}</Tag>
                ) : (
                  <Tag color="green">Кастомный</Tag>
                )}
              </div>
            </div>
            {paymentMethod.accountDetails && (
              <div>
                <div className="text-sm text-gray-600">Детали счета</div>
                <div>{paymentMethod.accountDetails}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              История операций
            </span>
          }
          key="history"
        >
          <div className="mb-4">
            <RangePicker onChange={handleDateRangeChange} allowClear />
          </div>
          <Table
            dataSource={transactions}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ArrowUpOutlined />
              Пополнение
            </span>
          }
          key="deposit"
        >
          <Form
            form={depositForm}
            layout="vertical"
            onFinish={handleDeposit}
            initialValues={{ amount: 0 }}
          >
            <Form.Item
              name="amount"
              label="Сумма пополнения"
              rules={[
                { required: true, message: 'Пожалуйста, введите сумму' },
                {
                  validator: (_, value) =>
                    value > 0
                      ? Promise.resolve()
                      : Promise.reject('Сумма должна быть больше нуля'),
                },
              ]}
            >
              <InputNumber
                min={0.01}
                step={0.01}
                style={{ width: '100%' }}
                addonAfter="₸"
              />
            </Form.Item>

            <Form.Item name="note" label="Примечание">
              <Input.TextArea
                rows={3}
                placeholder="Введите примечание к операции"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={depositMutation.isPending}
                className="w-full"
              >
                Пополнить баланс
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane
          tab={
            <span>
              <ArrowDownOutlined />
              Изъятие
            </span>
          }
          key="withdraw"
        >
          <Form
            form={withdrawForm}
            layout="vertical"
            onFinish={handleWithdraw}
            initialValues={{ amount: 0 }}
          >
            <Form.Item
              name="amount"
              label="Сумма изъятия"
              rules={[
                { required: true, message: 'Пожалуйста, введите сумму' },
                {
                  validator: (_, value) =>
                    value > 0
                      ? Promise.resolve()
                      : Promise.reject('Сумма должна быть больше нуля'),
                },
                {
                  validator: (_, value) =>
                    value <= Number(paymentMethod.currentBalance)
                      ? Promise.resolve()
                      : Promise.reject('Недостаточно средств на балансе'),
                },
              ]}
            >
              <InputNumber
                min={0.01}
                step={0.01}
                max={Number(paymentMethod.currentBalance)}
                style={{ width: '100%' }}
                addonAfter="₸"
              />
            </Form.Item>

            <Form.Item name="note" label="Примечание">
              <Input.TextArea
                rows={3}
                placeholder="Введите примечание к операции"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={withdrawMutation.isPending}
                className="w-full"
                disabled={Number(paymentMethod.currentBalance) <= 0}
              >
                Изъять средства
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
}
