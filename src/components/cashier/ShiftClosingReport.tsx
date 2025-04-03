import React from 'react';
import { ShiftClosingData } from '../../types/cashier';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import styles from './ShiftClosingReport.module.css';

interface ShiftClosingReportProps {
  data: ShiftClosingData;
  onPrint: () => void;
  onClose: () => void;
}

// Функция для перевода системных названий методов оплаты
const translatePaymentMethod = (methodName: string): string => {
  const translations: { [key: string]: string } = {
    cash: 'Наличные',
    card: 'Банковская карта',
    qr: 'QR-код',
  };

  // Если это системное название, возвращаем перевод, иначе оставляем как есть
  return translations[methodName.toLowerCase()] || methodName;
};

export const ShiftClosingReport: React.FC<ShiftClosingReportProps> = ({
  data,
  onPrint,
  onClose,
}) => {
  console.log('[ShiftClosingReport] Rendering with data:', {
    shiftId: data.id,
    totalSales: data.totalSales,
    totalReturns: data.totalReturns,
    paymentMethodsCount: data.paymentMethods?.length,
  });

  console.log(
    '[ShiftClosingReport] Full payment methods data:',
    data.paymentMethods
  );

  // Group payment methods by operation type
  const salesMethods = data.paymentMethods.filter(
    (method) => method.operationType === 'sale'
  );
  const returnMethods = data.paymentMethods.filter(
    (method) => method.operationType === 'return'
  );

  console.log('[ShiftClosingReport] Grouped payment methods:', {
    salesMethods: salesMethods.map((m) => ({
      id: m.methodId,
      name: m.methodName,
      total: m.total,
      sales: m.sales,
      returns: m.returns,
      type: m.operationType,
    })),
    returnMethods: returnMethods.map((m) => ({
      id: m.methodId,
      name: m.methodName,
      total: m.total,
      sales: m.sales,
      returns: m.returns,
      type: m.operationType,
    })),
  });

  // Calculate totals
  const totalSales = data.totalSales;
  const totalReturns = data.totalReturns;
  const revenue = data.totalNet;

  console.log('[ShiftClosingReport] Calculated totals:', {
    totalSales,
    totalReturns,
    revenue,
  });

  return (
    <div className={styles.reportContainer}>
      <div className={styles.reportHeader}>
        <h2>Отчет о закрытии смены</h2>
        <div className={styles.actions}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              console.log('[ShiftClosingReport] Print button clicked');
              onPrint();
            }}
            className={styles.printButton}
          >
            Печать
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={() => {
              console.log('[ShiftClosingReport] Close button clicked');
              onClose();
            }}
            className={styles.closeButton}
          >
            Закрыть
          </Button>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Информация о смене</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Склад:</span>
            <span className={styles.value}>{data.warehouse.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Касса:</span>
            <span className={styles.value}>{data.cashRegister.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Кассир:</span>
            <span className={styles.value}>{data.cashier.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Открытие:</span>
            <span className={styles.value}>
              {formatDateTime(data.startTime)}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Закрытие:</span>
            <span className={styles.value}>{formatDateTime(data.endTime)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Итоги смены</h3>

        {/* Продажи */}
        <div className={styles.totalsSection}>
          <div className={styles.totalHeader}>
            <span className={styles.label}>Продажи:</span>
            <span className={styles.totalValue}>
              {formatCurrency(totalSales)}
            </span>
          </div>
          <div className={styles.methodsList}>
            {salesMethods.length > 0 ? (
              salesMethods.map((method) => {
                console.log(
                  '[ShiftClosingReport] Rendering sale method:',
                  method
                );
                return (
                  <div key={method.methodId} className={styles.methodRow}>
                    <span className={styles.methodName}>
                      {translatePaymentMethod(method.methodName)}
                    </span>
                    <span className={styles.methodAmount}>
                      {formatCurrency(method.total)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className={styles.methodRow}>
                <span className={styles.methodName}>Нет продаж</span>
                <span className={styles.methodAmount}>{formatCurrency(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Возвраты */}
        <div className={styles.totalsSection}>
          <div className={styles.totalHeader}>
            <span className={styles.label}>Возвраты:</span>
            <span className={styles.totalValue}>
              {formatCurrency(-totalReturns)}
            </span>
          </div>
          <div className={styles.methodsList}>
            {returnMethods.length > 0 ? (
              returnMethods.map((method) => {
                console.log(
                  '[ShiftClosingReport] Rendering return method:',
                  method
                );
                return (
                  <div key={method.methodId} className={styles.methodRow}>
                    <span className={styles.methodName}>
                      {translatePaymentMethod(method.methodName)}
                    </span>
                    <span className={styles.methodAmount}>
                      {formatCurrency(method.total)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className={styles.methodRow}>
                <span className={styles.methodName}>Нет возвратов</span>
                <span className={styles.methodAmount}>{formatCurrency(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Выручка */}
        <div className={`${styles.totalsSection} ${styles.revenue}`}>
          <div className={styles.totalHeader}>
            <span className={styles.label}>Выручка:</span>
            <span className={styles.totalValue}>{formatCurrency(revenue)}</span>
          </div>
        </div>
      </div>

      {data.notes && (
        <div className={styles.section}>
          <h3>Примечания</h3>
          <div className={styles.notes}>{data.notes}</div>
        </div>
      )}
    </div>
  );
};
