import React, { useState } from 'react';
import { ReceiptItem } from '../../types/cashier';
import styles from './ProductsTable.module.css';

interface ProductsTableProps {
  items: ReceiptItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  selectedItemId,
  onSelectItem,
}) => {
  const handleRowClick = (itemId: string) => {
    onSelectItem(selectedItemId === itemId ? null : itemId);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.productsTable}>
        <thead>
          <tr>
            <th className={styles.checkboxColumn}>
              <input type="checkbox" />
            </th>
            <th className={styles.numberColumn}>#</th>
            <th className={styles.nameColumn}>НАИМЕНОВАНИЕ</th>
            <th className={styles.priceColumn}>ЦЕНА ▼</th>
            <th className={styles.quantityColumn}>КОЛИЧЕСТВО</th>
            <th className={styles.discountColumn}>СКИДКА</th>
            <th className={styles.totalColumn}>СУММА</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.emptyState}>
                Список пуст
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr
                key={item.id}
                className={`${styles.tableRow} ${
                  selectedItemId === item.id ? styles.selected : ''
                }`}
                onClick={() => handleRowClick(item.id)}
              >
                <td>
                  <input type="checkbox" />
                </td>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{Number(item.price).toFixed(2)}</td>
                <td>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.quantityButton}
                      data-type="minus"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item.id, item.quantity - 1);
                      }}
                    >
                      -
                    </button>
                    <span className={styles.quantityValue}>
                      {item.quantity}
                    </span>
                    <button
                      className={styles.quantityButton}
                      data-type="plus"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(item.id, item.quantity + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  {item.discountPercent > 0
                    ? `${item.discountPercent}% (${Number(
                        item.discountAmount
                      ).toFixed(2)})`
                    : '-'}
                </td>
                <td>{Number(item.finalAmount).toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
