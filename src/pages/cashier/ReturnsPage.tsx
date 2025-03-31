import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { cashierApi } from '../../services/cashierApi';
import { Receipt, ReceiptItem } from '../../types/cashier';
import styles from './ReturnsPage.module.css';

const ReturnsPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [returnReason, setReturnReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!warehouseId || !searchQuery) {
      setError('Введите номер чека для поиска');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // В реальном приложении тут будет поиск чека по номеру/получение по ID
      // Пока используем временное решение - получение списка чеков и фильтрацию
      const allReceipts = await cashierApi.getReceipts(warehouseId);
      const filtered = allReceipts.filter(
        (receipt: Receipt) =>
          receipt.number.includes(searchQuery) && receipt.status === 'PAID'
      );

      setReceipts(filtered);

      if (filtered.length === 0) {
        setError('Чеков с таким номером не найдено или они не оплачены');
      }
    } catch (err) {
      console.error('Ошибка при поиске чеков:', err);
      setError('Не удалось выполнить поиск чеков');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptSelect = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setSelectedItems({});

    try {
      if (!warehouseId) return;

      const data = await cashierApi.getReceiptDetails(warehouseId, receipt.id);
      setReceiptItems(data.items);
    } catch (err) {
      console.error('Ошибка при загрузке деталей чека:', err);
      setError('Не удалось загрузить детали чека');
      setReceiptItems([]);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const calculateReturnAmount = () => {
    return receiptItems
      .filter((item) => selectedItems[item.id])
      .reduce((sum, item) => sum + item.finalAmount, 0);
  };

  const handleReturn = async () => {
    if (!selectedReceipt || !warehouseId) return;

    const itemsToReturn = receiptItems.filter((item) => selectedItems[item.id]);

    if (itemsToReturn.length === 0) {
      setError('Выберите хотя бы один товар для возврата');
      return;
    }

    if (!returnReason.trim()) {
      setError('Укажите причину возврата');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Формируем данные для API запроса
      const returnData = {
        items: itemsToReturn.map((item) => ({
          receiptItemId: item.serverItemId || item.id,
          quantity: item.quantity,
        })),
        reason: returnReason,
      };

      // Отправляем запрос на возврат
      await cashierApi.createReturn(
        warehouseId,
        selectedReceipt.id,
        returnData
      );

      setSuccess('Возврат успешно оформлен');
      setSelectedReceipt(null);
      setReceiptItems([]);
      setSelectedItems({});
      setReceipts([]);
      setSearchQuery('');
      setReturnReason('');
    } catch (err) {
      console.error('Ошибка при оформлении возврата:', err);
      setError('Не удалось оформить возврат');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ₽`;
  };

  return (
    <div className={styles.returnsPage}>
      <h2 className={styles.pageTitle}>Возврат товара</h2>

      <div className={styles.searchSection}>
        <div className={styles.searchForm}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите номер чека"
            className={styles.searchInput}
          />
          <button
            onClick={handleSearch}
            className={styles.searchButton}
            disabled={loading}
          >
            {loading ? 'Поиск...' : 'Найти чек'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.contentContainer}>
        {receipts.length > 0 && !selectedReceipt && (
          <div className={styles.receiptsList}>
            <h2>Найденные чеки</h2>
            <div className={styles.receiptsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.headerCell}>№</div>
                <div className={styles.headerCell}>Дата</div>
                <div className={styles.headerCell}>Сумма</div>
                <div className={styles.headerCell}>Действия</div>
              </div>
              <div className={styles.tableBody}>
                {receipts.map((receipt) => (
                  <div key={receipt.id} className={styles.tableRow}>
                    <div className={styles.cell}>{receipt.number}</div>
                    <div className={styles.cell}>
                      {formatDateTime(receipt.createdAt)}
                    </div>
                    <div className={styles.cell}>
                      {formatCurrency(receipt.finalAmount)}
                    </div>
                    <div className={styles.cell}>
                      <button
                        className={styles.selectButton}
                        onClick={() => handleReceiptSelect(receipt)}
                      >
                        Выбрать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReceipt && (
          <div className={styles.returnForm}>
            <div className={styles.receiptHeader}>
              <h2>Возврат по чеку №{selectedReceipt.number}</h2>
              <div className={styles.receiptInfo}>
                <div>
                  <strong>Дата:</strong>{' '}
                  {formatDateTime(selectedReceipt.createdAt)}
                </div>
                <div>
                  <strong>Сумма чека:</strong>{' '}
                  {formatCurrency(selectedReceipt.finalAmount)}
                </div>
                <div>
                  <strong>Способ оплаты:</strong>{' '}
                  {selectedReceipt.paymentMethod === 'CASH' ||
                  selectedReceipt.paymentMethod === 'cash'
                    ? 'Наличные'
                    : selectedReceipt.paymentMethod === 'CARD' ||
                      selectedReceipt.paymentMethod === 'card'
                    ? 'Карта'
                    : 'Не указан'}
                </div>
              </div>
            </div>

            <h3>Выберите товары для возврата</h3>
            <div className={styles.itemsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    onChange={() => {
                      const allSelected = receiptItems.every(
                        (item) => selectedItems[item.id]
                      );
                      const newSelectedItems: Record<string, boolean> = {};
                      receiptItems.forEach((item) => {
                        newSelectedItems[item.id] = !allSelected;
                      });
                      setSelectedItems(newSelectedItems);
                    }}
                    checked={
                      receiptItems.length > 0 &&
                      receiptItems.every((item) => selectedItems[item.id])
                    }
                  />
                </div>
                <div className={styles.headerCell}>Товар</div>
                <div className={styles.headerCell}>Цена</div>
                <div className={styles.headerCell}>Кол-во</div>
                <div className={styles.headerCell}>Сумма</div>
              </div>
              <div className={styles.tableBody}>
                {receiptItems.map((item) => (
                  <div key={item.id} className={styles.tableRow}>
                    <div className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={!!selectedItems[item.id]}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                    </div>
                    <div className={styles.cell}>{item.name}</div>
                    <div className={styles.cell}>
                      {formatCurrency(item.price)}
                    </div>
                    <div className={styles.cell}>{item.quantity}</div>
                    <div className={styles.cell}>
                      {formatCurrency(item.finalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.returnSummary}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Сумма возврата:</span>
                <span className={styles.totalValue}>
                  {formatCurrency(calculateReturnAmount())}
                </span>
              </div>

              <div className={styles.returnReasonSection}>
                <h3>Причина возврата</h3>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Укажите причину возврата"
                  className={styles.reasonTextarea}
                />
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setSelectedReceipt(null);
                    setReceiptItems([]);
                    setSelectedItems({});
                    setReturnReason('');
                  }}
                >
                  Отмена
                </button>
                <button
                  className={styles.returnButton}
                  onClick={handleReturn}
                  disabled={
                    Object.values(selectedItems).filter(Boolean).length === 0 ||
                    loading
                  }
                >
                  {loading ? 'Оформление...' : 'Оформить возврат'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {success && <div className={styles.success}>{success}</div>}
    </div>
  );
};

export default ReturnsPage;
