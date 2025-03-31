import React from 'react';
import { ReceiptItem } from '../../types/cashier';
import styles from './ProductsTable.module.css';

interface ProductsTableProps {
  items: ReceiptItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
}) => {
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
              <tr key={item.id} className={styles.tableRow}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.price.toFixed(2)}</td>
                <td>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.quantityButton}
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span className={styles.quantityValue}>
                      {item.quantity}
                    </span>
                    <button
                      className={styles.quantityButton}
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  {item.discountPercent > 0
                    ? `${item.discountPercent}% (${item.discountAmount.toFixed(
                        2
                      )})`
                    : '-'}
                </td>
                <td>{item.finalAmount.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
