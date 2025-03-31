import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  message,
  Modal,
  InputNumber,
  Alert,
} from 'antd';
import { RegisterPaymentMethod } from '@/types/cash-register';
import { formatPrice } from '@/utils/format';

const { Text } = Typography;

interface PurchasePaymentFormProps {
  totalAmount: number;
  paidAmount: number;
  onSubmit: (values: {
    paymentMethodId: string;
    amount: number;
    note?: string;
  }) => void;
  paymentMethods: RegisterPaymentMethod[];
  visible: boolean;
  onClose: () => void;
}

export const PurchasePaymentForm: React.FC<PurchasePaymentFormProps> = ({
  totalAmount = 0,
  paidAmount = 0,
  onSubmit,
  paymentMethods,
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<RegisterPaymentMethod | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const remainingAmount = Number(totalAmount) - Number(paidAmount);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Проверяем баланс выбранного метода оплаты
      const selectedPaymentMethod = paymentMethods.find(
        (m) => m.id === values.paymentMethodId
      );
      if (
        selectedPaymentMethod &&
        selectedPaymentMethod.currentBalance < values.amount
      ) {
        setErrorMessage(
          `Недостаточно средств для оплаты. Доступный баланс: ${formatPrice(
            selectedPaymentMethod.currentBalance
          )}`
        );
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      onSubmit(values);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    const method = paymentMethods.find((m) => m.id === paymentMethodId);
    setSelectedMethod(method || null);
    setErrorMessage(null);
  };

  const getPaymentMethodLabel = (method: RegisterPaymentMethod) => {
    const name = method.name || method.systemType;
    const balance =
      method.currentBalance !== undefined
        ? ` (Баланс: ${formatPrice(method.currentBalance)})`
        : '';
    const source = method.isShared
      ? ' (Общий)'
      : method.cashRegister?.name
      ? ` (Касса: ${method.cashRegister.name})`
      : '';
    return `${name}${balance}${source}`;
  };

  return (
    <Modal
      title="Добавить оплату"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          className="bg-blue-600 hover:bg-blue-600"
        >
          Добавить оплату
        </Button>,
      ]}
      maskClosable={false}
    >
      <div className="mb-4">
        <Text>Общая сумма: {formatPrice(totalAmount)}</Text>
        <br />
        <Text>Оплачено: {formatPrice(paidAmount)}</Text>
        <br />
        <Text strong>Осталось оплатить: {formatPrice(remainingAmount)}</Text>
      </div>

      {errorMessage && (
        <Alert message={errorMessage} type="error" showIcon className="mb-4" />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="paymentMethodId"
          label="Метод оплаты"
          rules={[{ required: true, message: 'Выберите метод оплаты' }]}
        >
          <Select
            placeholder="Выберите метод оплаты"
            onChange={handlePaymentMethodChange}
          >
            {paymentMethods.map((method) => (
              <Select.Option key={method.id} value={method.id}>
                {getPaymentMethodLabel(method)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amount"
          label="Сумма"
          rules={[
            { required: true, message: 'Введите сумму' },
            {
              type: 'number',
              min: 0.01,
              max: remainingAmount,
              message: `Сумма должна быть от 0.01 до ${formatPrice(
                remainingAmount
              )}`,
            },
            {
              validator: (_, value) => {
                if (selectedMethod && value > selectedMethod.currentBalance) {
                  return Promise.reject(
                    `Недостаточно средств. Доступный баланс: ${formatPrice(
                      selectedMethod.currentBalance
                    )}`
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Введите сумму"
            step={0.01}
            precision={2}
          />
        </Form.Item>

        <Form.Item name="note" label="Примечание">
          <Input.TextArea placeholder="Введите примечание (необязательно)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
