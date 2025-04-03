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

export const ShiftClosingReport: React.FC<ShiftClosingReportProps> = ({
  data,
  onPrint,
  onClose,
}) => {
  return (
    <div className={styles.reportContainer}>
      <div className={styles.reportHeader}>
        <h2>Отчет о закрытии смены</h2>
        <div className={styles.actions}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={onPrint}
            className={styles.printButton}
          >
            Печать
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={onClose}
            className={styles.closeButton}
          >
            Закрыть
          </Button>
        </div>
      </div>

      <div className={styles.reportContent}>
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
              <span className={styles.value}>
                {formatDateTime(data.endTime)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Итоги смены</h3>
          <div className={styles.totalsGrid}>
            <div className={styles.totalRow}>
              <span className={styles.label}>Начальная сумма:</span>
              <span className={styles.value}>
                {formatCurrency(data.initialAmount)}
              </span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.label}>Продажи:</span>
              <span className={styles.value}>
                {formatCurrency(data.totalSales)}
              </span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.label}>Возвраты:</span>
              <span className={styles.value}>
                {formatCurrency(data.totalReturns)}
              </span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.label}>Итого:</span>
              <span className={styles.value}>
                {formatCurrency(data.totalNet)}
              </span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.label}>Финальная сумма:</span>
              <span className={styles.value}>
                {formatCurrency(data.finalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Итоги по способам оплаты</h3>
          <div className={styles.paymentMethodsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.methodName}>Способ оплаты</div>
              <div className={styles.amount}>Продажи</div>
              <div className={styles.amount}>Возвраты</div>
              <div className={styles.amount}>Итого</div>
            </div>
            {data.paymentMethods.map((method) => (
              <div key={method.methodId} className={styles.tableRow}>
                <div className={styles.methodName}>{method.methodName}</div>
                <div className={styles.amount}>
                  {formatCurrency(method.sales)}
                </div>
                <div className={styles.amount}>
                  {formatCurrency(method.returns)}
                </div>
                <div className={styles.amount}>
                  {formatCurrency(method.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.notes && (
          <div className={styles.section}>
            <h3>Примечания</h3>
            <div className={styles.notes}>{data.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};
