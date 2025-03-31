import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Receipt, ReceiptItem } from '../../types/cashier';
import { cashierApi } from '../../services/cashierApi';
import styles from './HistoryPage.module.css';

const HistoryPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Загрузка списка чеков за выбранную дату
  useEffect(() => {
    const fetchReceipts = async () => {
      if (!warehouseId) return;

      setLoading(true);
      setError(null);
      try {
        const data = await cashierApi.getReceipts(warehouseId, {
          date: dateFilter,
        });
        setReceipts(data);
      } catch (err) {
        console.error('Ошибка при загрузке чеков:', err);
        setError('Не удалось загрузить историю чеков');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [warehouseId, dateFilter]);

  // Обработчик выбора чека
  const handleReceiptSelect = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setDetailsLoading(true);

    try {
      if (!warehouseId) return;

      const data = await cashierApi.getReceiptDetails(warehouseId, receipt.id);
      setReceiptItems(data.items);
    } catch (err) {
      console.error('Ошибка при загрузке деталей чека:', err);
      setError('Не удалось загрузить детали чека');
      setReceiptItems([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Форматирование даты и времени
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Форматирование суммы с валютой
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ₽`;
  };

  return (
    <div className={styles.historyPage}>
      <h2 className={styles.pageTitle}>История продаж</h2>

      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>
          Дата:
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.dateInput}
          />
        </label>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.contentContainer}>
        <div className={styles.receiptsList}>
          <h2>Чеки за {dateFilter}</h2>
          {loading ? (
            <div className={styles.loading}>Загрузка чеков...</div>
          ) : receipts.length === 0 ? (
            <div className={styles.emptyState}>
              Чеки за выбранную дату не найдены
            </div>
          ) : (
            <div className={styles.receiptsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.headerCell}>№</div>
                <div className={styles.headerCell}>Время</div>
                <div className={styles.headerCell}>Сумма</div>
                <div className={styles.headerCell}>Статус</div>
              </div>
              <div className={styles.tableBody}>
                {receipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className={`${styles.tableRow} ${
                      selectedReceipt?.id === receipt.id ? styles.selected : ''
                    }`}
                    onClick={() => handleReceiptSelect(receipt)}
                  >
                    <div className={styles.cell}>{receipt.number}</div>
                    <div className={styles.cell}>
                      {formatDateTime(receipt.createdAt)}
                    </div>
                    <div className={styles.cell}>
                      {formatCurrency(receipt.totalAmount)}
                    </div>
                    <div className={styles.cell}>
                      <span
                        className={`${styles.status} ${
                          receipt.status === 'PAID'
                            ? styles.paid
                            : receipt.status === 'CANCELLED'
                            ? styles.cancelled
                            : ''
                        }`}
                      >
                        {receipt.status === 'PAID'
                          ? 'Оплачен'
                          : receipt.status === 'CANCELLED'
                          ? 'Отменен'
                          : 'В обработке'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.receiptDetails}>
          <h2>Детали чека</h2>
          {!selectedReceipt ? (
            <div className={styles.emptyState}>
              Выберите чек для просмотра деталей
            </div>
          ) : detailsLoading ? (
            <div className={styles.loading}>Загрузка деталей...</div>
          ) : (
            <div className={styles.details}>
              <div className={styles.receiptHeader}>
                <div className={styles.receiptInfo}>
                  <div>
                    <strong>Чек №:</strong> {selectedReceipt.number}
                  </div>
                  <div>
                    <strong>Дата:</strong>{' '}
                    {formatDateTime(selectedReceipt.createdAt)}
                  </div>
                  <div>
                    <strong>Статус:</strong>{' '}
                    {selectedReceipt.status === 'PAID'
                      ? 'Оплачен'
                      : selectedReceipt.status === 'CANCELLED'
                      ? 'Отменен'
                      : 'В обработке'}
                  </div>
                  <div>
                    <strong>Способ оплаты:</strong>{' '}
                    {selectedReceipt.paymentMethod === 'CASH'
                      ? 'Наличные'
                      : selectedReceipt.paymentMethod === 'CARD'
                      ? 'Карта'
                      : 'Не указан'}
                  </div>
                </div>
              </div>

              <div className={styles.itemsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.headerCell}>Товар</div>
                  <div className={styles.headerCell}>Цена</div>
                  <div className={styles.headerCell}>Кол-во</div>
                  <div className={styles.headerCell}>Сумма</div>
                </div>
                <div className={styles.tableBody}>
                  {receiptItems.length === 0 ? (
                    <div className={styles.emptyItems}>
                      Нет данных о товарах в чеке
                    </div>
                  ) : (
                    receiptItems.map((item, index) => (
                      <div key={index} className={styles.tableRow}>
                        <div className={styles.cell}>{item.name}</div>
                        <div className={styles.cell}>
                          {formatCurrency(item.price)}
                        </div>
                        <div className={styles.cell}>{item.quantity}</div>
                        <div className={styles.cell}>
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Итого:</span>
                  <span className={styles.totalValue}>
                    {formatCurrency(selectedReceipt.totalAmount)}
                  </span>
                </div>
                {selectedReceipt.paymentMethod === 'CASH' && (
                  <>
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Получено:</span>
                      <span className={styles.totalValue}>
                        {formatCurrency(selectedReceipt.receivedAmount || 0)}
                      </span>
                    </div>
                    <div className={styles.totalRow}>
                      <span className={styles.totalLabel}>Сдача:</span>
                      <span className={styles.totalValue}>
                        {formatCurrency(
                          (selectedReceipt.receivedAmount || 0) -
                            selectedReceipt.totalAmount
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.actions}>
                <button className={styles.printButton}>Распечатать чек</button>
                <button
                  className={styles.returnButton}
                  disabled={selectedReceipt.status !== 'PAID'}
                >
                  Оформить возврат
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
