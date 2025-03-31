import React, { useState } from 'react';
import { Modal, Form, InputNumber, Select, Input, message } from 'antd';
import { Debt } from '@/types/debt';
import { RegisterPaymentMethod } from '@/types/cash-register';
import { addDebtPayment } from '@/services/managerApi';

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

  return (
    <Modal
      title="Добавить оплату"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
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
                  ` (Баланс: ${method.currentBalance.toFixed(2)})`}
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
              max: debt.remainingAmount,
              message: `Сумма должна быть от 0.01 до ${debt.remainingAmount.toFixed(
                2
              )}`,
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
          <p>Общая сумма: {debt.totalAmount.toFixed(2)}</p>
          <p>Оплачено: {debt.paidAmount.toFixed(2)}</p>
          <p>Осталось оплатить: {debt.remainingAmount.toFixed(2)}</p>
        </div>
      </Form>
    </Modal>
  );
};
