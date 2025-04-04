import React from 'react';
import styles from './TotalPanel.module.css';

interface TotalPanelProps {
  total: number;
  received: number;
  change: number;
  onPay: () => void;
  onClear: () => void;
  onAddFastProduct: () => void;
  onChangeQuantity: () => void;
  onExtraFunctions: () => void;
  onRemove: () => void;
  onPostpone: () => void;
  onIncreaseQuantity: () => void;
  onDecreaseQuantity: () => void;
}

const TotalPanel: React.FC<TotalPanelProps> = ({
  total,
  received,
  change,
  onPay,
  onClear,
  onAddFastProduct,
  onChangeQuantity,
  onExtraFunctions,
  onRemove,
  onPostpone,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) => {
  return (
    <div className={styles.totalPanel}>
      <div className={styles.totals}>
        <div className={styles.totalItem}>
          <div className={styles.totalLabel}>ИТОГО</div>
          <div className={styles.totalValue}>{total.toFixed(2)}</div>
        </div>
        <div className={styles.totalItem}>
          <div className={styles.totalLabel}>ПОЛУЧЕНО</div>
          <div className={styles.totalValue}>{received.toFixed(2)}</div>
        </div>
        <div className={styles.totalItem}>
          <div className={styles.totalLabel}>СДАЧА</div>
          <div className={styles.totalValue}>{change.toFixed(2)}</div>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionRow}>
          <button className={styles.actionButton} onClick={onAddFastProduct}>
            БЫСТРЫЕ{'\n'}ТОВАРЫ
          </button>
          <button className={styles.actionButton} onClick={onChangeQuantity}>
            КОЛИЧЕСТВО
          </button>
          <button className={styles.actionButton} onClick={onExtraFunctions}>
            ДОП.{'\n'}ФУНКЦИИ
          </button>
          <button className={styles.actionButton} onClick={onIncreaseQuantity}>
            +
          </button>
        </div>

        <div className={styles.actionRow}>
          <button className={styles.actionButton}>ИЗМЕНИТЬ{'\n'}ТОВАР</button>
          <button className={styles.actionButton} onClick={onPostpone}>
            ОТЛОЖКА
          </button>
          <button className={styles.actionButton}>
            УНИВЕРСАЛЬНЫЙ{'\n'}ПРОДУКТ
          </button>
          <button className={styles.actionButton} onClick={onDecreaseQuantity}>
            -
          </button>
        </div>

        <div className={styles.actionRow}>
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={onRemove}
          >
            УДАЛИТЬ
          </button>
          <button
            className={`${styles.actionButton} ${styles.payButton}`}
            onClick={onPay}
          >
            ОПЛАТА
          </button>
        </div>
      </div>
    </div>
  );
};

export default TotalPanel;
