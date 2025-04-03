import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Receipt, ReceiptItem } from '../../types/cashier';
import { cashierApi } from '../../services/cashierApi';
import { cashRegistersApi } from '../../services/cashRegistersApi';
import styles from './HistoryPage.module.css';
import { Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const HistoryPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<{
    [key: string]: string;
  }>({});

  // Загрузка текущей смены
  useEffect(() => {
    const fetchCurrentShift = async () => {
      if (!warehouseId) return;

      try {
        const shift = await cashierApi.getCurrentShift(warehouseId);
        setCurrentShift(shift);
      } catch (err) {
        console.error('Ошибка при загрузке текущей смены:', err);
        setError('Не удалось загрузить информацию о текущей смене');
      }
    };

    fetchCurrentShift();
  }, [warehouseId]);

  // Загрузка методов оплаты
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!warehouseId) return;

      try {
        const methods = await cashRegistersApi.getAllPaymentMethods(
          warehouseId
        );
        const methodsMap = methods.reduce(
          (acc: { [key: string]: string }, method: any) => {
            // Если есть пользовательское имя - используем его
            // Иначе используем системное название на русском
            if (method.name) {
              acc[method.id] = method.name;
            } else if (method.systemType) {
              acc[method.id] =
                method.systemType === 'cash'
                  ? 'Наличные'
                  : method.systemType === 'card'
                  ? 'Банковская карта'
                  : method.systemType === 'qr'
                  ? 'QR-код'
                  : 'Не указан';
            } else {
              acc[method.id] = 'Не указан';
            }
            return acc;
          },
          {}
        );
        setPaymentMethods(methodsMap);
      } catch (err) {
        console.error('Ошибка при загрузке методов оплаты:', err);
      }
    };

    fetchPaymentMethods();
  }, [warehouseId]);

  // Загрузка списка чеков текущей смены
  useEffect(() => {
    const fetchReceipts = async () => {
      if (!warehouseId || !currentShift) return;

      setLoading(true);
      setError(null);
      try {
        const data = await cashierApi.getSalesHistory(warehouseId, {
          shiftId: currentShift.id,
        });
        // Фильтруем только завершенные операции
        const completedReceipts = data.filter((receipt: Receipt) =>
          ['PAID', 'REFUNDED', 'CANCELLED'].includes(
            receipt.status.toUpperCase()
          )
        );
        setReceipts(completedReceipts);
      } catch (err) {
        console.error('Ошибка при загрузке чеков:', err);
        setError('Не удалось загрузить историю чеков');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [warehouseId, currentShift]);

  // Обработчик выбора чека
  const handleReceiptSelect = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setDetailsLoading(true);

    try {
      if (!warehouseId) return;

      const data = await cashierApi.getSalesReceiptDetails(
        warehouseId,
        receipt.id
      );
      if (data) {
        setReceiptItems(data.items);
      } else {
        setError('Не удалось загрузить детали чека');
        setReceiptItems([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке деталей чека:', err);
      setError('Не удалось загрузить детали чека');
      setReceiptItems([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Обработчик печати чека
  const handlePrintReceipt = async (receipt: Receipt) => {
    if (!warehouseId) return;

    try {
      await cashierApi.printReceipt(warehouseId, receipt.id);
    } catch (err) {
      console.error('Ошибка при печати чека:', err);
      setError('Не удалось распечатать чек');
    }
  };

  // Форматирование даты и времени
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Форматирование суммы с валютой
  const formatCurrency = (amount: number | null | undefined) => {
    const validAmount = Number(amount || 0);
    // Для возвратов показываем положительное число
    return `${Math.abs(validAmount).toFixed(2)} ₸`;
  };

  // Получение метода оплаты на русском
  const getPaymentMethod = (paymentMethodId: string | null | undefined) => {
    if (!paymentMethodId) return 'Не указан';
    return paymentMethods[paymentMethodId] || 'Не указан';
  };

  // Получение статуса чека на русском
  const getReceiptStatus = (status: string, amount: number) => {
    // Если сумма отрицательная - это чек возврата
    if (amount < 0) {
      return 'Возврат';
    }

    switch (status.toUpperCase()) {
      case 'PAID':
      case 'REFUNDED':
        return 'Оплачен';
      case 'CANCELLED':
        return 'Отменен';
      default:
        return 'В обработке';
    }
  };

  // Получение класса стиля для статуса
  const getStatusClass = (status: string, amount: number) => {
    // Если сумма отрицательная - это чек возврата
    if (amount < 0) {
      return styles.statusRefunded;
    }

    switch (status.toUpperCase()) {
      case 'PAID':
      case 'REFUNDED':
        return styles.statusPaid;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  return (
    <div className={styles.historyPage}>
      <h1 className={styles.pageTitle}>История продаж текущей смены</h1>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.content}>
        <div className={styles.receiptsListContainer}>
          {loading ? (
            <div className={styles.loading}>Загрузка чеков...</div>
          ) : receipts.length === 0 ? (
            <div className={styles.noReceipts}>Нет чеков в текущей смене</div>
          ) : (
            <div className={styles.receiptsList}>
              <div className={styles.receiptsHeader}>
                <div className={styles.headerCell}>№</div>
                <div className={styles.headerCell}>Время</div>
                <div className={styles.headerCell}>Сумма</div>
                <div className={styles.headerCell}>Статус</div>
                <div className={styles.headerCell}>Действия</div>
              </div>
              <div className={styles.tableBody}>
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className={`${styles.receiptItem} ${
                      selectedReceipt?.id === receipt.id ? styles.selected : ''
                    }`}
                  >
                    <div
                      className={styles.receiptNumber}
                      onClick={() => handleReceiptSelect(receipt)}
                    >
                      {receipt.number}
                    </div>
                    <div
                      className={styles.receiptDate}
                      onClick={() => handleReceiptSelect(receipt)}
                    >
                      {formatDateTime(receipt.createdAt)}
                    </div>
                    <div
                      className={styles.receiptAmount}
                      onClick={() => handleReceiptSelect(receipt)}
                    >
                      {formatCurrency(receipt.totalAmount)}
                    </div>
                    <div
                      className={styles.receiptStatus}
                      onClick={() => handleReceiptSelect(receipt)}
                    >
                      <span
                        className={getStatusClass(
                          receipt.status,
                          receipt.totalAmount
                        )}
                      >
                        {getReceiptStatus(receipt.status, receipt.totalAmount)}
                        {receipt.totalAmount < 0 &&
                          receipt.returnedFromReceiptNumber && (
                            <div className={styles.returnInfo}>
                              по чеку №{receipt.returnedFromReceiptNumber}
                            </div>
                          )}
                      </span>
                    </div>
                    <div className={styles.receiptActions}>
                      <Button
                        startIcon={<PrintIcon />}
                        onClick={() => handlePrintReceipt(receipt)}
                        variant="outlined"
                        size="small"
                      >
                        Печать
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.receiptDetails}>
          {!selectedReceipt ? (
            <div className={styles.noSelection}>
              Выберите чек для просмотра деталей
            </div>
          ) : detailsLoading ? (
            <div className={styles.loading}>Загрузка деталей...</div>
          ) : (
            <>
              <div className={styles.detailsHeader}>
                <h2>Детали чека №{selectedReceipt.number}</h2>
                <Button
                  startIcon={<PrintIcon />}
                  onClick={() => handlePrintReceipt(selectedReceipt)}
                  variant="contained"
                >
                  Печать
                </Button>
              </div>
              <div className={styles.detailsContent}>
                <div className={styles.detailsSection}>
                  <h3>Информация о чеке</h3>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Дата и время:</span>
                    <span className={styles.detailValue}>
                      {formatDateTime(selectedReceipt.createdAt)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Статус:</span>
                    <span className={styles.detailValue}>
                      {getReceiptStatus(
                        selectedReceipt.status,
                        selectedReceipt.totalAmount
                      )}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Способ оплаты:</span>
                    <span className={styles.detailValue}>
                      {getPaymentMethod(selectedReceipt.paymentMethodId)}
                    </span>
                  </div>
                </div>

                <div className={styles.detailsSection}>
                  <h3>Товары</h3>
                  <div className={styles.itemsTable}>
                    <div className={styles.itemsHeader}>
                      <div className={styles.itemCell}>Наименование</div>
                      <div className={styles.itemCell}>Цена</div>
                      <div className={styles.itemCell}>Кол-во</div>
                      <div className={styles.itemCell}>Скидка</div>
                      <div className={styles.itemCell}>Сумма</div>
                    </div>
                    {receiptItems.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemPrice}>
                          {formatCurrency(item.price)}
                        </div>
                        <div className={styles.itemQuantity}>
                          {item.quantity}
                        </div>
                        <div className={styles.itemDiscount}>
                          {formatCurrency(item.discountAmount || 0)}
                        </div>
                        <div className={styles.itemAmount}>
                          {formatCurrency(
                            item.price * item.quantity -
                              (item.discountAmount || 0)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.totalSection}>
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Сумма:</span>
                    <span className={styles.totalValue}>
                      {formatCurrency(selectedReceipt.totalAmount)}
                    </span>
                  </div>
                  <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Скидка:</span>
                    <span className={styles.totalValue}>
                      {formatCurrency(selectedReceipt.discountAmount)}
                    </span>
                  </div>
                  <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                    <span className={styles.totalLabel}>Итого к оплате:</span>
                    <span className={styles.totalValue}>
                      {formatCurrency(selectedReceipt.finalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
