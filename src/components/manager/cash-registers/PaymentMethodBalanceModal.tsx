import { useState, useEffect } from 'react';
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
  InfoCircleOutlined,
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
  paymentMethod: initialPaymentMethod,
  warehouseId,
}: PaymentMethodBalanceModalProps) {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('history');
  const [paymentMethod, setPaymentMethod] =
    useState<RegisterPaymentMethod>(initialPaymentMethod);

  // Получение актуальных данных о методе оплаты
  const { data: currentCashRegister, refetch: refetchCashRegister } = useQuery({
    queryKey: [
      'cash-register-detail',
      warehouseId,
      initialPaymentMethod.cashRegisterId,
    ],
    queryFn: () => {
      // Проверяем, есть ли у метода оплаты привязка к кассе
      if (!initialPaymentMethod.cashRegisterId) {
        // Для общих методов оплаты нет привязки к конкретной кассе
        return Promise.resolve(null);
      }
      return cashRegistersApi.getOne(
        warehouseId,
        initialPaymentMethod.cashRegisterId
      );
    },
    enabled: isOpen && !!initialPaymentMethod.cashRegisterId,
  });

  // Получение истории транзакций
  const {
    data: transactions,
    isLoading,
    refetch: refetchTransactions,
  } = useQuery({
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

  // Обновляем состояние paymentMethod при изменении данных
  useEffect(() => {
    if (currentCashRegister) {
      const updatedMethod = currentCashRegister.paymentMethods.find(
        (method) => method.id === initialPaymentMethod.id
      );
      if (updatedMethod) {
        setPaymentMethod(updatedMethod);
      }
    } else if (initialPaymentMethod.isShared) {
      // Для общих методов оплаты обновляем данные только при изменении initialPaymentMethod
      // и при получении данных о транзакциях
      if (transactions && transactions.length > 0) {
        // Если есть транзакции, обновляем баланс из последней транзакции
        const latestTransaction = transactions[0];
        if (latestTransaction) {
          setPaymentMethod((prevMethod) => ({
            ...prevMethod,
            currentBalance: latestTransaction.balanceAfter,
          }));
        }
      }
    }
  }, [currentCashRegister, initialPaymentMethod.id, transactions]);

  // Мутация для пополнения баланса
  const depositMutation = useMutation({
    mutationFn: (values: { amount: number; note?: string }) =>
      cashRegistersApi.depositToPaymentMethod(
        warehouseId,
        paymentMethod.id,
        values.amount,
        values.note
      ),
    onSuccess: (data) => {
      message.success('Баланс успешно пополнен');
      depositForm.resetFields();

      // Обновляем данные
      refetchCashRegister();
      refetchTransactions();

      // Также инвалидируем запрос общего списка касс для обновления на других страницах
      queryClient.invalidateQueries({
        queryKey: ['cash-registers', warehouseId],
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
    onSuccess: (data) => {
      message.success('Средства успешно изъяты');
      withdrawForm.resetFields();

      // Обновляем данные
      refetchCashRegister();
      refetchTransactions();

      // Также инвалидируем запрос общего списка касс для обновления на других страницах
      queryClient.invalidateQueries({
        queryKey: ['cash-registers', warehouseId],
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
                {paymentMethod.isShared && (
                  <Tag color="geekblue" className="ml-2">
                    Общий
                  </Tag>
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

          {paymentMethod.isShared && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200">
                <InfoCircleOutlined className="mr-2 text-blue-500" />
                <span className="font-medium">Общий метод оплаты:</span> Этот
                метод доступен во всех кассах склада. Баланс отслеживается
                централизованно, и все операции пополнения или изъятия средств,
                выполненные из любой кассы, будут отражены здесь.
              </div>
            </div>
          )}
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
                className="w-full bg-blue-600 hover:bg-blue-700"
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
