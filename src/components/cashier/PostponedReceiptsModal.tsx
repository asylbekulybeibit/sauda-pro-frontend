import React from 'react';
import styles from './PostponedReceiptsModal.module.css';
import { Receipt } from '../../types/cashier';

interface PostponedReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (receipt: Receipt) => void;
  onPostpone: () => void;
  postponedReceipts: Receipt[];
}

const PostponedReceiptsModal: React.FC<PostponedReceiptsModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onPostpone,
  postponedReceipts,
}) => {
  if (!isOpen) return null;

  const formatReceiptDetails = (receipt: Receipt) => {
    const items = receipt.items || [];
    if (items.length === 0) return '';

    // Берем первые два товара для отображения
    const displayItems = items.slice(0, 2);
    const itemsText = displayItems.map((item) => item.name).join(', ');

    // Если есть еще товары, добавляем многоточие
    return items.length > 2 ? `${itemsText}...` : itemsText;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.plusButton} onClick={onPostpone}>
            +
          </div>
          {postponedReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className={styles.receiptItem}
              onClick={() => onSelect(receipt)}
            >
              <div className={styles.receiptNumber}>
                Чек: {receipt.receiptNumber?.replace('R-', '')}
              </div>
              <div className={styles.receiptDetails}>
                {formatReceiptDetails(receipt)}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.modalBody}>
          {postponedReceipts.length === 0 && (
            <div className={styles.emptyState}>Нет отложенных чеков</div>
          )}
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          ЗАКРЫТЬ
        </button>
      </div>
    </div>
  );
};

export default PostponedReceiptsModal;
