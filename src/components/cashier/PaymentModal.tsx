import React, { useState, useEffect } from 'react';
import styles from './PaymentModal.module.css';
import { PaymentMethodType } from '../../types/cashier';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSubmit: (paymentData: {
    paymentMethod: PaymentMethodType;
    amount: number;
    change?: number;
  }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onSubmit,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>(
    totalAmount.toFixed(2)
  );
  const [change, setChange] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Быстрые кнопки для выбора суммы
  const quickAmounts = [
    { label: 'Без сдачи', value: totalAmount },
    { label: '500 ₽', value: 500 },
    { label: '1000 ₽', value: 1000 },
    { label: '5000 ₽', value: 5000 },
  ];

  // Пересчитываем сдачу при изменении полученной суммы
  useEffect(() => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(receivedAmount);
      const changeAmount = received - totalAmount;
      setChange(changeAmount >= 0 ? changeAmount : 0);
    } else {
      setChange(0);
    }
  }, [receivedAmount, totalAmount, paymentMethod]);

  // Обработчик подтверждения оплаты
  const handleSubmit = () => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(receivedAmount);
      if (isNaN(received) || received < totalAmount) {
        setError('Полученная сумма должна быть не меньше суммы чека');
        return;
      }
    }

    onSubmit({
      paymentMethod,
      amount:
        paymentMethod === 'cash' ? parseFloat(receivedAmount) : totalAmount,
      change: paymentMethod === 'cash' ? change : 0,
    });
  };

  // Обработчик изменения полученной суммы
  const handleReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReceivedAmount(value);
    setError(null);
  };

  // Обработчик быстрого выбора суммы
  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount.toFixed(2));
    setError(null);
  };

  // Форматирование суммы для отображения
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ₽`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Оплата</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.totalAmount}>
            <span className={styles.totalLabel}>Сумма к оплате:</span>
            <span className={styles.totalValue}>
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className={styles.paymentMethods}>
            <h3>Способ оплаты</h3>
            <div className={styles.methods}>
              <button
                className={`${styles.methodButton} ${
                  paymentMethod === 'cash' ? styles.active : ''
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                Наличные
              </button>
              <button
                className={`${styles.methodButton} ${
                  paymentMethod === 'card' ? styles.active : ''
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                Карта
              </button>
              <button
                className={`${styles.methodButton} ${
                  paymentMethod === 'qr' ? styles.active : ''
                }`}
                onClick={() => setPaymentMethod('qr')}
              >
                QR-код
              </button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <>
              <div className={styles.receivedAmount}>
                <h3>Получено</h3>
                <input
                  type="number"
                  min={totalAmount}
                  step="0.01"
                  value={receivedAmount}
                  onChange={handleReceivedChange}
                  className={styles.amountInput}
                />

                <div className={styles.quickButtons}>
                  {quickAmounts.map((item) => (
                    <button
                      key={item.label}
                      className={styles.quickButton}
                      onClick={() => handleQuickAmount(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.changeAmount}>
                <h3>Сдача</h3>
                <span className={styles.changeValue}>
                  {formatCurrency(change)}
                </span>
              </div>
            </>
          )}

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          <button className={styles.submitButton} onClick={handleSubmit}>
            Оплатить
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
