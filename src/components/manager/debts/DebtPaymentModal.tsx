import React, { useState } from 'react';
import { Modal, Form, InputNumber, Select, Input, message } from 'antd';
import { Debt } from '@/types/debt';
import { RegisterPaymentMethod } from '@/types/cash-register';
import { addDebtPayment } from '@/services/managerApi';
import { formatPrice } from '@/utils/format';

interface DebtPaymentModalProps {
  debt: Debt;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentMethods: RegisterPaymentMethod[];
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  debt,
  visible,
  onClose,
  onSuccess,
  paymentMethods,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await addDebtPayment(debt.id, {
        paymentMethodId: values.paymentMethodId,
        amount: values.amount,
        note: values.note,
      });

      message.success('Оплата успешно добавлена');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Ошибка при добавлении оплаты'
      );
    } finally {
      setLoading(false);
    }
  };

  // Преобразуем remainingAmount в число
  const remainingAmount = Number(debt.remainingAmount);

  return (
    <Modal
      title="Добавить оплату"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okButtonProps={{
        className: 'bg-blue-600 hover:bg-blue-600',
        style: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="paymentMethodId"
          label="Метод оплаты"
          rules={[{ required: true, message: 'Выберите метод оплаты' }]}
        >
          <Select placeholder="Выберите метод оплаты">
            {paymentMethods.map((method) => (
              <Select.Option key={method.id} value={method.id}>
                {method.name || method.systemType}
                {method.currentBalance !== undefined &&
                  ` (Баланс: ${formatPrice(method.currentBalance)} KZT)`}
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
              )} KZT`,
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            precision={2}
            step={0.01}
            placeholder="Введите сумму"
          />
        </Form.Item>

        <Form.Item name="note" label="Примечание">
          <Input.TextArea
            rows={3}
            placeholder="Введите примечание (необязательно)"
          />
        </Form.Item>

        <div className="text-sm text-gray-500">
          <p>Общая сумма: {formatPrice(Number(debt.totalAmount))} KZT</p>
          <p>Оплачено: {formatPrice(Number(debt.paidAmount))} KZT</p>
          <p>Осталось оплатить: {formatPrice(remainingAmount)} KZT</p>
        </div>
      </Form>
    </Modal>
  );
};
